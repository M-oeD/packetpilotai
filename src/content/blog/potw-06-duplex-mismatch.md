---
title: "Packet of the Week #06: The Uplink That Only Ran Downhill"
description: 'A switch-to-switch uplink screams at 90+ Mb/s in one direction and crawls at barely 2 Mb/s in the other — same cable, same ports, no QoS in sight. Everyone suspects a failing cable. The interface counters on the two ends disagree in a very specific way. Three hypotheses and the Claude prompt that names the culprit in one line.'
pubDate: '2026-06-05'
stream: 'potw'
streamNum: 6
heroAscii: |
  $ iperf3 -c 10.40.2.9            # laptop on core → server behind acc-sw07
     [SUM]  0.0-10.0 sec   112 MBytes   93.6 Mbits/sec        ← fine

  $ iperf3 -c 10.40.2.9 -R         # same two hosts, reverse direction
     [SUM]  0.0-10.0 sec   2.9 MBytes    2.44 Mbits/sec       ← crawls

  core-sw#  show interfaces Gi1/0/48
     Full-duplex, 100Mb/s          ← weren't you sold a gig uplink?
     0 runts   214 CRC   0 frame                ← corrupted on receive

  acc-sw07# show interfaces Gi1/0/1
     Half-duplex, 100Mb/s          ← one end full, one end half
     1190 late collision           ← the smoking gun

  [?] only the direction the HALF-duplex end transmits collapses
---

The ticket says "the new uplink is slow," which is the least useful sentence in networking. But this one has a twist that sends everyone reaching for the same wrong answer.

Pull a file *from* the access-closet server and it arrives at a healthy 90-odd Mb/s. Push a file *to* it and you're watching paint dry at 2 Mb/s. Same cable. Same two ports. Same switches that were humming yesterday. The cable tester says the run is clean. Three people have already decided it's a failing patch lead, and someone's been dispatched with a spare.

They're about to swap a cable that's perfectly fine. The hero capture above shows where the bytes actually die — and the two ends are telling slightly different stories. Ninety seconds: what's mismatched?

---

## What You Can Already Rule Out

- **It isn't the cable.** Bad copper is *symmetric* — it gives you loss or errors in both directions, or a link that won't train at all. A clean 93 Mb/s in one direction proves the pairs carry traffic fine. Cables don't have a favorite direction.
- **It isn't congestion or a top talker.** 2 Mb/s on an idle 100 Mb link isn't a saturated pipe — the link is 98% empty while the transfer starves. Congestion slows everyone a little; this murders exactly one direction.
- **It isn't QoS or a policer.** There's no `service-policy` on either interface, and a shaper doesn't manufacture the counters you're about to read. Rate limiters drop quietly; they don't log collisions.

And here's the clue everyone glossed over: the operator swore this was a **gigabit** uplink, but both ends report **100 Mb/s**. The link didn't just get slow — it quietly surrendered two-thirds of its speed before anyone sent a single byte.

---

## The Three Hypotheses

| # | Hypothesis | Why it's wrong (or right) |
|---|------------|---------------------------|
| 1 | A failing cable or patch lead | Wrong. Bad copper is symmetric — both directions suffer, or the link won't come up. One clean 93 Mb/s direction exonerates the cable. |
| 2 | A one-way QoS policer or shaper | Wrong. No `service-policy` is applied, and a policer drops silently. It can't produce late collisions on one end and CRC errors on the other. |
| 3 | A **duplex mismatch** — one end full, one end half | **Right.** Late collisions on the half-duplex end + CRC/runts on the full-duplex end + a link that fell back to 100 Mb/s is the exact fingerprint. |

The tell is the pair of counters in the hero capture: **`core-sw` (full-duplex) is logging CRC errors, and `acc-sw07` (half-duplex) is logging late collisions.** Neither counter alone is conclusive. Together, on opposite ends of the same link, they can mean only one thing.

---

## Why Only One Direction Dies

Start with how the link got into this state. Someone hard-set `speed 100` / `duplex full` on `core-sw`'s port. Hard-coding speed and duplex *switches off* auto-negotiation on that interface. The far end, `acc-sw07`, is still on `auto` — so it has no one to negotiate with. IEEE **parallel detection** lets it sense the *speed* (100) from the link signal, but it has no mechanism to detect *duplex*, and the standard is explicit about the tie-breaker: when in doubt, fall back to **half**. One wrong line gives you two bugs — a 100 Mb link instead of a gig, and a duplex that disagrees end to end.

