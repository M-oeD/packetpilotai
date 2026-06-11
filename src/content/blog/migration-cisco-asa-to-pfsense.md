---
title: 'Migration Playbook: Cisco ASA → pfSense, With Claude as Your Translator'
description: 'A field-tested playbook for moving from Cisco ASA to pfSense — the security-level trap that breaks one-to-one ACL translation, NAT and VPN mapping, the AnyConnect problem, gotchas, and a rollback plan. Plus the Claude prompt that does the line-by-line translation.'
pubDate: '2026-05-31'
stream: 'migration'
streamNum: 1
heroAscii: |
  CISCO ASA                       pfSense
  ──────────────────────────────────────────────────
  security-level 100 / 0     →    (no equivalent)
  access-list OUTSIDE_IN     →    Firewall ▸ Rules
  nat (inside,outside)       →    Firewall ▸ NAT
  crypto map / IKEv2         →    VPN ▸ IPsec
  AnyConnect SSL VPN         →    VPN ▸ OpenVPN   ⚠ new client
  object-group               →    Firewall ▸ Aliases
  ──────────────────────────────────────────────────
  [!] the trap: ASA trusts by security-level. pfSense trusts nothing.
---

The reason ASA-to-pfSense migrations go sideways is almost never the firewall rules people worry about. It is the rules they *don't* write — because on the ASA, the rule was never explicit in the first place. The ASA has a trust model baked into every interface called the **security level**, and pfSense has nothing like it. Translate the ACLs line-for-line, forget the security levels, and you will ship a firewall that blocks traffic your old one quietly allowed.

This is the playbook: what maps to what, the order to do it in, the gotchas that cost a weekend, and a rollback plan that does not involve a panicked drive to the datacenter. Claude does the mechanical translation; you make the judgment calls.

---

## When This Migration Is Worth It

Run the decision tree before you touch anything:

- **ASA hitting end-of-support, or the renewal quote made you wince?** → Strong case. This is most people.
- **You rely on AnyConnect for hundreds of remote users with a tuned posture/SAML setup?** → Slow down. The VPN re-platforming (below) is the hardest part; budget for it separately or keep the ASA as a VPN-only headend.
- **You need vendor TAC on a 4-hour SLA for compliance reasons?** → pfSense Plus with a Netgate support contract exists, but confirm it satisfies your auditor before committing.
- **You just want cheaper, inspectable, commodity-hardware firewalling?** → This is exactly what pfSense is good at.

If you cleared the tree, here is the work.

---

## The Conceptual Map

Most of the migration is translating one mental model into another. This table is the whole migration in miniature — print it.

| Cisco ASA | pfSense | The catch |
|-----------|---------|-----------|
| `security-level` (0–100) | **Nothing** — trust is expressed only through rules | The #1 trap. ASA implicitly permits high→low; pfSense permits nothing implicitly |
| `access-list ... in interface X` | **Firewall ▸ Rules**, per-interface tab | pfSense rules are first-match, top-down, evaluated on the **ingress** interface |
| `nat (inside,outside)` / object NAT | **Firewall ▸ NAT ▸ Outbound** (Auto/Hybrid/Manual) | Switch to **Hybrid** or **Manual** to recreate specific rules |
| Static / twice NAT, mapped IPs | **NAT ▸ Port Forward** and **1:1 NAT** | The auto-created firewall rule matches the **internal** target IP, not the WAN IP |
| `object-group network/service` | **Firewall ▸ Aliases** | Aliases nest and can be reused across rules — cleaner than ASA groups |
| `crypto map` / IKEv1 / IKEv2 site-to-site | **VPN ▸ IPsec** (Phase 1 / Phase 2) | Match DH group, PFS, and lifetimes to the *peer*, which you don't control |
| **AnyConnect** SSL VPN | **VPN ▸ OpenVPN** or **WireGuard** | pfSense cannot be an AnyConnect headend. Clients **must** change |
| `nameif` / subinterfaces | **Interfaces** + **VLANs** | Assign VLANs first, then interfaces, then rules |
| `route outside ...` | **System ▸ Routing ▸ Static Routes** | Gateways are first-class objects you create before routes |
| Active/standby failover | **CARP** + pfsync + XMLRPC config sync | Active/passive; sync the state table or VPNs drop on failover |

---

## The Security-Level Trap, Concretely

On the ASA, this config silently permits all traffic from `inside` (level 100) to `outside` (level 0):

```
interface GigabitEthernet0/0
 nameif inside
 security-level 100
interface GigabitEthernet0/1
 nameif outside
 security-level 0
```

There is no ACL line authorizing outbound traffic. The security level *is* the authorization. An admin reading the running-config sees no "permit inside to outside" rule because none exists — the permission is structural.

pfSense has no structural permissions. A freshly assigned interface **passes nothing inbound** until you write a rule. So when you migrate, you have to make every implicit ASA permission **explicit**:

```
# pfSense LAN rule that recreates "security-level 100 → 0"
Action:      Pass
Interface:   LAN
Source:      LAN subnets
Destination: any
```

Miss this and "the internet stopped working" after cutover — not because you mistranslated an ACL, but because you translated the ACLs perfectly and forgot the rule the ASA never made you write. **Walk every interface pair and ask: did the ASA allow this implicitly by security level? If yes, write an explicit pass rule.**

---

## The Order of Operations

Do it in this sequence. Each step depends on the one before it.

