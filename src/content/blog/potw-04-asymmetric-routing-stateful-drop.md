---
title: "Packet of the Week #04: Ping Works, TCP Doesn't"
description: 'A new server answers ping perfectly in both directions, but every TCP connection dies right after the SYN. ICMP is happy; the handshake never finishes. The capture, three hypotheses, and the Claude prompt that finds the firewall you forgot was in the path.'
pubDate: '2026-05-31'
stream: 'potw'
streamNum: 4
heroAscii: |
  $ ping 10.20.5.10       # 0% loss, both directions
  $ curl https://10.20.5.10   # hangs, then times out

  09:14:02.001  10.0.9.7   → 10.20.5.10  TCP 443 [SYN]
  09:14:02.003  10.20.5.10 → 10.0.9.7    TCP 443 [SYN,ACK]   ← returns via fw-B
  09:14:02.003  fw-B: no session for this flow → DROP
  09:14:05.010  10.0.9.7   → 10.20.5.10  TCP 443 [SYN] (retry)

  [?] ICMP fine · SYN leaves via fw-A · SYN-ACK returns via fw-B
---

A freshly provisioned server, `10.20.5.10`, in a freshly created subnet. `ping` works flawlessly — zero loss, both directions, low latency. And yet *every* TCP connection to it hangs: HTTPS, SSH, all of it. A packet capture on the server even shows it answering the SYN with a SYN-ACK. The client just never sees it.

The one piece of recent history: last week the network team added a second router/firewall to that segment "for redundancy." Ninety seconds — why does ICMP sail through while TCP dies on the doorstep?

---

## What You Can Already Rule Out

- **Not reachability** — ping is clean in both directions. Layer 3 works.
- **Not a dead service or a blocked port** — the server *receives* the SYN and *replies* with a SYN-ACK. The application is listening and willing.
- **Not DNS or MTU** — you're connecting by IP, and the packet that fails is the tiny SYN-ACK, not a full-size segment. Size isn't the variable.

So the SYN gets there, the server answers, and the answer never makes it home. Something in the path is eating the SYN-ACK specifically.

---

## The Three Hypotheses

| # | Hypothesis | Why it's wrong (or right) |
|---|------------|---------------------------|
| 1 | A firewall is blocking 443 | Wrong. If 443 were blocked, the SYN wouldn't reach the server — but it does, and the server replies. |
| 2 | An MTU black hole | Wrong. The failing packet is a 60-byte SYN-ACK. There's nothing too big to forward. |
| 3 | Asymmetric routing through a stateful firewall | **Right.** The SYN and the SYN-ACK take *different* paths, and one firewall never sees the start of the conversation. |

The tell is in the capture's path annotations: the **SYN leaves through fw-A**, but the **SYN-ACK returns through fw-B**.

---

## Why Two Paths Break One Handshake

A stateful firewall doesn't inspect packets in isolation — it builds a **session table**. When it sees a SYN, it creates an entry: "flow from 10.0.9.7:nnnnn to 10.20.5.10:443 is now in progress; permit the packets that belong to it." The returning SYN-ACK is allowed *because it matches that state*.

Now split the directions. The client's route to the server prefers **fw-A**, so the SYN goes out fw-A, which dutifully creates state. But the server's return route to the client points at **fw-B**. fw-B receives a SYN-ACK for a connection it never saw begin. It has no session for it. A stateful firewall's entire job is to drop exactly that — an out-of-state packet that appeared from nowhere — so it does. The handshake never completes.

`ping` survives because ICMP echo isn't bound to TCP session state the way the handshake is; each side answers independently, so the asymmetry doesn't matter. TCP, which *requires* both halves of the handshake to be witnessed by the same stateful device, can't survive the split.

This is why the timing lines up with "we added a second firewall last week." Before, there was one path and it saw everything. Now there are two, and the routing sends the halves down different ones.

---

## Confirming It

Trace each direction independently and compare:

```
# From the client toward the server
traceroute 10.20.5.10        → first hop 10.0.9.1  (fw-A)

# From the server toward the client
traceroute 10.0.9.7          → first hop 10.20.5.1 (fw-B)
```

Different first hops for the two directions is asymmetric routing in one screen. Confirm it on the firewalls: fw-B's logs will show **out-of-state** or **no-session** drops for the flow, and fw-A will show a half-open session that never got its SYN-ACK.

---

## The Fix

1. **Make routing symmetric.** Align the server subnet's return route with the forward path so both halves of the flow cross the same firewall. This is the clean fix and usually a one-line route or gateway change.
2. **Cluster the firewalls.** If both paths must stay active, run fw-A and fw-B as a stateful HA pair that synchronizes its session table, so either firewall recognizes the other's flows.
3. **Pin the flow** with policy-based routing if the topology genuinely needs both paths and they can't share state.
4. **Loosen state checking** for that path — a real option on some platforms (asymmetric/sloppy state), but a last resort. You're disabling a security feature to paper over a routing problem.

---

## The Prompt That Would Have Found This Faster

```
A host answers ICMP ping fine in both directions, but every TCP connection
to it hangs after the handshake. A capture on the server shows it sending a
SYN-ACK, but the client never receives it. We recently added a second
router/firewall to that segment.

Here are traceroutes in both directions and the firewall logs: [paste].
Identify the root cause, the command that confirms it, and the fix that
keeps both paths available if possible.
```

"Ping works, TCP fails after the handshake, we recently added a second firewall" is almost the whole diagnosis stated as symptoms. Claude assembles it into "asymmetric routing through a stateful firewall" immediately. Drop the "second firewall" detail and you make it work harder than it needs to — the recent-change is the highest-signal clue you have.

---

## The One-Line Takeaway

**Ping works but TCP dies after the SYN, right after someone added a second path — that's asymmetric routing through a stateful firewall. The firewall that never saw the SYN drops the SYN-ACK. Make the return path symmetric or make the firewalls share state.**

---

## Next Week

POTW #05 — half the new laptops on a floor pull a normal address; the other half end up on `169.254.x.x` with no internet. There's a "rogue DHCP server" hunt underway. The call is coming from inside the config.

— **Subscribe to Packet Drop** (newsletter form below) to get the puzzle when it ships Friday.

— **Want the prompts ready-to-paste?** [Get the Prompt Pack](/prompt-pack) — 60 production prompts for network admins, $29, lifetime updates.
