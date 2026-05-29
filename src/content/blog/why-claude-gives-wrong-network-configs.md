---
title: 'Why Claude Gives Wrong Network Configs (And the Fix That Takes 2 Minutes)'
description: 'Most network engineers try Claude once, get a hallucinated config or generic garbage, and give up. The problem is never Claude — it is the missing context. Here is the exact fix.'
pubDate: '2026-05-29'
heroAscii: |
  # Without context — what most people send:
  "write me an ACL for my cisco router"

  → generic, wrong interface names, no
    logging, probably outdated syntax

  # With context scaffold — what works:
  Platform: Cisco IOS-XE 17.9
  Interfaces: Gi0/0/0 (WAN), Gi0/0/1 (LAN)
  Goal: block inbound telnet, permit HTTPS

  → CLI-ready, paste-straight-in output ✓
---

You asked Claude to write a VLAN config. It gave you something that looked right. You pushed it. Something broke — wrong interface names, a command that doesn't exist on your IOS version, a subnet that conflicted with something else.

Or you got output so generic it was useless: placeholder interface names, `<your-subnet-here>` where real values should be, no comments, nothing you could actually use.

So you gave up. Claude isn't for network work, you decided.

The problem was never Claude. It was the prompt.

---

## Why AI Gets Network Configs Wrong

This is a documented problem, not a you-problem:

> *"AI can hallucinate command syntax, mix up vendor-specific commands, or generate configs that are technically valid but architecturally wrong."*
> — NetPilot Blog, 2026

> *"The core issue is complete lack of operational context. An LLM is a pattern-matching engine — it doesn't understand the intent behind the words, and it has no awareness of your network's history, unstated business rules, or the subtle dependencies between devices."*
> — rConfig Blog

> *"Requesting ten device configs in a single session results in IP addressing conflicts with no memory of topology between sessions."*
> — NetPilot Blog

> *"AI won't ask follow-up questions or make reasonable assumptions based on your company's standards. It'll just… guess. And those guesses often suck."*
> — Medium / CodeToDeploy, Dec 2025

These aren't edge cases. They're the default behavior of any LLM given a vague prompt. The fix isn't a better AI — it's a better context scaffold.

---

## What Claude Actually Needs

Claude can produce production-quality configs, working Python scripts, and accurate troubleshooting diagnosis — but only if you give it the same information you'd give a senior engineer on their first day.

Imagine a contractor shows up at your network rack. Before they touch anything, you tell them:

- What equipment you're working with (vendor, model, IOS version)
- How the interfaces are named and what they connect to
- What already exists that they shouldn't break
- What the goal is, in plain English

Without that briefing, they're guessing. So is Claude.

---

## The 2-Minute Context Scaffold