1. **Inventory the ASA.** `show running-config` is the source of truth. Pull out, in order: interfaces + `nameif` + security-levels, `object` / `object-group`, `access-list`, all NAT (`object nat`, `nat` twice-NAT), `crypto`/VPN, static routes, DHCP.
2. **Stand up pfSense in parallel.** Do **not** cut over a live firewall. New hardware/VM, separate management IP. Configure interfaces and VLANs to match.
3. **Recreate objects as Aliases first.** Rules and NAT will reference them, so they have to exist up front. One alias per ASA object-group.
4. **Translate ACLs into firewall rules** — per interface, top-down, first-match. Then add the explicit pass rules for every implicit security-level permission (above).
5. **Rebuild NAT.** Set Outbound NAT to Hybrid or Manual, recreate your specific source-NAT rules, then add Port Forwards and 1:1 mappings. Remember the associated-filter-rule quirk.
6. **Re-platform the VPNs.** Site-to-site → IPsec, phase-for-phase against the peer's parameters. AnyConnect → OpenVPN/WireGuard, which means new client software and new user profiles (plan this as its own project).
7. **Pilot in parallel.** Move one test VLAN or a few willing users behind pfSense. Watch states, logs, and VPN stability for a few days.
8. **Cut over.** Swap the gateway/uplink during a window. Keep the ASA powered and cabled.
9. **Hold the rollback open** for at least a full business cycle before you decommission the ASA.

---

## Gotchas That Cost a Weekend

- **AnyConnect users need a new client.** This is the migration's sharpest edge. OpenVPN Connect or the WireGuard app replaces AnyConnect; every remote user re-installs and re-imports a profile. Your LDAP/RADIUS backend and certs can usually carry over, but the client cannot. Communicate it two weeks early, not the morning of.
- **The Port Forward filter-rule surprise.** When pfSense auto-creates the firewall rule for a Port Forward, that rule's destination is the **internal** (post-NAT) host — not the public IP. Admins coming from the ASA, where the ACL references the **mapped/outside** address, stare at this for an hour. It's correct; it's just inside-out from what you expect.
- **Asymmetric routing kills states.** pfSense is strictly stateful. A multi-WAN or multi-interface topology where reply traffic returns on a different interface than it left will have its state torn down and the connection dropped. ASA tolerates more of this. Audit your routing before cutover; use floating rules or `sloppy` state where genuinely required.
- **The default LAN allow-any rule is a loaded gun.** pfSense ships a permissive "LAN → any" rule so you don't lock yourself out on day one. That is not a security posture. Replace it with your actual egress policy before go-live.
- **Crypto must match the peer you don't control.** Site-to-site Phase 1/Phase 2 (DH group, encryption, PFS, lifetimes) has to match the far end exactly. The far end is someone else's ASA/router. Get their parameters in writing first.
- **Sizing and AES-NI.** The ASA had purpose-built crypto silicon. On commodity hardware, confirm your CPU has AES-NI and that pfSense is using it, or IPsec throughput will disappoint under load.

---

## Claude as the Translator

The mechanical part — turning ASA syntax into pfSense intent — is exactly what an LLM is good at, *if* you make it account for the security-level trap instead of translating blind. Keep this in your pack:

```
You are migrating a Cisco ASA configuration to pfSense.

Here is the relevant ASA config: [paste interfaces with security-levels,
the object-groups, and the access-lists].

Do all of the following:
  1. List every interface with its nameif and security-level.
  2. For each interface PAIR, state whether the ASA implicitly permits
     traffic by security level with NO matching ACL line. Flag each
     implicit permission — these need EXPLICIT pfSense pass rules.
  3. Translate each access-list entry into a pfSense firewall rule
     (interface, action, source, destination, port), preserving order.
  4. Convert each object-group into a pfSense Alias.
Output a table per interface. Do not assume pfSense permits anything by
default — it does not.
```

The line that earns its keep is #2. Without it the model dutifully translates your ACLs and never tells you about the permissions the ASA was granting for free — which is the exact way these migrations break.

Then audit the result against the [firewall-rule review prompt](/blog/using-claude-to-audit-firewall-rules) before go-live.

---

## The Rollback Plan

A migration without a tested rollback is a gamble. Before the cutover window:

- **Keep the ASA fully configured, powered, and cabled.** The revert is a routing/uplink change, not a rebuild.
- **Write the exact revert steps down**, including which cable moves or which gateway IP changes, and roughly how long it takes. If you can't state it in three lines, you don't have a rollback — you have a hope.
- **Export the pfSense config** (`Diagnostics ▸ Backup & Restore`) the moment it's working, so a failed experiment costs minutes, not the whole build.
- **Define the trigger in advance:** "if remote VPN users can't connect by 07:00, we revert." Decide the abort condition before you're tired and invested.

---

## The One-Line Takeaway

**Translating the ACLs is the easy 80%. The migration lives or dies on the permissions the ASA granted implicitly by security level — make every one of them an explicit pfSense rule, or ship a firewall that's quietly stricter than the one it replaced.**

---

## Next in the Migration Playbook

Migration #02 — **FortiGate → OPNsense.** Different vendor pair, different trap: FortiGate's policy-based NAT and the way its implicit deny interacts with the SD-WAN rules people forget they enabled.

— **Subscribe to Packet Drop** (newsletter form below) to get the next playbook when it ships.

— **Want the translation and audit prompts ready-to-paste?** [Get the Prompt Pack](/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=migration-cisco-asa-to-pfsense) — 60 production prompts for network admins, $29, lifetime updates.
