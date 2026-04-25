---
title: 'Using Claude to Audit Firewall Rules'
description: 'Firewall rulebases grow until nobody remembers what half the entries do — and the audit nobody wants to run is the one that finds the holes. AI changes the math. Here are five prompts that turn Claude into a tireless firewall reviewer, plus the privacy guardrails to keep you safe.'
pubDate: '2026-04-24'
heroAscii: |
  $ claude "audit this ACL — find shadowed and overly permissive rules"

  ip access-list extended OUTSIDE_IN
   10 permit tcp any any eq 443
   20 permit tcp 10.0.0.0 0.255.255.255 any eq 443   ← [SHADOW] never matches
   30 permit ip any any                              ← [PERMISSIVE] effectively no firewall
   40 deny  tcp any any eq 23                        ← [DEAD CODE] line 30 already permitted

  [!] 1 shadowed rule, 1 dead-code rule, 1 catch-all permit
  [→] Recommend reordering or removing lines 20, 30, 40
---

Every firewall rulebase tells a story. The first ten rules are intentional. The next twenty are reactions to specific tickets. By rule fifty, nobody remembers whether `permit tcp any any eq 8443` was for the legacy app that retired in 2022 or the new one that went live last quarter — and nobody wants to be the person who removes it and breaks something.

That's why audits don't happen. They're tedious, they require deep context, and the cost of getting one wrong is bigger than the cost of doing nothing. AI doesn't fix the political problem, but it absolutely fixes the tedious one. Claude will read a 400-line rulebase faster than you can pour coffee, and it'll flag the things that take a human hours to spot.

This post walks through five prompts I've used against real configs (sanitized). Each one is paste-ready.

---

## Step 0: Export and Sanitize the Config First

**Don't paste production firewall configs into any AI without thinking about it.** Even with a paid plan, even with privacy guarantees, treat the export like you'd treat any other place sensitive data shouldn't go.

The two minimum sanitization steps:

```bash
# Replace your real public IP ranges with placeholders
sed -i 's/203\.0\.113\.\([0-9]*\)/198.51.100.\1/g' export.txt

# Strip any embedded secrets (SNMP communities, RADIUS keys, IKE PSKs)
sed -i 's/snmp-server community [^ ]*/snmp-server community REDACTED/g' export.txt
sed -i 's/key 7 [^ ]*/key 7 REDACTED/g' export.txt
```

What's safe enough to paste:
- Rule numbers and structure
- Port numbers and protocols
- Internal subnets in RFC1918 form (10.x, 172.16.x, 192.168.x)
- Object/group names that don't reveal customers or projects
- Comments — but only if they don't name people or accounts

What to redact every time:
- Public IP space you own (use 198.51.100.0/24 or 203.0.113.0/24 placeholders)
- SNMP communities, IKE pre-shared keys, RADIUS keys, IPsec credentials
- Hostnames or object names that identify customers, products, or staff
- Anything tagged with a ticket or change number

For most audits, the sanitized version is just as auditable as the real one — Claude doesn't need to know whose IP it is to spot that rule 30 is shadowing rule 80.

---

## Prompt 1: Find Shadowed and Redundant Rules

A shadowed rule is one that never matches because an earlier rule already handles its traffic. They clutter the rulebase and trick you into thinking a policy is in effect when it isn't.

**Prompt:**
> You are a senior network security engineer doing a firewall audit. Below is an extended ACL from a Cisco IOS device. Identify any rules that are shadowed (never match because an earlier rule covers their traffic) or redundant (multiple rules doing the same thing). For each finding, give me the rule number, what shadows it, and a one-line recommendation.
>
> ```
> [paste sanitized ACL here]
> ```

**Sample finding:**

```
Rule 50:  permit tcp 10.0.5.0/24 any eq 443
  → SHADOWED by rule 20 (permit tcp any any eq 443)
  → Recommendation: remove rule 50, or reorder if 50 was intended to be more specific

Rule 110: permit udp 192.168.1.0/24 any eq 53
  → REDUNDANT with rule 90 (permit udp 192.168.0.0/16 any eq 53)
  → Recommendation: remove rule 110 unless intentional documentation
```

Two cleanups in 30 seconds. A human doing this manually checks every rule against every preceding rule — O(n²) attention.

---

## Prompt 2: Find Overly Permissive Rules

`permit ip any any` is the obvious one, but the dangerous version is subtler — rules that look specific but effectively allow far more than intended.

**Prompt:**
> Audit the following firewall rules for overly permissive entries. Flag any rule that:
> - Uses `any` as source AND `any` as destination
> - Permits a wide port range (more than 100 ports) outbound or inbound
> - Permits a /16 or larger network without justification
> - Permits dangerous services (RDP/3389, SMB/445, SSH/22, telnet/23) from untrusted sources
> - Has a destination of `0.0.0.0/0` from internal sources without proxy intermediation
>
> For each finding, return: rule number, what's permissive about it, the realistic exposure if exploited, and a tighter alternative.
>
> ```
> [paste sanitized rules here]
> ```

**Why this prompt works:** specificity. "Find permissive rules" gets you garbage. "Find rules with these five specific patterns" gets you a real audit, because Claude has explicit criteria to evaluate against.

**Sample finding:**