Before any network task, paste this block into Claude and fill in your specifics. Do it once per session (or set it as a Claude Project system prompt so it's automatic every time):

```
## My Network Environment

Platform: [Cisco IOS-XE 17.9 / Cisco NX-OS 10.x / Arista EOS 4.x / pfSense 2.7 / Junos 23.x — pick one]
Device: [e.g., Cisco Catalyst 9300, Nexus 9000, ASA 5516-X]
IOS/firmware version: [exact version — matters for command syntax]

Interface naming on this device:
  WAN:  [e.g., GigabitEthernet0/0/0]
  LAN:  [e.g., GigabitEthernet0/0/1]
  Mgmt: [e.g., Management0]

Existing IP scheme:
  LAN subnet:   [e.g., 10.10.0.0/24]
  Mgmt subnet:  [e.g., 10.10.99.0/24]
  WAN IP:       [e.g., 203.0.113.5/30]

VLANs already in use: [e.g., VLAN 10 = users, VLAN 20 = servers, VLAN 99 = mgmt]

Naming conventions: [e.g., interfaces named by location: "SW01-CORE", ACLs named "PERMIT_<purpose>_IN"]

What to preserve / not break: [e.g., existing OSPF area 0, existing ACL on Gi0/0/1]
```

That's it. Now ask your question.

---

## Before and After

### Without context scaffold

**Prompt:**
```
Write me an ACL to block inbound telnet from the internet.
```

**What Claude gives you:**
```
ip access-list extended BLOCK_TELNET
 deny   tcp any any eq 23
 permit ip any any
!
interface GigabitEthernet0/0
 ip access-group BLOCK_TELNET in
```

Problems: wrong interface name for your device, no logging, no remarks, probably won't match your existing ACL naming convention, may conflict with an ACL already on that interface.

---

### With context scaffold

**Prompt (after pasting the scaffold above):**
```
Write me an ACL to block inbound telnet from the internet on the WAN interface.
Follow my naming convention and don't touch the existing ACL on Gi0/0/0.
Add logging on the deny rule.
```

**What Claude gives you:**
```
! Existing ACL preserved — adding BLOCK_TELNET_IN separately
! Apply after verifying no conflict with existing ACL on Gi0/0/0

ip access-list extended PERMIT_WAN_IN
 remark === Block inbound Telnet ===
 deny   tcp any any eq 23 log
 ! ... append to existing ACL entries below this line
```

Correct interface name. Matches your naming convention. Logging added. Clear instructions for where it fits in relation to existing config. Ready to adapt and paste.

---

## The Vendor Problem

Cisco IOS, IOS-XE, NX-OS, and Arista EOS all look similar but behave differently. Claude knows all of them — but without the version, it defaults to the most generic interpretation:

| Platform | What changes |
|---|---|
| IOS vs IOS-XE | `ip access-list` vs `ip access-list extended`, `no shutdown` behavior |
| IOS-XE vs NX-OS | Interface naming, VRF syntax, BGP address-family structure |
| NX-OS | `feature` commands required before most protocols work |
| Arista EOS | `management api` for automation, different STP syntax |
| pfSense | GUI-first — Claude needs to know if you want CLI (shell) or XML config export |

Always specify the exact platform and version. It takes 5 seconds and changes the quality of output dramatically.

---

## The System Prompt Trick

If you use Claude for network work regularly, don't paste the scaffold every time. Set it once as a **Claude Project system prompt** — Claude will know your environment from the first message in every session.

**How to set it up:**
1. Go to [claude.ai](https://claude.ai) → Projects → New Project → "Network Work"
2. Open Project Instructions (the settings gear)
3. Paste your filled-in context scaffold as the system prompt
4. Name the project after your environment (e.g., "ACME Corp — Cisco IOS-XE")

Every conversation in that project now starts with Claude knowing your platform, interface names, IP scheme, and conventions. No more repeated context, no more generic output.

---

## The Three Prompts That Break Most Often (And How to Fix Them)

### 1. Config generation — wrong syntax

**Problem prompt:**
```
Configure BGP between two routers.
```

**Fixed prompt:**
```
Configure eBGP peering between two Cisco IOS-XE 17.9 routers.
Router A: 10.0.0.1/30, AS 65001
Router B: 10.0.0.2/30, AS 65002
Include: neighbor description, soft-reconfiguration inbound, send-community, and a prefix-list to advertise only 192.168.0.0/16.
Output: IOS-XE CLI for both routers. Use my naming convention: prefix-lists named "PL_<purpose>_OUT".
```

### 2. Troubleshooting — generic advice

**Problem prompt:**
```
My BGP session keeps dropping.
```

**Fixed prompt:**
```
My Cisco IOS-XE 17.9 BGP session to peer 10.0.0.2 (AS 65002) keeps dropping.
Here is the output of "show bgp neighbors 10.0.0.2":
[paste output]

Here is the syslog from the time it dropped:
[paste log lines]

Tell me: what is the most likely cause, what command confirms it, and what is the fix?
```

### 3. Python scripts — won't run on your devices

**Problem prompt:**
```
Write a Python script to back up my router configs.
```

**Fixed prompt:**
```
Write a Python 3.11 script using Netmiko to SSH into a list of Cisco IOS-XE 17.9 routers and save their running configs to timestamped .txt files.

Device list is in a CSV with columns: hostname, ip, username, password.
SSH port: 22. Timeout: 30 seconds.
Handle connection failures gracefully — log the error and continue to the next device.
Output: one file per device named "<hostname>_<YYYY-MM-DD>.txt" in a ./backups/ directory.
```

---

## Why This Matters More Than Switching Tools

A lot of network engineers try Claude once, get bad output, and decide AI "isn't ready" for network work. Some switch to specialized tools — Cisco AI Assistant, Juniper Marvis — which know the vendor but cost more and lock you in.

The real fix is cheaper: **a better prompt structure**. The three things that transform Claude output for network work are:

1. **Vendor + version** — eliminates wrong syntax
2. **Interface names and IP scheme** — eliminates generic placeholders  
3. **Constraints** — "don't break X, follow this naming convention" — eliminates configs that technically work but break your environment

None of this requires a new tool. It requires a template you fill in once.

---

## The Pre-Built Version

Building and refining these context scaffolds for every task type — BGP, VLANs, ACLs, OSPF, Python automation, firewall rules, documentation — is exactly what the [Claude Prompt Pack for Network Admins](/prompt-pack) contains.

Every prompt in the pack includes a pre-built context section with `[brackets]` for your specifics. Fill them in, paste into Claude, get CLI-ready output on the first try.

**[→ Get the Claude Prompt Pack — $29](/prompt-pack)**

60 prompts. One PDF. No Python required.
