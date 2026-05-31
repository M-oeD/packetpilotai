---
title: 'Failure Library #01: The Spanning-Tree Loop That Hit at 3:14 AM'
description: 'A 28-minute network outage caused by a $19 unmanaged switch, a single line of "fix-it" config from 2019, and a backup job. The full post-mortem — symptoms, false leads, the tell that cracked it, the fix, and the Claude prompt that would have saved 15 minutes.'
pubDate: '2026-05-20'
stream: 'failure-library'
streamNum: 1
heroAscii: |
  03:14:08  ALERT  site-wide ping loss · 47% · all VLANs
  03:14:22  ALERT  core-sw01 cpu 98%
  03:14:31  ALERT  mac-flap storm · 2,400 events/sec
  03:16:00  PAGE   on-call escalation
  03:18:42  on-call online · "wan looks fine"
  03:24:11  on-call: "this isn't a DDoS"
  03:31:55  on-call: "wait — why is bpdu-filter set on Gi1/0/14?"
  03:33:08  RESOLVED  port Gi1/0/14 [BLK]  cpu 5%
  03:42:00  network stable

  [!] root cause: rogue unmanaged switch + bpdufilter enable on uplink
  [→] 28 minutes from alert to root cause · could have been three
---

The page came in at 3:14 AM. Site-wide ping loss across every VLAN. Core switch CPU at 98%. By 3:42 the network was stable again, and by 9 AM I'd walked into the AV closet and found a $19 TP-Link unmanaged switch plugged into the wall with two uplink cables coming out of it — both running back to the same access switch. A perfect Layer 2 loop, hidden in plain sight by a single line of config someone had added five years earlier as a "quick fix." This is the post-mortem.

---

## What I Saw First

3:14 AM. PagerDuty fires. Three alerts inside 30 seconds:

```
03:14:08  ALERT  site-wide ping loss 47% on all VLANs
03:14:22  ALERT  core-sw01 cpu 98%
03:14:31  ALERT  mac-flap storm  2400 events/sec
```

The MAC-flap alert is the giveaway in retrospect. At 3:14 I missed it. I was nine minutes from a working laptop and operating on instinct.

I logged into the core switch:

```
core-sw01# show processes cpu sorted | exclude 0.00
CPU utilization for five seconds: 98%/2%; one minute: 94%; five minutes: 71%
 PID  Runtime(ms)  Invoked     uSecs   5Sec   1Min   5Min  TTY  Process
  87  4,238,902    8,901,142   476     71.4%  68.1%  52.3%   0  HLFM address lear
 121    830,015    1,820,331   456     12.8%  11.2%   9.7%   0  STP Protocols
```

`HLFM address learning` at 71% CPU. That's the hardware learning the MAC table — and it's learning constantly. Healthy networks don't do that.

```
core-sw01# show mac address-table count
Dynamic Address Count: 4,812
Total MAC Addresses In Use: 4,827
```

About right for the building. So the table isn't bloated — it's just *churning*.

---

## The First Wrong Theory (Cost: 15 Minutes)

My first read: "Compromised endpoint flooding the network." Backup window had just started; if a host got popped and was scanning aggressively, it would show up like this. I opened the IDS console.

```
[ Suricata · last 5 min ]
─────────────────────────
total alerts:           12
ET INFO matches:         8
ET TROJAN matches:       0
ET POLICY matches:       4
```

Nothing. Twelve alerts, all benign. If this were a compromise generating 2,400 MAC events per second, the IDS would be screaming.

I spent fifteen minutes looking anyway. Pulled NetFlow. Sorted by top talkers. Nothing remotely unusual — the same backup host pushing data to the NAS, the same DNS chatter, the same telemetry to the SIEM.

**Lesson from this branch:** the data was already telling me it wasn't a compromise. I trusted my first hypothesis past the point where evidence contradicted it. Two-thirds of incident triage time is spent here.

---

## The Tell That Cracked It

I went back to the MAC table and watched it move:

