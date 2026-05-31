---
title: 'AI Showdown #01: Can Claude, ChatGPT, and Gemini Configure BGP Without Leaking Routes?'
description: 'We gave three AI models the same dual-homed eBGP task — advertise one /24, prefer one ISP, and do not become a transit AS. Here is the scoring rubric, Claude''s full config, and the one line that turns a working config into a route leak.'
pubDate: '2026-05-31'
stream: 'showdown'
streamNum: 1
heroAscii: |
  $ ai "configure dual-homed eBGP for AS 65010"

  TASK   advertise 192.0.2.0/24 · prefer ISP-A · NO transit
  ──────────────────────────────────────────────────────
  [✓] neighbors up        AS64500 / AS64501
  [✓] prefix originated   192.0.2.0/24
  [✗] outbound filter     MISSING ← leaks ISP-A → ISP-B
  ──────────────────────────────────────────────────────
  [!] the config "works" in the lab and leaks routes in prod
---

Dual-homing to two ISPs is the single most common way a small network ends up announcing routes it has no business announcing. You configure both neighbors, the sessions come up, traffic flows, and the lab test passes. Then one ISP's full table arrives, your router happily re-advertises it to the *other* ISP, and for about ninety seconds you are a transit provider for two carriers who never agreed to it. That is a route leak, and it is exactly the kind of mistake an AI model makes when you ask it for "a BGP config" without spelling out the guardrails.

So we built a rig. One task, one prompt, one scoring rubric — run it against any model and grade the output the same way every time. This post is the rig, Claude's scored run, and the failure modes to watch for when you run the prompt on ChatGPT and Gemini yourself.

---

## The Task

A small business, **AS 65010**, owns one block: **192.0.2.0/24**. They are connecting to two providers for redundancy:

- **ISP-A** — AS 64500, peer `203.0.113.1` — the **primary**.
- **ISP-B** — AS 64501, peer `198.51.100.1` — the **backup**.

The requirements that separate a real config from a lab toy:

1. Advertise **only** 192.0.2.0/24. Nothing else, to anyone, ever.
2. Take a **default route only** from each ISP — no full tables on this edge router.
3. Prefer **ISP-A** for outbound traffic; fail to ISP-B only when A is down.
4. **Do not become a transit AS** — never re-advertise one ISP's routes to the other.
5. Ship the safety rails a real edge router has: `maximum-prefix`, neighbor authentication, neighbor-change logging.

Requirement 4 is the trap. It is invisible in a lab where neither ISP sends you anything, and it is catastrophic the moment one does.

---

## The Exact Prompt

This is the prompt we paste into each model verbatim. It is also the kind of structured prompt that lives in the [Prompt Pack](/prompt-pack):

```
You are configuring a Cisco IOS edge router for eBGP.

Local AS: 65010. We own and advertise exactly one prefix: 192.0.2.0/24.
We are dual-homed:
  - ISP-A: neighbor 203.0.113.1, remote-as 64500. PRIMARY.
  - ISP-B: neighbor 198.51.100.1, remote-as 64501. BACKUP.

Requirements:
  1. Advertise ONLY 192.0.2.0/24 to both ISPs. We must NOT become a
     transit AS under any circumstance.
  2. Accept a DEFAULT ROUTE ONLY from each ISP. No full tables.
  3. Prefer ISP-A for outbound traffic; use ISP-B only if ISP-A is down.
  4. Include maximum-prefix protection, neighbor authentication, and
     neighbor-change logging.

Output a complete, paste-ready IOS config. After the config, list every
assumption you made and any command that depends on my platform version.
```

Note what the prompt does: it states the anti-transit requirement in plain words. A model that still omits the outbound filter is not misunderstanding you — it is forgetting the mechanism. That distinction is the whole point of the rubric.

---

## The Scoring Rubric

Six criteria. This is the reusable part — grade every model's output against the same six and the comparison becomes objective instead of vibes.

| # | Criterion | Weight | Why it matters | Fail looks like |
|---|-----------|--------|----------------|-----------------|
| 1 | **Prefix is actually originated** | High | `network` statement needs a matching route in the RIB or it announces nothing | `network` line with no pull-up route to `Null0` |
| 2 | **Outbound filter prevents transit** | Critical | The one line that stops a route leak | No `prefix-list ... out` permitting only 192.0.2.0/24 |
| 3 | **Inbound filter matches intent** | High | "Default only" must be enforced, not assumed | Accepts full tables; no inbound prefix-list |
| 4 | **Path policy implements the words** | Medium | "Prefer ISP-A" needs `local-preference`, set the right direction | Hardcoded weights, or LP set outbound |
| 5 | **Safety rails present** | Medium | `maximum-prefix`, auth, logging | No `maximum-prefix` — a leaking peer melts you |
| 6 | **Zero hallucinations** | Critical | Every command exists on the target platform | Invented syntax like `neighbor x default-only` |

Criteria 2 and 6 are pass/fail gates. A config that leaks routes or won't parse is a zero no matter how pretty the rest is.

---

## Claude's Run, Scored

Here is the config Claude produces from the prompt above:

