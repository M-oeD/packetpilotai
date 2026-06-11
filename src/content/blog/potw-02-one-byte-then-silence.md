---
title: 'Packet of the Week #02: One Byte, Then Silence'
description: 'A TCP session completes the handshake, pushes exactly one byte, gets the ACK — then the next segment vanishes and the connection hangs forever. The same two hosts work fine for everyone on the LAN. The capture, three hypotheses, and the Claude prompt that names it in one shot.'
pubDate: '2026-05-31'
stream: 'potw'
streamNum: 2
heroAscii: |
  $ ssh app01     # connects, prints nothing, hangs — every time

  10:02:01.110  10.0.5.7  → 10.8.0.20  TCP 22  [SYN]
  10:02:01.112  10.8.0.20 → 10.0.5.7   TCP 22  [SYN,ACK]
  10:02:01.112  10.0.5.7  → 10.8.0.20  TCP 22  [ACK]
  10:02:01.140  10.8.0.20 → 10.0.5.7   PSH len 1   ← ACKed instantly
  10:02:01.180  10.8.0.20 → 10.0.5.7   TCP len 1460 [DF]  ← retrans ×5, no ACK
  10:02:13.900  (session hung)

  [?] handshake fine · 1 byte through · the big segment dies · DF is set
---

A developer reports they can SSH to `app01` across the site-to-site VPN, the session connects — and then nothing. No banner, no prompt, just a cursor that hangs until the connection times out. You try it: same thing. The TCP session is clearly *up* — the handshake completes and the server even pushes a byte that gets acknowledged. Then it dies.

Hosts on the same LAN as `app01` use it all day with no issue. The capture in the hero is the whole story. Ninety seconds — call it before the reveal.

---

## What You Can Already Rule Out

- **Not DNS** — you connected by IP. Name resolution never entered the picture.
- **Not authentication or a dead server** — the three-way handshake completed and the server pushed one byte of data that was acknowledged. TCP is working and the application is alive.
- **Not general packet loss** — this fails the *exact same way every time*, at the *exact same point*. Random loss doesn't do that.

So TCP comes up, a little data moves, and then it stalls deterministically the moment real data flows. What's different about the packet that dies?

---

## The Three Hypotheses

| # | Hypothesis | Why it's wrong (or right) |
|---|------------|---------------------------|
| 1 | The application is hanging | Wrong. The capture shows the **server retransmitting a TCP segment**, not an idle app. The stall is below the application. |
| 2 | Congestion or a flaky link | Wrong. Only the **large** segments die; the small ones (handshake, the 1-byte push) always succeed. Failure is 100% correlated with packet size, not time or load. |
| 3 | An MTU black hole on the path | **Right.** Big packets with **Don't Fragment** set can't cross a lower-MTU hop, and the ICMP that should report it never arrives. |

The tell is in two columns of the capture: every dying packet is `len 1460` (a full segment) **and** carries the `[DF]` flag — and no ICMP ever comes back.

---

## What an MTU Black Hole Actually Is

Your VPN tunnel doesn't have a 1500-byte MTU. Encapsulation (IPsec, GRE, PPPoE) eats overhead, so the usable MTU across the tunnel is more like 1400. When the server sends a full 1500-byte frame with the **Don't Fragment** bit set — which modern TCP does by default — the router at the tunnel can't forward it and can't fragment it.

It's *supposed* to drop the packet and send back an **ICMP type 3, code 4** ("fragmentation needed, DF set") telling the sender to use smaller packets. That mechanism is **Path MTU Discovery**, and it depends entirely on that ICMP message getting home.

Somewhere on the path, ICMP is filtered — a firewall rule that "blocks ICMP" because someone once read that ping is dangerous. So the ICMP never arrives. The server never learns its packets are too big. It just retransmits the same 1460-byte segment, five times, and gives up. The small packets sail through because they're under the limit. **That's the black hole: big packets vanish, and the one signal that would explain why is being dropped on purpose.**

---

## The Fix

Three options, easiest first:

1. **Clamp the MSS** on the tunnel interface so TCP negotiates a segment size that fits:
   ```
   interface Tunnel0
    ip tcp adjust-mss 1360
   ```
   1400-byte path MTU minus 40 bytes of IP+TCP header = 1360. This rewrites the MSS in the SYN so neither side ever sends a segment too big to cross. It's the pragmatic fix and it's why MSS clamping lives on nearly every VPN concentrator.
2. **Lower the MTU** end-to-end to match the tunnel. Correct, but coordinating it across hosts is more work than clamping at the choke point.
3. **Stop filtering ICMP type 3 code 4.** PMTUD is not optional plumbing; let it work. Block ping if you must, but never that.

---

## The Prompt That Would Have Found This Faster

Keep this in your pack for the next "it connects but hangs" ticket:

```
I have a TCP connection that completes the handshake and transfers a small
amount of data, then hangs. Large segments are retransmitted and never
acknowledged. The dying packets have the Don't Fragment bit set. The path
crosses a VPN tunnel. No ICMP returns to the sender.

Here is the capture: [paste].
Name the most likely root cause, the one command that confirms it, and the
single fix that resolves it without touching every host.
```

Give Claude the two facts that matter — DF set, no returning ICMP — and it lands on the MTU black hole and `ip tcp adjust-mss` in one pass. Leave them out and it'll suggest restarting the service first, same as a tired human.

---

## The One-Line Takeaway

**Handshake works, small packets fine, large `[DF]` segments retransmit into silence — that's an MTU black hole. Clamp the MSS and stop filtering ICMP fragmentation-needed.**

---

## Next Week

POTW #03 — a host that's reachable for thirty seconds, then unreachable for thirty, in a near-perfect cycle. Two machines swear they have the same IP. Only one of them is lying.

— **Subscribe to Packet Drop** (newsletter form below) to get the puzzle when it ships Friday.

— **Want the prompts ready-to-paste?** [Get the Prompt Pack](/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=potw-02-one-byte-then-silence) — 60 production prompts for network admins, $29, lifetime updates.
