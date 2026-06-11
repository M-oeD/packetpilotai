---
title: 'Packet of the Week #03: The Host That Blinks'
description: 'A server is reachable for thirty seconds, then gone for thirty, in a near-perfect cycle. Reboots and cable swaps do nothing. The ARP table holds the answer: two MAC addresses are fighting over one IP. The capture, three hypotheses, and the Claude prompt that ends the war.'
pubDate: '2026-05-31'
stream: 'potw'
streamNum: 3
heroAscii: |
  $ ping 10.0.4.50     # up... down... up... down...

  Reply from 10.0.4.50: time=1ms
  Request timed out.
  Reply from 10.0.4.50: time=1ms
  Request timed out.

  C:\> arp -a | findstr 10.0.4.50
  10.0.4.50   00-1a-2b-3c-4d-5e   dynamic     ← then, seconds later...
  10.0.4.50   00-50-56-9a-11-22   dynamic     ← different MAC, same IP

  [?] two NICs, one address, both shouting
---

Monitoring keeps flapping `db02` at `10.0.4.50`: reachable, then unreachable, then reachable, on a rhythm you could set a metronome to. The on-call engineer has rebooted it twice, swapped the patch cable, and moved it to a different switch port. The blink continues, unbothered. Every other host on the VLAN is rock solid.

The hero capture has the tell already. You have ninety seconds — what's happening to `10.0.4.50`?

---

## What You Can Already Rule Out

- **Not a flaky cable or NIC** — those fail *randomly*. This fails on a clean, repeating cycle, and the engineer already swapped the cable and the port.
- **Not the server itself** — it never crashes; it just becomes unreachable and then reachable again with no reboot.
- **Not spanning tree** — no topology-change logs, no MAC-flap storm on the core, no CPU spike. The rest of the VLAN is fine.

A rhythmic, self-healing up/down that survives reboots and cable swaps is not a hardware fault. It's an argument.

---

## The Three Hypotheses

| # | Hypothesis | Why it's wrong (or right) |
|---|------------|---------------------------|
| 1 | Failing NIC or transceiver | Wrong. Hardware fails randomly, not on a 30-second cycle, and `arp -a` shows two *different* MACs for the address. |
| 2 | A spanning-tree or link flap | Wrong. No topology changes are logged and no other host is affected. |
| 3 | Two devices share the IP | **Right.** Two MAC addresses are claiming `10.0.4.50`, and they take turns winning. |

The tell is one line in `arp -a`: the same IP resolves to **two different MAC addresses** depending on *when* you look.

---

## Why Sharing an IP Makes a Host Blink

ARP has no referee. When a host wants to announce "I am `10.0.4.50`," it sends a **gratuitous ARP** — an unsolicited "here's my IP and MAC" — and every device on the segment overwrites its ARP cache with that mapping. Whoever announced **last** wins.

Now put two hosts on `10.0.4.50`. Each one periodically gratuitous-ARPs. Every announcement flips every neighbor's cache — and the switch's MAC-to-port table — to point at *that* host. For the next few seconds, traffic for `10.0.4.50` goes to host A. Then host B announces, the cache flips, and traffic goes to host B. If only host A is the one you actually want, the service "blinks" in time with the ARP war. The pings that land on the wrong host get dropped; the ones that land on the right one reply.

On Windows you'll often find the smoking gun in the System log: a TCP/IP **address-conflict** event (ID 4199) naming the other NIC's hardware address.

---

## Finding the Second NIC

The address resolves to two MACs. Pin each one to a switch port:

```
core-sw01# show mac address-table address 0050.569a.1122
 Vlan   Mac Address       Type        Ports
 100    0050.569a.1122    DYNAMIC     Gi1/0/31
```

`Gi1/0/31` — walk the cable or check the port description. In practice the second host is almost always one of three things: a server given a **static IP that lands inside the DHCP scope**, a **cloned VM** that kept its template's address, or a device someone **re-IP'd months ago** and forgot. The `0050.5600` prefix above is VMware's OUI — that's your cloned VM tell right there.

---

## The Fix

1. **Re-IP the impostor.** Decide which host legitimately owns `10.0.4.50` and move the other one.
2. **Reserve or exclude the address in DHCP** so it can't be handed out again, and convert static servers to DHCP reservations so addressing has one source of truth.
3. **Prevent the rematch.** Enable **DHCP snooping** plus **Dynamic ARP Inspection (DAI)** on the access switches. DAI validates ARP against the snooping table and drops the spoofed or duplicate announcements that start these wars.

---

## The Prompt That Would Have Found This Faster

```
A host at [IP] is reachable in a repeating ~30-second up/down cycle.
Reboots and cable swaps don't help. `arp -a` shows the IP resolving to two
different MAC addresses at different times.

Here is the ARP output over time and the switch MAC table: [paste].
Tell me the root cause, how to identify which physical device is the
second one, and how to prevent it from recurring.
```

The phrase that earns its keep is "two different MAC addresses at different times." Hand Claude that detail and it goes straight to duplicate-IP and `show mac address-table`. Describe it as "intermittent connectivity" and it'll start you on a ping-loss goose chase.

---

## The One-Line Takeaway

**A host that blinks on a clean cycle, with two MACs for one IP in the ARP cache, is a duplicate-IP war. ARP is last-writer-wins — find the second NIC by its switch port and re-address it.**

---

## Next Week

POTW #04 — a brand-new server where `ping` works perfectly in both directions, but every TCP connection to it dies after the SYN. ICMP is happy. TCP is not. What's eating the handshake?

— **Subscribe to Packet Drop** (newsletter form below) to get the puzzle when it ships Friday.

— **Want the prompts ready-to-paste?** [Get the Prompt Pack](/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=potw-03-duplicate-ip-arp-war) — 60 production prompts for network admins, $29, lifetime updates.