```
core-sw01# show mac address-table address 00:1a:e8:42:0f:b1
Mac Address Table
-------------------------------------------

Vlan   Mac Address       Type        Ports
----   -----------       --------    -----
 100   001a.e842.0fb1    DYNAMIC     Gi1/0/14

core-sw01# ! ... 8 seconds later ...
core-sw01# show mac address-table address 00:1a:e8:42:0f:b1
 100   001a.e842.0fb1    DYNAMIC     Gi1/0/22

core-sw01# ! ... 4 seconds later ...
core-sw01# show mac address-table address 00:1a:e8:42:0f:b1
 100   001a.e842.0fb1    DYNAMIC     Gi1/0/14
```

The same MAC address bouncing between two interfaces every few seconds.

That is *not* a compromise. That is a **Layer 2 loop**.

When a switch sees a frame arrive from MAC X on port A, it learns "MAC X is on port A." When that same MAC then arrives on port B (because the frame looped through some other path), the switch updates: "MAC X is now on port B." Repeat at line rate and the switch's CPU melts trying to keep the forwarding table consistent.

But this network has spanning tree. STP exists to *prevent* exactly this. Why didn't it block one of the redundant paths?

```
core-sw01# show spanning-tree vlan 100 detail | include from|forwarding|blocking
Number of topology changes 2 last change occurred 3d22h ago
Port 26 (GigabitEthernet1/0/14) of VLAN0100 is forwarding
Port 27 (GigabitEthernet1/0/15) of VLAN0100 is forwarding
Port 30 (GigabitEthernet1/0/18) of VLAN0100 is forwarding
Port 34 (GigabitEthernet1/0/22) of VLAN0100 is forwarding
```

Everything is "forwarding." Spanning tree thinks there's no loop. Which means STP isn't *seeing* the loop. Which means BPDUs aren't reaching the offending interface.

```
core-sw01# show running-config interface Gi1/0/14
interface GigabitEthernet1/0/14
 switchport mode access
 switchport access vlan 100
 spanning-tree bpdufilter enable
 spanning-tree portfast
```

There it is. `spanning-tree bpdufilter enable`. On an access port.

---

## What `bpdufilter` Actually Does (And Why It's a Footgun)

BPDUs (Bridge Protocol Data Units) are how switches running spanning tree talk to each other to detect loops. There are three related commands that sound similar and do very different things:

| Command | What it does | When to use |
|---|---|---|
| `spanning-tree portfast` | Skip the listening/learning states; go straight to forwarding | Access ports to end devices |
| `spanning-tree bpduguard enable` | If a BPDU is ever received on this port, shut the port down | Access ports — **safe default** |
| `spanning-tree bpdufilter enable` | Stop sending **and** stop receiving BPDUs on this port | **Almost never** |

`bpdufilter` makes the port deaf to spanning tree. If somebody plugs a switch into a `bpdufilter`-enabled port and creates a loop, STP literally cannot see it. The port behaves like a dumb hub — it just forwards whatever shows up.

This line of config was added in 2019, four employers and three NOC engineers ago. The git blame on the change ticket says it was to silence a "BPDU guard misuse" log spam after an executive's office had a daisy-chained switch under the desk. Somebody typed `bpdufilter` when they meant `bpduguard disable`. The change was approved. It survived five years of audits because it was on one port out of two hundred and nobody read the running-config line-by-line.

---

## The Fix

Three commands. Took 11 seconds.

```
core-sw01# configure terminal
core-sw01(config)# interface Gi1/0/14
core-sw01(config-if)# no spanning-tree bpdufilter enable
core-sw01(config-if)# spanning-tree bpduguard enable
core-sw01(config-if)# end
```

The moment BPDU filter came off, the downstream loop began emitting BPDUs into the core. STP recalculated within two seconds. One of the redundant paths flipped to `BLK`. MAC churn went to zero.

```
core-sw01# show spanning-tree vlan 100 | include 1/0/14
Gi1/0/14            BLK 4         128.26   Edge P2p
```

CPU dropped from 98% to 5% in under ten seconds. The on-call channel went quiet for the first time in 28 minutes.

---

## The Real Root Cause

This was not a spanning tree failure. STP did exactly what it was designed to do, the instant we let it.

The actual root cause chain:

