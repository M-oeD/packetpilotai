---
title: 'The Network Incident Checklist: 8 Steps in the First 5 Minutes'
description: 'Most network admins know the tools — they just freeze on step zero. This checklist gives you a repeatable triage sequence for any incident, with copy-paste commands and Claude prompts at every step.'
pubDate: '2026-05-29'
heroAscii: |
  INCIDENT TRIAGE  ·  T+0:00
  ────────────────────────────────────
  [1] scope      ✓  one user, VLAN 20
  [2] ping test  ✓  gateway reachable
  [3] traceroute ✗  hop 3 drops 100%
  [4] interface  ✓  no errors on Gi0/2
  [5] DNS        ✓  resolving normally
  ────────────────────────────────────
  → ISP segment. Open ticket now.
---

"The network is down." You get the call. Your first thought isn't "run ping" — it's *where do I even start?*

That's not a knowledge gap. It's a sequence gap. The CCNA teaches you what the tools do. No one teaches you the order.

This checklist fixes that. Run these 8 steps in order every time, and you'll either have a root cause or a confident ISP ticket in under five minutes.

---

## Before You Touch Anything: Write Down the Complaint

This sounds obvious and everyone skips it. Don't.

Ask one question before running a single command:

> **"What exactly is broken, who is affected, and when did it start?"**

| Answer | What it tells you |
|---|---|
| One user, one app | Workstation or app — probably not the network |
| One user, everything | Workstation NIC, switch port, or their VLAN |
| One floor / one VLAN | Distribution switch, VLAN config, or uplink |
| Everyone, everything | Core switch, router, or WAN |
| Started at a specific time | Correlate with change log or scheduled task |

**Claude prompt to paste now:**
```
I have a network incident. Here are the details:
- Affected users: [how many, which location or VLAN]
- What is broken: [specific apps, or "everything"]
- When it started: [time and date]
- Any recent changes: [yes/no — what?]

Based on this, tell me the most likely root cause categories and the first two things I should check.
```

---

## Step 1: Confirm Network vs. Workstation (30 seconds)

On the affected machine, run these four pings in sequence. Stop at the first failure.

```powershell
# Windows
ping 127.0.0.1       # loopback — is TCP/IP stack up?
ping 192.168.1.1     # replace with actual gateway IP
ping 8.8.8.8         # internet IP — no DNS needed
ping google.com      # DNS + internet

# Linux / Mac
ping -c 4 127.0.0.1
ping -c 4 192.168.1.1
ping -c 4 8.8.8.8
ping -c 4 google.com
```

**Pass/fail:**

| What fails | Where the problem is |
|---|---|
| 127.0.0.1 | TCP/IP stack — restart NIC or OS |
| Gateway | LAN segment: cable, switch port, or VLAN |
| 8.8.8.8 | Routing or WAN |
| google.com only | DNS only — see Step 4 |
| All pass | "Slow" not "down" — go to Step 5 |

If **gateway fails**, everything after this is LAN investigation. Skip straight to Step 6.

---

## Step 2: Scope It — Is It One Device or Many? (30 seconds)

Log into another device on the same subnet. Run the same ping test.

- **Second device also fails** → problem is the switch, VLAN, or uplink. Not the workstation.
- **Second device works fine** → problem is isolated to the first device: NIC, port, IP config, or cable.

This single check saves hours of chasing the wrong thing.

```powershell
# Quick IP config check on the affected machine
# Windows
ipconfig /all

# Linux
ip addr show
```

Look for: no IP assigned (DHCP failure), wrong subnet, wrong gateway, or link-local address (169.254.x.x on Windows means DHCP failed).

---

## Step 3: Traceroute — Find the Hop (45 seconds)

If the gateway is reachable but internet is not, traceroute tells you exactly where packets stop:

```powershell
# Windows
tracert 8.8.8.8

# Linux / Mac
traceroute 8.8.8.8
```

**What to look for:**

| What you see | What it means |
|---|---|
| `* * *` starting at hop 2 or 3 | Problem at your router or WAN handoff |
| RTT jumps by 100ms+ at one hop | Congestion or a problem at that segment |
| `* * *` at one hop, normal after | That device ignores ICMP — not a real problem |
| Loss from hop 3 onward | ISP |

**The key rule:** Find the first hop that fails or spikes, then look at the device *before* it. That device is the one dropping your traffic.

**Claude prompt for interpreting your traceroute:**
```
Here is a traceroute output from a network incident:
[paste your traceroute output here]

Tell me:
1. Where exactly the problem appears to be
2. Whether this looks like a local issue or an ISP issue
3. What I should check next
```

---

## Step 4: DNS — Is It Resolution or Routing? (30 seconds)

If `ping 8.8.8.8` works but `ping google.com` fails, you have a DNS problem — not a network problem.

```bash
# Test DNS resolution directly
# Windows
nslookup google.com
nslookup google.com 8.8.8.8    # force public DNS to bypass your resolver

# Linux / Mac
dig google.com
dig @8.8.8.8 google.com        # bypass your internal resolver
```

If `nslookup google.com 8.8.8.8` works but `nslookup google.com` fails, your internal DNS resolver is the problem — not the network path.

Quick test to confirm: temporarily set DNS to `8.8.8.8` on the affected machine. If everything works immediately, your DNS server needs attention.

---

## Step 5: Is It Slow or Actually Down?

If pings succeed but users say it "feels broken," measure before you dig:

