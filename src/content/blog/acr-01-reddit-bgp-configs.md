---
title: 'AI Configs Reviewed #01: The BGP Config That Comes Up and Black-Holes Your Traffic'
description: 'We audit a representative AI-generated BGP config of the kind posted to r/networking every week. The session establishes, the output looks clean — and it advertises nothing, black-holes half your traffic, and risks a route leak. Here is the line-by-line teardown and the corrected config.'
pubDate: '2026-05-31'
stream: 'acr'
streamNum: 1
heroAscii: |
  $ cat bgp-from-the-ai.conf      # "is this right?" — asked weekly

  router bgp 65001
   network 10.0.0.0                        [!] no mask → classful /8
   neighbor 10.255.255.2 remote-as 65001   [!] iBGP, no next-hop-self
   neighbor 203.0.113.1 remote-as 64500    [!] no in/out filters
   ebgp-multihop 2                          [?] directly connected — why?
  ────────────────────────────────────────────────────────────
  verdict: session comes UP · traffic black-holes · 2 high · 3 med
---

Here is the most dangerous property of an AI-generated network config: it establishes. The neighbors come up, `show ip bgp summary` shows a State of `Established`, the demo works, and everyone moves on. The bugs are not syntax errors — those would fail loudly at paste time. The bugs are *semantic*, and they wait until real traffic or a real routing table arrives.

This is the first **AI Configs Reviewed**. We take a config of the kind that lands on r/networking under "new to BGP, does this look right?", and we audit it the way you should audit anything an AI hands you. The config below is a representative composite — assembled to reproduce the exact failure patterns we see, not a quote from any one person's post.

---

## The Config

CORE1 in AS 65001 — two core routers running iBGP between them, CORE1 holds the eBGP session to the ISP. Someone asked an AI to "configure BGP between our cores and our ISP." It returned this:

```
router bgp 65001
 bgp log-neighbor-changes
 network 10.0.0.0
 neighbor 10.255.255.2 remote-as 65001
 neighbor 203.0.113.1 remote-as 64500
 neighbor 203.0.113.1 ebgp-multihop 2
 maximum-paths 2
!
ip route 0.0.0.0 0.0.0.0 203.0.113.1
```

Clean-looking. Establishes both sessions. Ships five problems.

---

## The Findings, Ranked

| # | Severity | Finding |
|---|----------|---------|
| 1 | 🔴 High | iBGP peer has no `next-hop-self` — eBGP routes black-hole on CORE2 |
| 2 | 🔴 High | `network 10.0.0.0` has no mask and no matching route — advertises nothing (or the wrong thing) |
| 3 | 🟠 Med | No inbound or outbound filtering — route-leak risk + full-table exposure |
| 4 | 🟠 Med | `ip route 0.0.0.0/0` static default fights the BGP session |
| 5 | 🟡 Low | `ebgp-multihop 2` on a directly connected peer; `maximum-paths 2` does nothing here |

### 1. The black hole: no `next-hop-self`

This is the one that pages you. When CORE1 advertises an ISP-learned route to its iBGP peer CORE2, iBGP **does not rewrite the next-hop** — CORE2 receives the route with the next-hop set to the ISP's address, `203.0.113.1`. CORE2 has no route to that external link subnet through its IGP, so BGP marks the route **inaccessible** and won't install it. Result: CORE1 can reach the internet, CORE2 can't, and traffic that hashes onto CORE2 disappears. The session is `Established` the whole time.

The fix is one line on the iBGP neighbor: `neighbor 10.255.255.2 next-hop-self`. Now CORE1 advertises *itself* as the next-hop, which CORE2 can reach.

### 2. `network 10.0.0.0` advertises nothing

With no mask, IOS reads this as the classful `network 10.0.0.0 mask 255.0.0.0` — a /8 — and will only advertise it if an **exact** 10.0.0.0/8 route exists in the routing table. It almost never does. So the statement that looks like "advertise our network" advertises *nothing*. The config has the appearance of origination with none of the substance. You need the real prefix, the real mask, and a route that matches it (commonly a pull-up to `Null0`).

### 3. No filters, in or out