1. **A user added a network device without a change ticket.** Marketing intern bought a $19 unmanaged switch for a podcast booth, plugged it in with two cables for "redundancy."
2. **The upstream port had `bpdufilter` enabled from a 2019 config change.** This made the port deaf to STP, so the loop was invisible to the rest of the network.
3. **MAC-flap monitoring existed but didn't page.** The alert fired alongside two others; on-call's first read was the more familiar "CPU at 98%" alert.
4. **Backup traffic was the trigger, not the cause.** The loop had been live since the previous afternoon. It only became visible when 3 AM backup traffic raised the broadcast rate past the storm threshold.

Any one of those four broken, the incident doesn't happen. Three of them are process problems. One is a config bug.

---

## The Claude Prompt That Would Have Saved 15 Minutes

The 15 minutes I spent chasing a compromise theory is the cost of starting with a hypothesis instead of the data. Here is the prompt I now keep in my Failure Library template:

```
I have a network incident. Site-wide ping loss across every VLAN.
Core switch CPU is at 98%, and the top process is "HLFM address
learning" at 71% CPU.

Here is the MAC address table count: [paste].
Here are the MAC events for the noisiest MAC over the last 60 seconds: [paste].
Here is the spanning-tree state for the affected VLAN: [paste].
Here is the running-config for the access ports on that VLAN: [paste].

Rank the three most likely root causes from this evidence alone.
For the top one, tell me exactly which command will confirm it,
and which command will fix it. Do not propose a compromise or
DDoS theory unless the evidence supports it.
```

Claude lands on "Layer 2 loop, BPDU filtering interferes with STP detection" in the first response when given that data. The "Do not propose a compromise theory" line is the key — without it, the model goes where humans go: toward the more familiar drama.

---

## What Changed After

- **Removed `bpdufilter` from every port.** Replaced with `bpduguard enable`. Three other ports had the same legacy config. None had created problems yet. All were ticking.
- **Network change tickets are now mandatory for any device with an Ethernet port.** Even unmanaged switches. Even cables.
- **MAC-flap alerts now page directly.** No more bundling them under "CPU high."
- **Added a quarterly running-config audit** for STP-related commands. The grep is `bpdufilter\|no spanning-tree`.

---

## The One-Line Takeaway

**`bpdufilter` makes spanning tree blind. `bpduguard` makes it bite. Use the second. Never the first.**

---

## Frequently Asked Questions

**What is the difference between `spanning-tree bpdufilter` and `spanning-tree bpduguard`?**
`bpduguard` shuts down a port the moment it receives a BPDU — protective. `bpdufilter` stops the port from sending or receiving BPDUs entirely — destructive. `bpduguard` is the correct default for access ports running `portfast`. `bpdufilter` should almost never be enabled; it blinds spanning tree to anything happening on that port, which means a downstream loop becomes invisible until traffic levels make it visible the hard way.

**How do I detect a Layer 2 loop on a Cisco switch?**
The fastest signal is MAC address flapping: the same MAC address appearing on two different ports within seconds. Run `show mac address-table address <MAC>` twice in quick succession; if the port changes, you have a loop. Other signals: `HLFM address learning` CPU spikes, broadcast rates above the historical baseline, and any port in `forwarding` state that should not have a redundant path.

**Why didn't spanning tree prevent this loop automatically?**
It would have — that's what spanning tree exists for. The reason it didn't in this case is that one of the involved ports had `spanning-tree bpdufilter enable` configured, which made it deaf to spanning tree's loop-detection protocol. Spanning tree only blocks ports where it can see redundant paths via BPDUs. Block the BPDUs and you blind the algorithm.

**Should I enable BPDU guard or BPDU filter on access ports?**
BPDU guard. Every time. `spanning-tree bpduguard enable` paired with `spanning-tree portfast` is the safe default for any port connected to an end device. If anyone plugs a switch into that port, BPDU guard will shut the port down — loud and unmistakable. The opposite command, `bpdufilter`, hides exactly the failure mode you want to catch.

---

## Next in the Failure Library

Failure #02 — a DNS outage that traced back to a forgotten `hosts` file from a 2018 migration. Coming in two weeks.

— **Subscribe to Packet Drop** (newsletter form below) to get the next post-mortem the moment it ships.

— **Want the diagnostic prompts ready-to-paste?** [Get the Prompt Pack](/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=failure-01-spanning-tree-loop-at-3am) — 60 production prompts for network admins, $29, lifetime updates.