```
! Pull-up route so the network statement always has something to originate
ip route 192.0.2.0 255.255.255.0 Null0
!
ip prefix-list DEFAULT-ONLY  permit 0.0.0.0/0
ip prefix-list MY-PREFIX-OUT permit 192.0.2.0/24
!
route-map ISP-A-IN permit 10
 match ip address prefix-list DEFAULT-ONLY
 set local-preference 200
!
router bgp 65010
 bgp router-id 192.0.2.1
 bgp log-neighbor-changes
 network 192.0.2.0 mask 255.255.255.0
 !
 neighbor 203.0.113.1 remote-as 64500
 neighbor 203.0.113.1 description ISP-A-primary
 neighbor 203.0.113.1 password 0 USE-A-REAL-SECRET
 neighbor 203.0.113.1 maximum-prefix 10 90 restart 60
 neighbor 203.0.113.1 route-map ISP-A-IN in
 neighbor 203.0.113.1 prefix-list MY-PREFIX-OUT out
 !
 neighbor 198.51.100.1 remote-as 64501
 neighbor 198.51.100.1 description ISP-B-backup
 neighbor 198.51.100.1 password 0 USE-A-REAL-SECRET
 neighbor 198.51.100.1 maximum-prefix 10 90 restart 60
 neighbor 198.51.100.1 prefix-list DEFAULT-ONLY in
 neighbor 198.51.100.1 prefix-list MY-PREFIX-OUT out
```

Scoring it honestly:

| # | Criterion | Result | Note |
|---|-----------|--------|------|
| 1 | Prefix originated | ✅ | `network` line backed by the `Null0` pull-up route |
| 2 | Outbound filter | ✅ | `MY-PREFIX-OUT` on **both** neighbors — only our /24 leaves |
| 3 | Inbound default-only | ✅ | `DEFAULT-ONLY` enforced inbound on both |
| 4 | Path policy | ✅ | `local-preference 200` on ISP-A inbound; ISP-B keeps default 100 |
| 5 | Safety rails | ✅ | `maximum-prefix`, `password`, `log-neighbor-changes` all present |
| 6 | Hallucination-free | ✅ | Every command is valid IOS |

Six for six — but read the honest asterisk, because it is the actual lesson:

> **Claude only scores six-for-six on the detailed prompt.** Give it the lazy version — *"write me a BGP config for dual homing to two ISPs"* — and Claude, like every other model, frequently ships criteria 1–5 and silently drops **criterion 2**. The neighbors come up, the lab passes, and the outbound filter that stops a route leak is nowhere. The model didn't get dumber. The prompt got lazier.

That is the real finding of this rig: on BGP, **the quality of the config tracks the quality of the prompt almost linearly**, and the most expensive omission is the one that is invisible until a peer sends you a full table.

---

## Where AI Models Leak: The Failure Modes to Score Against

When you run the prompt on ChatGPT and Gemini (do it — that's the rig), grade them against the six criteria. Per documented model behavior and our own runs, these are the points that get dropped, in rough order of how often and how badly:

- **The transit leak (criterion 2).** The most common and the most dangerous. The config has both neighbors, both come up, and there is no outbound prefix-list — so the router will re-advertise anything it learns. On the terse prompt, all three models miss this regularly. On the explicit prompt, it separates the careful generations from the rushed ones.
- **Accepting full tables (criterion 3).** You asked for a default only; the model omits the inbound filter and your edge router cheerfully installs 950,000 routes it has no RAM budget for.
- **No `maximum-prefix` (criterion 5).** Skipped constantly because it feels optional. It is the single command that turns "a peer leaked the table at us" from an outage into a logged warning.
- **Policy set in the wrong direction (criterion 4).** `local-preference` is locally significant and influences *outbound* path choice, so it must be applied *inbound*. Models sometimes set it outbound, where it does nothing for you, or reach for `weight` and hardcode it per-neighbor in a way that breaks on failover.
- **Hallucinated convenience syntax (criterion 6).** Invented commands that read plausibly — a `neighbor ... default-route-only` knob that does not exist, or NX-OS `route-map` syntax pasted into an IOS config. These fail at paste time, which is the *good* case; the bad case is the ones that parse and do the wrong thing.

We are not going to fabricate ChatGPT and Gemini transcripts here — that would make us exactly the AI-slop vendor this site exists to audit. Run the prompt yourself, score the outputs, and you will see the pattern.

---

## Run It Yourself (and graduate this into a real bench)

This is a rig, not a verdict. The honest version of "Claude wins" is **"here is the test, here is Claude's scored run, go check the others."**

If you run the prompt on ChatGPT and Gemini and send us the raw outputs (`hello@packetpilotai.com`, or reply to Packet Drop), we will score them against this exact rubric and publish the full head-to-head with your transcripts credited. The rubric stays fixed; only the contestants change. That is how a benchmark earns trust — the metric is public and the inputs are reproducible.

---

## The Review Prompt That Catches a Leak Before It Ships

Whether the config came from an AI or a tired human at 2 AM, run it through this before it touches a router. Keep it in your pack:

```
Here is a Cisco IOS BGP config for a dual-homed edge router in AS [ASN]:
[paste config].

We must advertise ONLY our own prefix [prefix] and must NOT act as a
transit AS. Audit this config specifically for:
  1. Is there an outbound prefix-list on EVERY eBGP neighbor permitting
     only our prefix? If any neighbor lacks it, flag it as a route-leak risk.
  2. Is inbound filtering present and does it match our stated intent?
  3. Is maximum-prefix configured on every neighbor?
List each finding as PASS / FAIL with the exact line that proves it.
```

The `EVERY neighbor` and `the exact line that proves it` phrasing is what forces the model to actually check instead of summarizing — the same discipline that makes the generation prompt work.

---

## The One-Line Takeaway

**On BGP, the config is only as safe as the prompt is specific — and the line every model forgets is the outbound filter that keeps you from becoming someone's accidental transit.**

---

## Next in the Showdown

Showdown #02 — same three models, a different muscle: *"write a Netmiko script to back up the configs of 50 switches."* Who handles credentials safely, who swallows exceptions, and who writes a script that silently skips the devices it can't reach?

— **Subscribe to Packet Drop** (newsletter form below) to get the next head-to-head when it ships.

— **Want the structured prompts that score six-for-six?** [Get the Prompt Pack](/prompt-pack) — 60 production prompts for network admins, $29, lifetime updates.