There is no inbound prefix-list, so if the ISP sends a full table, CORE1 installs ~950k routes it has no memory budget for. There is no outbound prefix-list, so CORE1 will re-advertise anything it learns — the [route-leak / accidental-transit failure mode](/blog/showdown-01-claude-vs-chatgpt-vs-gemini-bgp) we covered in the Showdown. On a single-homed edge this is lower-stakes than a dual-homed one, but "lower" is not "none," and there's no `maximum-prefix` to catch the day the ISP fat-fingers a redistribute.

### 4. The static default fights BGP

`ip route 0.0.0.0/0 203.0.113.1` installs a static default with administrative distance 1. If the intent was for BGP to provide routing, this static default outranks everything BGP learns and silently wins. If the intent was a backup, it needs a higher AD (a floating static) so it only activates when BGP drops. Having both, unqualified, means one of them is a no-op and nobody decided which.

### 5. Cargo-culted knobs

`ebgp-multihop 2` raises the TTL for a peer that is directly connected and doesn't need it — pure cargo cult, and it slightly weakens the implicit single-hop TTL protection eBGP gives you for free. `maximum-paths 2` reads like load-balancing but does nothing: there's one eBGP path, and iBGP multipath would require `maximum-paths ibgp 2` anyway. Neither is catastrophic; both are noise that signals the author didn't know what the lines do.

---

## Claude's Audit

This is the prompt that produces the teardown above — the point is that you can run it on the config *before* it reaches a router. Keep it in your pack:

```
Audit this Cisco IOS BGP config for semantic errors that would let the
session establish but still break routing. Here is the config: [paste].
Context: AS 65001, iBGP between two cores, eBGP to one ISP.

Check specifically for:
  1. iBGP next-hop reachability (is next-hop-self needed?).
  2. Whether every `network` statement will actually be advertised
     (mask present, matching route in RIB).
  3. Inbound and outbound prefix filtering and maximum-prefix.
  4. Conflicts between static routes and BGP-learned routes.
  5. Any command that is unnecessary or has no effect in this topology.
For each finding give severity, the exact line, and the one-line fix.
```

The framing that matters is "establish but still break routing." Ask a model to "check this config" and it grades syntax. Ask it to find the configs that *come up and still fail*, and it goes looking for next-hop reachability and origination — which is where the real bugs live.

---

## The Corrected Config

Assuming the cores peer over loopbacks carried by an IGP, and the real internal aggregate is 10.10.0.0/16:

```
ip route 10.10.0.0 255.255.0.0 Null0        ! pull-up so origination is real
!
ip prefix-list MY-OUT        permit 10.10.0.0/16
ip prefix-list DEFAULT-ONLY  permit 0.0.0.0/0
!
router bgp 65001
 bgp router-id 10.255.255.1
 bgp log-neighbor-changes
 network 10.10.0.0 mask 255.255.0.0
 !
 neighbor 10.255.255.2 remote-as 65001
 neighbor 10.255.255.2 description iBGP-CORE2
 neighbor 10.255.255.2 update-source Loopback0
 neighbor 10.255.255.2 next-hop-self
 !
 neighbor 203.0.113.1 remote-as 64500
 neighbor 203.0.113.1 description ISP-A
 neighbor 203.0.113.1 password USE-A-REAL-SECRET
 neighbor 203.0.113.1 maximum-prefix 10 90 restart 60
 neighbor 203.0.113.1 prefix-list DEFAULT-ONLY in
 neighbor 203.0.113.1 prefix-list MY-OUT out
```

What changed: real masked origination with a pull-up route; `next-hop-self` and loopback peering on iBGP; inbound default-only and outbound own-prefix filters; `maximum-prefix`, auth, and a deterministic router-id; the multihop, the moot `maximum-paths`, and the conflicting static default all removed. The static default comes back only as a deliberate floating route if you actually want a non-BGP backup.

---

## The One-Line Takeaway

**An AI config that "establishes" has passed the easiest test there is. The bugs that matter — next-hop reachability, real origination, missing filters — all sit on the far side of a working session, which is exactly where nobody looks.**

---

## Next in AI Configs Reviewed

ACR #02 — a pfSense NAT and port-forward config straight from the wild. The port forward "works," and it also exposes a management interface to the internet because the autogenerated firewall rule did precisely what it was told.

— **Subscribe to Packet Drop** (newsletter form below) to get the next teardown when it ships.

— **Want the audit prompts that catch these before cutover?** [Get the Prompt Pack](/prompt-pack) — 60 production prompts for network admins, $29, lifetime updates.
