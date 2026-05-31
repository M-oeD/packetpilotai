---
title: 'Failure Library #03: The Authentication Outage That Was a Clock'
description: 'Logins failing building-wide, services throwing errors, the identity team in a war room — and the domain controllers were up, replication was healthy. The root cause was a 47-minute clock skew on the PDC emulator and Kerberos doing exactly what it is designed to do. The post-mortem: the false lead, the tell, the fix, and the prompt that names it.'
pubDate: '2026-05-31'
stream: 'failure-library'
streamNum: 3
heroAscii: |
  08:31  ALERT    auth failures spiking · OWA, VPN, file shares
  08:34  PAGE     "AD is down" — identity war room opens
  08:52  DCs up · replication healthy · one event, everywhere:
                  KRB_AP_ERR_SKEW   (clock skew too great)
  09:05  w32tm /query /status → offset +2847s on DC01 (PDC emulator)
  09:07  upstream NTP unreachable for ~3 weeks · DC free-running
  09:20  RESOLVED  fixed NTP source · forced resync · skew → 0

  [!] root cause: PDC emulator drifted 47 min; Kerberos rejects >5 min skew
---

At 08:31 the alerts said authentication was failing everywhere — Outlook on the web, the VPN, file shares, anything that spoke Kerberos. By 08:34 someone had declared "AD is down" and opened a war room. The domain controllers were not down. Replication was healthy. Not a single account was actually broken. The whole outage came from one number being wrong: the clock on the PDC emulator was 47 minutes fast, and Kerberos refuses to trust a clock that far off. This is the post-mortem.

---

## What I Saw First

Authentication failing across every Kerberos-backed service at once. The obvious read is "the domain controllers died." So we checked them:

```
PS> Test-Connection DC01, DC02       # all replies, low latency
PS> Get-Service NTDS, kdc, w32time   # Running on every DC
PS> repadmin /showrepl               # all replications: successful, 0 failures
```

Domain controllers up. Directory service running. Replication clean. Whatever this was, "AD is down" didn't fit a single piece of evidence in front of us. AD was emphatically *up* — it was *rejecting* people.

---

## The First Wrong Theory (Cost: 20 Minutes)

The war room's theory was "a DC fell over or replication broke, and authentication is half-dead as a result." Reasonable, and wrong. We'd already run `repadmin /showrepl` and seen zero failures; we ran it twice more anyway, restarted the `kdc` service on a DC, and started drafting a plan to seize FSMO roles onto a "healthy" DC.

Seizing roles to fix a problem you haven't diagnosed is how a 20-minute incident becomes a two-day one. What stopped us was finally reading the *content* of a failure instead of the fact of it.

---

## The Tell That Cracked It

Every failed logon wrote the same event. Not `BAD_PASSWORD`. Not `ACCOUNT_LOCKED`. This:

```
Source:   Security-Kerberos
Event ID: 4
Error:    KRB_AP_ERR_SKEW (The time at the server is different from the
          client time by more than the maximum allowable skew.)
```

`KRB_AP_ERR_SKEW`. The clocks disagree. This is not an identity failure wearing a clever disguise — it is a *time* failure, and Kerberos is reporting it accurately. One command turns the lights on:

```
PS> w32tm /query /status        # on DC01, the PDC emulator
 ...
 Phase Offset: +0:47:27s         ← the PDC's clock is 47 minutes fast
 Source: Free-running System Clock
```

`Source: Free-running System Clock`. The domain's master clock wasn't getting time from anywhere. It was making it up.

---

## What Kerberos Does With Time

Kerberos stamps every ticket with a timestamp, on purpose: it's how the protocol defeats replay attacks. An attacker who captures a ticket can't reuse it later, because "later" is encoded in the ticket and checked against the clock. To make that work, Kerberos requires the two parties' clocks to agree within a tolerance — by default, **five minutes**. Past five minutes of skew, every ticket is rejected as potentially replayed.

That five-minute tolerance is why this outage arrived as a cliff, not a slope. At 4 minutes 59 seconds of drift, everything works perfectly. At 5 minutes 1 second, the entire Kerberos surface of the environment fails at once. The drift had been accumulating for weeks; it simply crossed the line overnight.