```
Rule 80: permit tcp any 10.0.0.0/8 eq 3389
  → Permissive: RDP open to entire internal /8 from any source
  → Exposure: any compromised internal host (or VPN user) can pivot to every
              Windows machine in the org
  → Tighter: permit tcp <jump-host> 10.0.0.0/8 eq 3389
              + allow specific admin source IPs only
```

---

## Prompt 3: Detect Misordered Rules

Firewall rules are evaluated top-down, first-match-wins. A `deny` placed below a `permit` for the same traffic is dead code. So is a specific `permit` placed below a broad `permit`.

**Prompt:**
> I'm going to paste a firewall rulebase. Walk through it in evaluation order (top to bottom). For each rule, ask "given the rules above this one, is this rule reachable, and does it change behavior?" Return a list of:
> - Rules that are unreachable (will never be evaluated because earlier rules already match)
> - Rules whose order should be reversed for security reasons (e.g., a specific deny placed below a broader permit that defeats it)
> - The recommended new ordering
>
> ```
> [paste sanitized rulebase here]
> ```

This one finds the bugs that look fine line-by-line but break when you read them as a flow.

---

## Prompt 4: Generate Inline Documentation

Half of every old firewall rulebase is "what does this rule even do?" Claude can read the rule, infer the intent, and produce inline comments — which is the version your future self will thank you for.

**Prompt:**
> For each rule below, generate a single-line comment in the firewall's native syntax (`remark` for Cisco, descriptions for Palo Alto, etc.) that explains:
> - The intent in plain English
> - The likely business reason (what the rule enables — e.g., "users → M365", "DMZ web → DB tier")
> - Any caveats (overly broad, legacy, etc.) that should prompt review
>
> Output in the original rule order, with the comment placed immediately above each rule.
>
> ```
> [paste sanitized rules here]
> ```

**Sample output:**

```
remark Allow internal users to reach M365 (HTTPS to Microsoft endpoints)
permit tcp 10.0.0.0/8 13.107.0.0/16 eq 443

remark Legacy: review — guest VLAN to printer subnet, may pre-date BYOD policy
permit tcp 192.168.20.0/24 192.168.50.0/24 eq 9100
```

The "review" tags are gold. They give you a punch list of rules to ask owners about, and most of the time the answer is "remove it."

---

## Prompt 5: Translate Rules Between Vendors

Migrating from one platform to another is where ACL audits suddenly become unavoidable. Claude is unusually good at vendor-to-vendor syntax translation, and it'll preserve the policy intent rather than just doing a literal command swap.

**Prompt:**
> Convert the following Cisco IOS extended ACL into an equivalent Palo Alto Networks security policy. Preserve the policy intent, not just the syntax. Use named address objects and service objects rather than inline literals — propose object names that reflect the rule's purpose. For each rule, output:
> 1. The proposed object definitions (address, service)
> 2. The security policy entry referencing those objects
> 3. A note flagging any Cisco-specific behavior (implicit deny, established, log-input) that maps differently in Palo Alto
>
> ```
> [paste sanitized Cisco ACL here]
> ```

This gets you a policy you can review and refine, not a literal translation that papers over the platform differences. Same prompt structure works for Fortinet, Check Point, or pfSense — just swap the target platform.

---

## What This Workflow Doesn't Replace

A few things to be honest about:

- **It doesn't see your traffic.** Claude can flag that a rule looks unused; only your flow logs prove it. Pair AI audits with hit-counter exports (Cisco `show access-list`, Palo Alto rule usage report) before you delete anything.
- **It doesn't know your business.** If a rule is technically permissive but enables a critical workflow you didn't mention, Claude will recommend tightening it. Always validate findings with the application owner before changing anything.
- **It can hallucinate platform syntax.** Modern Claude is good at this, but rare commands or vendor edge cases occasionally come back wrong. Verify in a lab or against vendor docs before pushing to production.
- **It is not a compliance auditor.** PCI, HIPAA, CTPAT, ISO 27001 — those need a human reviewer who can sign off on what they reviewed. Use AI to prepare the data; let the human do the attestation.

---

## Privacy and Data Handling

A few practical rules that have aged well:

- Use a paid tier where data isn't used for training — or run a local model if your environment is genuinely sensitive
- Never paste secrets (PSKs, community strings, RADIUS keys) into any AI tool, paid or free
- Sanitize public IP space, hostnames, and customer-identifying object names before pasting
- For regulated environments, get this workflow approved in writing before using it on production exports
- Treat AI conversation history like any other log: review the retention policy and clear sessions when done

---

## A Workable Audit Cadence

Once these prompts are in your toolbox, the audit doesn't have to be a two-week project anymore. A workable cadence:

```
Quarterly:
├─ Export rulebase, sanitize, run prompts 1–3
├─ Pull hit counters, cross-reference unused rules
├─ Email rule owners for any "review" tagged rules
└─ Implement removals/tightenings via change control

Annually:
├─ Run prompt 4 to refresh inline documentation
└─ Consider a vendor translation (prompt 5) as a forcing function
   for rebuilding the rulebase cleanly
```

The goal isn't to let AI run your firewall — it's to take the *parts of the audit a computer should do* off your plate, so the human time goes to the calls that actually need judgment. That's the entire premise of every useful AI workflow, and firewall audits are an unusually good fit.