```powershell
# Extended ping — 50 packets to look for loss and jitter
# Windows
ping 8.8.8.8 -n 50
ping 192.168.1.1 -n 50

# Linux / Mac
ping -c 50 8.8.8.8
ping -c 50 192.168.1.1
```

**Thresholds:**
- LAN loss: **any loss is a problem** (should be 0%)
- WAN loss: >1% will degrade voice and video
- LAN latency: >5ms average is worth investigating
- WAN latency: compare against your baseline — a sudden jump matters more than the absolute number

If loss to your gateway is >0%, go to Step 6 immediately. That's a physical layer issue.

---

## Step 6: Check the Switch Port (60 seconds)

SSH to the switch and check the port the affected device is on:

```
show interfaces GigabitEthernet0/1
```

Look at these counters specifically:

```
Input errors:    0    ← any non-zero = problem
CRC:             0    ← bad cable, SFP, or duplex mismatch
Runts:           0    ← duplex mismatch or collision
Output drops:    0    ← congestion or queue overflow
```

Also check speed and duplex — this is the #1 overlooked cause of packet loss:

```
show interfaces GigabitEthernet0/1 | include duplex|speed
```

You want: `Full-duplex, 1000Mb/s`. If you see `Half-duplex` or `auto` on either side with errors, fix it:

```
interface GigabitEthernet0/1
 duplex full
 speed 1000
```

**If you see CRC errors:** swap the cable first. CRC errors point to physical layer — bad cable, bad SFP, or a port going bad. Try a different switch port too.

**Claude prompt for interpreting `show interfaces` output:**
```
Here is the output of "show interfaces [interface]" from a Cisco IOS switch:
[paste output here]

Tell me:
1. Are there any error counters I should be concerned about?
2. What does each non-zero counter suggest as a root cause?
3. What should I fix first?
```

---

## Step 7: Check for Bandwidth Saturation (30 seconds)

A link that's maxed out looks exactly like packet loss to the user. Check utilization on the uplink:

```
show interfaces GigabitEthernet0/1 | include rate
```

Look at `5 minute input rate` and `5 minute output rate`. If either is above 80% of the link's rated capacity, you've found your problem.

For WAN links, check the router's WAN interface the same way. If it's consistently saturated:
1. Check for unusual traffic (backup job running, someone streaming)
2. Apply QoS to protect voice and video in the short term
3. Plan a link upgrade if it's a recurring pattern

---

## Step 8: Escalate or Confirm ISP

If the problem is at or beyond hop 2 (your router's next hop), you're dealing with the ISP. Before calling:

```powershell
# Document the evidence first
ping <isp-gateway-ip> -n 100    # first hop outside your router
tracert 8.8.8.8                 # save full output
```

Also check your WAN interface for errors:
```
show interfaces [WAN-interface-name]
```

CRC errors on the WAN port = physical layer issue between you and the ISP handoff. That's their problem, but you need that data to open a meaningful ticket.

**Claude prompt to write the ISP ticket:**
```
I need to open a support ticket with my ISP for a network issue.

Evidence I have:
- Traceroute output: [paste here]
- WAN interface error counters: [paste here]
- Ping loss percentage: [X%]
- Time the issue started: [time]

Write a professional, technical support ticket that clearly describes the issue and includes all the relevant data. Keep it factual and specific.
```

---

## The Full Checklist at a Glance

```
INCIDENT STARTS
│
├─ [0] Scope — how many users? what's broken? when?
│
├─ [1] Ping: loopback → gateway → 8.8.8.8 → google.com
│   └─ Fails at gateway? → Step 6 (physical layer)
│   └─ Fails at 8.8.8.8? → Step 3 (traceroute)
│   └─ Fails at google.com only? → Step 4 (DNS)
│   └─ All pass but slow? → Step 5 (loss + jitter)
│
├─ [2] Second device on same subnet — isolated or widespread?
│
├─ [3] Traceroute — find first hop that fails
│   └─ Hop 1-2? → your infrastructure
│   └─ Hop 3+? → ISP
│
├─ [4] DNS — nslookup with 8.8.8.8 bypass
│
├─ [5] Extended ping 50x — measure loss and jitter
│
├─ [6] Switch: show interfaces → CRC, runts, duplex
│   └─ Errors? → swap cable, fix duplex, try new port
│
├─ [7] Utilization: 5-min rate on uplinks and WAN
│   └─ >80%? → QoS or upgrade conversation
│
└─ [8] ISP escalation — gather evidence before calling
```

---

## Why You Freeze (And How to Stop)

Every network admin knows what ping does. Most have used Wireshark at least once. The problem isn't the tools — it's the sequence.

CCNA courses teach you commands. They don't teach you the decision logic that connects them. So when something breaks at 2am, you know ten different tools and you're not sure which one to pick up first.

The fix is simple: run this checklist in order every time. Steps 1 and 2 alone will close 60% of tickets in under a minute. Steps 3–6 handle most of the rest. Step 7 is usually "call the ISP."

After a few incidents, this becomes automatic. You won't need the checklist — but until then, keep it somewhere you can find it fast.

---

## Need the Claude Prompts Pre-Built?

The prompts embedded in this checklist are simplified versions of what's in the [Claude Prompt Pack for Network Admins](/prompt-pack). The pack includes structured troubleshooting prompts that walk Claude through your specific environment — vendor, platform, VLAN layout — so you get relevant output instead of generic answers.

**[→ Get the Claude Prompt Pack — $29](/prompt-pack)**

60 prompts. One PDF. No subscription.