And the reason it took down *users* rather than staying invisible: not everything in the building follows the domain's clock. The PDC emulator drifted 47 minutes from real time, but roaming laptops that had recently synced to internet NTP, the VPN's RADIUS/MFA appliance on its own time source, and the Linux app tier were all still on **correct** time. Every Kerberos exchange that crossed the gap between "follows the drifted PDC" and "knows what time it actually is" was now 47 minutes apart — and rejected.

---

## Why the Master Clock Was Free-Running

The PDC emulator holds the top of the domain's time hierarchy: member DCs sync from it, clients sync from the DCs, and the PDC itself is supposed to sync from an external, authoritative source. Ours couldn't:

```
PS> w32tm /query /source
 Free-running System Clock        ← should be an external NTP server

PS> Test-NetConnection time.nist.gov -Port 123 -InformationLevel Quiet
 (UDP/123 — blocked)
```

A firewall change three weeks earlier had tightened outbound rules and silently dropped **UDP/123** from the PDC to the internet. With its upstream gone, Windows Time fell back to the local hardware oscillator and free-ran, drifting a few minutes a week until it hit the Kerberos wall.

---

## The Fix

Point the PDC emulator back at a reachable time source and force a resync:

```
PS> w32tm /config /manualpeerlist:"time.nist.gov,0x8 time.windows.com,0x8" /syncfromflags:manual /update
PS> Restart-Service w32time
PS> w32tm /resync /force
PS> w32tm /query /status         # Phase Offset back to a few milliseconds
```

(The firewall exception for UDP/123 went in first, or none of this reaches anything.) Skew collapsed to near-zero, member DCs pulled the corrected time within their poll interval, and authentication recovered across the building as fresh tickets were issued. No accounts were ever touched.

---

## The Real Root Cause

1. **A firewall change silently blocked the PDC emulator's outbound NTP (UDP/123).** No alert fired; time just quietly stopped flowing in.
2. **The PDC free-ran on its hardware clock**, drifting minutes per week with nothing pulling it back.
3. **Nothing monitored time skew or NTP reachability.** The single most consequential number in an Active Directory environment was unobserved.
4. **Kerberos's five-minute tolerance converted a slow drift into a sudden outage** — invisible for three weeks, total at the moment it crossed the threshold.

Three of those are process failures. None of them is "Active Directory broke."

---

## What Changed After

- **We now monitor `w32tm` offset and UDP/123 reachability** from the PDC emulator, with an alert at two minutes of skew — well inside the five-minute cliff.
- **Firewall change review now flags UDP/123 and other infrastructure protocols** (NTP, DNS, RADIUS) as protected egress.
- **The time hierarchy is documented**: who syncs from whom, and what the PDC's external source is.
- **New runbook line, in bold:** *building-wide auth failing? Check the clock on the PDC emulator before you touch a single account or role.*

---

## The Claude Prompt That Would Have Skipped the War Room

```
Authentication is failing across the whole environment at once — OWA, VPN,
file shares. Domain controllers are up, services are running, and
`repadmin /showrepl` shows zero replication failures. The failed logons all
log Security-Kerberos Event ID 4: KRB_AP_ERR_SKEW.

What does this specific error point to as the root cause? Give me the exact
commands to confirm it on the PDC emulator and the steps to fix it, in order.
```

Hand Claude the actual event — `KRB_AP_ERR_SKEW` — and it goes straight to clock skew, the PDC emulator, and `w32tm`, skipping the entire "AD is down" detour. The lesson for both humans and models is identical: **read the error, not the headline.** "Auth is down" sends you to identity. `KRB_AP_ERR_SKEW` sends you to a clock.

---

## The One-Line Takeaway

**Mass Kerberos failures logging `KRB_AP_ERR_SKEW` are never an identity outage — they're a clock. Kerberos rejects more than five minutes of skew, so check the PDC emulator's time and its NTP source before you suspect a single account.**

---

## Next in the Failure Library

Failure #04 — a single TLS certificate that nobody owned, that expired at 00:00, and the four-hour scramble to find anyone with the authority to reissue it while three services stayed dark.

— **Subscribe to Packet Drop** (newsletter form below) to get the next post-mortem the moment it ships.

— **Want the diagnostic prompts ready-to-paste?** [Get the Prompt Pack](/prompt-pack) — 60 production prompts for network admins, $29, lifetime updates.