Now watch what that does under load:

- The **full-duplex** end (`core-sw`) believes it can send and receive at the same time. It transmits whenever it has a frame and never listens for collisions — because, as far as it knows, collisions are impossible.
- The **half-duplex** end (`acc-sw07`) runs classic CSMA/CD: it may only transmit when the wire is idle, and it watches for collisions the whole time it's sending.

When `acc-sw07` is the one pushing data — your *upload* — it starts transmitting, and `core-sw`, deaf to the etiquette, transmits straight into it. `acc-sw07` sees its own frame collide *after* it's already past the 64-byte mark: a **late collision**. It aborts, backs off, retransmits, and collides again. That direction collapses to a trickle.

Go the other way — your *download*, `core-sw` → `acc-sw07` — and `acc-sw07` is mostly just receiving, which it does fine. So that direction runs near line rate. The damage only surfaces when the half-duplex end has to *talk*.

Meanwhile, every frame `acc-sw07` aborts mid-transmission lands at `core-sw` as a truncated, bad-checksum mess — and that's the **CRC errors and runts** climbing on the full-duplex end. Each side is dutifully logging its own half of the same collision.

That asymmetry — *fast when the half-duplex end listens, dead when it talks* — is a signature you simply can't get from a cable, a policer, or congestion.

---

## The Fix

Two valid ways, one rule: **both ends must agree.**

Preferred — let auto-negotiation do its job on *both* sides:

```
core-sw(config)# interface Gi1/0/48
core-sw(config-if)#  speed auto
core-sw(config-if)#  duplex auto
```

Then confirm `acc-sw07 Gi1/0/1` is also `auto`/`auto` (it already is). On modern gear, auto/auto on both ends negotiates cleanly to 1000/full — and you get your gigabit back as a bonus.

If a port genuinely must be pinned (an old SFP, a vendor quirk), hard-code **both** ends to the *same* values — never just one:

```
! on BOTH switches, identically
 speed 100
 duplex full
```

Then verify the mismatch is gone and stays gone:

```
core-sw#  show interfaces Gi1/0/48 | include duplex|CRC|collision
acc-sw07# show interfaces Gi1/0/1  | include duplex|collision
```

Both ends should now read the **same** duplex and speed, the **late-collision** counter on `acc-sw07` should stop advancing, and your reverse `iperf3` should leap from 2 Mb/s to line rate.

The cardinal sin that created this: hard-coding **one** side. A single hard-set end disables negotiation and silently forces its partner to guess the duplex — and the guess is always half.

---

## The Prompt That Would Have Found This Faster

```
A 1G switch-to-switch uplink negotiated down to 100 Mb/s and throughput is wildly
asymmetric: ~90 Mb/s one direction, ~2 Mb/s the other, on an otherwise idle link.
Here is `show interfaces` from BOTH ends: [paste both].

Compare the two ends. Tell me the root cause, the specific counter on each end
that proves it, and the exact commands to fix it on both switches. Note: the slow
direction is the traffic sourced by the access switch.
```

Two details do all the work. Pasting **both** ends matters because a duplex mismatch is invisible from one side — you have to *see* that they disagree. And naming **which** direction crawls steers the model toward the mechanism. Hand Claude one end and "it's slow," and it will reasonably guess a cable. Hand it both ends and the asymmetry, and it goes straight for the late-collision counter and the mismatched `duplex` line.

---

## The One-Line Takeaway

**A link that fell back to 100 Mb/s with late collisions on one end and CRC/runts on the other is a duplex mismatch — and the cure is to match auto-negotiation on *both* ends, never hard-code just one.**

---

## Next Week

POTW #07 — an interface averaging a sleepy 8% utilization that drops packets anyway. The monitoring graph is flat and innocent; the output-drop counter climbs all day. Where do the drops come from when the link is almost empty?

— **Subscribe to Packet Drop** (newsletter form below) to get the puzzle when it ships Friday.

— **Want the prompts ready-to-paste?** [Get the Prompt Pack](/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=potw-06-duplex-mismatch) — 60 production prompts for network admins, $29, lifetime updates.
