---
title: "Packet of the Week #05: The Rogue DHCP Server That Wasn't"
description: 'Half the laptops on a floor pull a normal lease; the other half land on 169.254 with no internet. Everyone is hunting a rogue DHCP server. The switch counters say the real server is being silenced by the very feature meant to protect it. Three hypotheses and the Claude prompt that calls it.'
pubDate: '2026-05-31'
stream: 'potw'
streamNum: 5
heroAscii: |
  C:\> ipconfig      # floor 3, every other desk

   Autoconfiguration IPv4 Address . . : 169.254.18.44   ← APIPA, got no DHCP
   (desks on the next switch pull 10.30.3.x just fine)

  acc-sw07# show ip dhcp snooping statistics
   Packets dropped (untrusted port) : 4,012     ← and climbing
  acc-sw07# show ip dhcp snooping
   Interface  Gi1/0/48  (uplink to core)   Trusted: NO   ← there it is

  [?] no rogue anywhere · the REAL server's OFFER is eaten on the uplink
---

Help desk has a theory and they are committed to it: there's a rogue DHCP server on floor 3. Half the laptops pull a normal `10.30.3.x` lease and work fine; the other half end up self-assigning a `169.254.x.x` APIPA address and can't reach anything. Classic rogue-DHCP fingerprint, right? Two people are walking the floor looking for a smuggled-in home router.

They won't find one. The hero capture shows where the DHCP replies are actually going. Ninety seconds — what's eating the leases?

---

## What You Can Already Rule Out

- **The DHCP server isn't down** — desks on the adjacent switch, and every other floor, get leases instantly.
- **It isn't scope exhaustion** — the server shows plenty of free addresses, and exhaustion would starve *everyone*, not a clean half.
- **It isn't actually a rogue server** — a rogue hands out a *wrong* lease (an address on its own subnet, with itself as the gateway). These clients get **no lease at all** — `169.254` is what Windows assigns when DHCP stays silent. Different symptom, different cause.

A rogue gives you a bad answer. APIPA means *no answer reached the client*. So where are the server's answers going?

---

## The Three Hypotheses

| # | Hypothesis | Why it's wrong (or right) |
|---|------------|---------------------------|
| 1 | A rogue DHCP server | Wrong. Victims get APIPA, not a foreign lease. The real server's replies are missing, not competing. |
| 2 | DHCP scope exhaustion | Wrong. Free leases remain and only clients behind one switch are affected. |
| 3 | DHCP snooping is dropping the real OFFER | **Right.** The uplink toward the server is marked untrusted, so the switch discards the server's replies. |

The tell is two lines of switch output: the untrusted-port **drop counter is climbing**, and the **uplink `Gi1/0/48` is `Trusted: NO`**.

---

## How the Anti-Rogue Feature Becomes the Rogue

DHCP snooping exists precisely to kill rogue DHCP servers. It divides every port into **trusted** and **untrusted**, and it enforces one rule: **server-to-client messages — `OFFER`, `ACK`, `NAK` — are only allowed to arrive on trusted ports.** A real DHCP server lives somewhere up the network, so the **uplink toward it must be trusted.** Anything claiming to be a DHCP server on an untrusted access port is, by definition, a rogue, and gets dropped.

Now leave that uplink untrusted by mistake. The client's `DISCOVER` goes *up* the uplink (a client message — allowed). The server sends an `OFFER` back *down* the uplink. But to `acc-sw07`, that `OFFER` is a server message arriving on an **untrusted** port — exactly what snooping is built to drop. So it drops it. The client never hears back and falls to APIPA. The switch is enthusiastically protecting the floor from its own DHCP server.

Why only half the floor? Because half the desks patch into `acc-sw07` (the freshly reconfigured switch with the untrusted uplink) and half into `acc-sw06` (configured correctly). The split isn't random — it's a map of which switch you're plugged into.

---

## The Fix

One command, on the right port:

```
acc-sw07# configure terminal
acc-sw07(config)# interface Gi1/0/48
acc-sw07(config-if)# ip dhcp snooping trust
acc-sw07(config-if)# end
```

Trust the uplink (and any port that faces the DHCP server or a DHCP relay). The `OFFER` and `ACK` are allowed through again; APIPA clients pick up a real lease on their next attempt. Confirm the untrusted-drop counter stops climbing:

```
acc-sw07# show ip dhcp snooping statistics
```

**The rule to internalize:** every port on the *path toward* your DHCP server must be trusted; every *access* port stays untrusted. Get that backwards on an uplink and you've built a DHCP black hole that looks exactly like the rogue you were trying to block.

---

## The Prompt That Would Have Found This Faster

```
On one access switch, about half the clients fail DHCP and self-assign
169.254 APIPA addresses; clients on other switches are fine. The DHCP server
has free leases. We have DHCP snooping enabled.

Here is `show ip dhcp snooping`, the snooping statistics, and the uplink
port config: [paste].
Tell me the most likely root cause, the exact line that proves it, and the
one command that fixes it. Note: victims get APIPA, not a wrong-subnet lease.
```

That last line — "APIPA, not a wrong-subnet lease" — steers Claude away from the rogue-server theory the humans got stuck on and toward "the legitimate offers are being dropped." Symptoms are precise; describe them precisely and the model stops chasing the obvious-but-wrong answer.

---

## The One-Line Takeaway

**APIPA clients behind one switch, plus a climbing untrusted-port drop counter on DHCP snooping, means you blocked your own DHCP server. Every uplink toward the server must be `ip dhcp snooping trust`.**

---

## Next Week

POTW #06 — a switch uplink that passes traffic happily at a gigabit in one direction and crawls at a few megabits in the other. Same cable, same ports, wildly different throughput. What's mismatched?

— **Subscribe to Packet Drop** (newsletter form below) to get the puzzle when it ships Friday.

— **Want the prompts ready-to-paste?** [Get the Prompt Pack](/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=potw-05-dhcp-snooping-blackhole) — 60 production prompts for network admins, $29, lifetime updates.
