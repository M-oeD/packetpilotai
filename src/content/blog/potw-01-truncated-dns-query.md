---
title: 'Packet of the Week #01: The Truncated DNS Query'
description: 'Same DNS server, same subnet, same patches — one user''s lookups fail and yours do not. The capture, three hypotheses, the reveal, and the Claude prompt that finds it in one shot.'
pubDate: '2026-05-20'
stream: 'potw'
streamNum: 1
heroAscii: |
  $ dig @192.168.1.10 large.corp.local

  ;; communications error to 192.168.1.10#53: timed out
  ;; communications error to 192.168.1.10#53: timed out
  ;; no servers could be reached

  # capture excerpt (user's machine, 10.0.4.42)
  14:22:01.123  10.0.4.42    → 192.168.1.10  DNS  query  A large.corp.local  (UDP/53)
  14:22:01.125  192.168.1.10 → 10.0.4.42     DNS  response TC=1  (no answer)
  14:22:01.127  10.0.4.42    → 192.168.1.10  TCP  53  [SYN]
  14:22:04.140  10.0.4.42    → 192.168.1.10  TCP  53  [SYN] (retry 1)
  14:22:10.155  10.0.4.42    → 192.168.1.10  TCP  53  [SYN] (retry 2)

  [?] works fine on your laptop · same subnet · same patches
  [?] resolver is up · other names resolve from this user's machine
  [!] what's different?
---

A user reports `large.corp.local` won't load — they've rebooted twice. You run the same lookup from your laptop on the same subnet. Works in 30 ms. Their machine times out after ten seconds and three retries.

The capture in the hero shows the failure. You have ninety seconds to call the root cause before reading the reveal. Sketch your answer first.

---

## What You Can Already Rule Out

- **DNS server isn't down** — you just resolved against it.
- **No cable or NIC issue** — the user's other lookups (short ones) work fine. Browsing other sites works.
- **No firewall on the path between subnets** — you're on the same subnet, hitting the same resolver, and one of you succeeds.

So the failure has to be on the user's host, conditional on this particular query. What flips it?

---

## The Three Hypotheses

| # | Hypothesis | Why it's wrong (or right) |
|---|---|---|
| 1 | The record is broken | Wrong. You resolved it fine. The authoritative answer exists. |
| 2 | The user is using a different DNS server | Wrong. `ipconfig /all` shows `192.168.1.10` — same as yours. |
| 3 | Something is blocking the **TCP** retry, not the **UDP** query | Right. Keep reading. |

The tell is in the first response: `TC=1`. That's the **truncated** flag — the resolver had a valid answer but it didn't fit in a UDP packet.

---

## What `TC=1` Actually Means

DNS uses UDP/53 by default. UDP responses are size-limited (historically 512 bytes; with EDNS0, up to ~4096). When a response is bigger than the client's advertised buffer, the resolver sends back a short reply with the **truncated** bit set and no answer payload. The client is expected to retry the same query over **TCP/53**.

That retry is the line that matters:

```
14:22:01.127  10.0.4.42 → 192.168.1.10  TCP 53 [SYN]
```

No SYN-ACK ever comes back. After three retries spaced 3, 6, and 12 seconds apart, the client gives up. The resolver was willing to answer — it just couldn't, because the TCP handshake never completed.

---

## Why Only This User?

Run the same TCP test from the working laptop:

```powershell
# Yours
Test-NetConnection -ComputerName 192.168.1.10 -Port 53
# TcpTestSucceeded : True
```

```powershell
# Theirs
Test-NetConnection -ComputerName 192.168.1.10 -Port 53
# TcpTestSucceeded : False
```

Same subnet, same resolver, opposite outcome on TCP. The block isn't on the network — it's on the host.

Check the user's Windows Firewall outbound rules:

```powershell
Get-NetFirewallRule -Direction Outbound -Enabled True |
  Where-Object DisplayName -like '*DNS*' |
  Format-Table DisplayName, Action
```

A "Block outbound TCP/53" rule shows up — pushed last week by a security GPO that targets the "Standard Users" OU but not "IT Admins." Your machine is in the IT OU. You sailed past it; the user didn't.

**Root cause:** outbound TCP/53 blocked on the user's host by GPO. The query needed TCP fallback. Couldn't get it.

The fix is one of three, depending on how aggressive the policy needs to be:

1. **Carve an exception** for internal resolvers (`192.168.1.10`) in the GPO. Lowest blast radius.
2. **Shrink the response** — if the record set is large because of DNSSEC or padded TXT, audit what's bloating it.
3. **Allow TCP/53 outbound to RFC1918 only.** Keeps the security posture and unblocks internal recursion.

---

## The Prompt That Would Have Found This Faster

Here is the Claude prompt to keep in your pack for next time a "DNS works for me but not them" call lands:

```
I have one Windows workstation where DNS lookups for [hostname] time out.
The same lookup from another machine on the same subnet, using the same
configured resolver, succeeds.

Here is the packet capture from the failing machine: [paste capture].
Here is `ipconfig /all` from both machines: [paste both].

Walk through the differences. Identify which host-level setting could cause
this exact pattern. Tell me the one command that will confirm the diagnosis,
and the GPO or firewall rule most likely responsible.
```

Claude lands on the TCP fallback hypothesis in one pass when you give it the capture with the TC flag visible. Without the capture, it will guess for two paragraphs first.

---

## The One-Line Takeaway

**`TC=1` plus a stalled TCP/53 SYN equals "your host firewall, not your network."**

If you remember nothing else from this puzzle, remember the TC bit. It's the difference between a five-minute fix and a two-hour ticket.

---

## Frequently Asked Questions

**When does a DNS query actually use TCP instead of UDP?**
When the response is too large to fit in the client's advertised UDP buffer (default 512 bytes without EDNS0, up to ~4096 with it), the resolver sets the **truncated** flag (`TC=1`) and the client retries the same query over TCP/53. Zone transfers (`AXFR`/`IXFR`) also always use TCP. Modern DNS — especially with DNSSEC, large TXT records, or long CNAME chains — relies on TCP fallback far more often than people assume.

**What does `TC=1` mean in a DNS response?**
It's the **truncation flag**. The resolver had a valid answer but it didn't fit in a single UDP datagram, so it sent back a short response with the TC bit set and no answer data. The client is expected to retry the query over TCP/53. If TCP/53 is blocked anywhere on the path — or on the host itself — the query fails even though the resolver is healthy.

**How do I test whether TCP/53 is reachable from a Windows host?**
Run `Test-NetConnection -ComputerName <resolver-ip> -Port 53` from PowerShell. The output shows `TcpTestSucceeded : True` if the handshake completes. From Linux or Mac, use `nc -zv <resolver-ip> 53`. Doing this from both the working machine and the broken machine isolates a host-level block in under a minute.

---

## Next Week

POTW #02 — a TCP session that completes the handshake, transfers exactly one byte of payload, then dies. What killed it?

— **Subscribe to Packet Drop** (newsletter form below) to get the puzzle when it ships Friday.

— **Want the prompts ready-to-paste?** [Get the Prompt Pack](/prompt-pack) — 60 production prompts for network admins, $29, lifetime updates.
