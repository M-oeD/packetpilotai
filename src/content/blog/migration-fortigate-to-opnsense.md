---
title: 'Migration Playbook: FortiGate → OPNsense, With Claude as Your Translator'
description: 'Moving from FortiGate to OPNsense means unbundling one of FortiGate''s all-in-one firewall policies into the separate rule, NAT, and inspection objects OPNsense uses — and rebuilding the SD-WAN and UTM behavior people forget they turned on. The conceptual map, the policy-unbundling trap, gotchas, a rollback plan, and the Claude prompts that do the translation.'
pubDate: '2026-05-31'
stream: 'migration'
streamNum: 2
heroAscii: |
  FORTIGATE                          OPNsense
  ─────────────────────────────────────────────────────────
  firewall policy (all-in-one)  →    Rule + NAT + UTM (separate)
    ├ src / dst / service       →      Firewall ▸ Rules
    ├ NAT (inside the policy)   →      Firewall ▸ NAT
    └ UTM profiles (AV/IPS/web) →      Suricata / web proxy (plugins)
  zones / VDOMs                 →    Interfaces / (no VDOM equivalent)
  SD-WAN rules                  →    Gateways + Gateway Groups + PBR
  FortiClient SSL VPN           →    OpenVPN / WireGuard   ⚠ new client
  ─────────────────────────────────────────────────────────
  [!] the trap: one Forti policy = four OPNsense objects. Unbundle them.
---

The FortiGate-to-OPNsense migration breaks differently than the [ASA-to-pfSense one](/blog/migration-cisco-asa-to-pfsense). The ASA trap was an *implicit* permission you had to make explicit. The FortiGate trap is the opposite: a single, *over-loaded* object you have to take apart. One FortiGate firewall policy quietly does four jobs — filtering, NAT, threat inspection, and logging — and OPNsense splits those across four different places. Translate the policy as if it only filters, and you'll ship a firewall that passes the right traffic with none of the inspection it used to do.

This is the playbook: the conceptual map, the unbundling discipline, the SD-WAN and UTM work people underestimate, and a rollback that isn't a prayer. Claude does the decomposition; you make the calls.

---

## When This Migration Is Worth It

- **FortiGate hitting EOL or a painful FortiGuard renewal?** → Strong case.
- **You lean hard on the integrated security fabric** — FortiGuard AV/IPS/web-filter/app-control with SSL deep inspection, tuned over years? → Slow down. OPNsense can do most of it with plugins, but **not as one integrated stack**, and SSL inspection especially is its own project. Budget for it separately.
- **You run multiple VDOMs?** → There is no OPNsense VDOM. That's either multiple OPNsense instances or a careful single-instance redesign. Decide before you start.
- **You want inspectable, commodity-hardware firewalling and your UTM needs are modest?** → This is OPNsense's sweet spot.

---

## The Conceptual Map

| FortiGate | OPNsense | The catch |
|-----------|----------|-----------|
| **Firewall policy** (bundles filter + NAT + UTM + log) | **Rule** + **NAT** + **plugin** — separate objects | The whole migration. One policy decomposes into up to four things |
| `srcintf`/`dstintf` + `srcaddr`/`dstaddr` + `service` | **Firewall ▸ Rules**, per-interface | OPNsense rules are evaluated on the **ingress** interface, first match |
| NAT inside the policy (`nat enable`, IP pools) | **Firewall ▸ NAT** (Outbound / 1:1 / Port Forward) | First find out if the FortiGate uses **central NAT** or **policy NAT** |
| Security profiles (AV, IPS, web, app-ctrl, SSL) | **Suricata**, **web proxy**, **Zenarmor/Sensei** plugins | Not one-to-one; each is a separate package to install and tune |
| **Address / service objects & groups** | **Firewall ▸ Aliases** | Clean mapping; build these first |
| **Zones** | Interface groups | Conceptually close |
| **VDOMs** | **Nothing** | Multiple virtual firewalls → multiple instances |
| **SD-WAN** rules + performance SLA | **Gateways** + **Gateway Groups** + policy-based routing | Rebuilt from parts; health-check tuning is manual |
| Static / policy routes | **System ▸ Routing** | Gateways are first-class objects |
| **FortiClient** SSL VPN | **OpenVPN** / **WireGuard** | Clients **must** change |
| IPsec site-to-site | **VPN ▸ IPsec** | Match Phase 1/2 to the peer exactly |

---

## The Policy-Unbundling Trap, Concretely

A single FortiGate policy looks like this in spirit:

```
config firewall policy
  edit 12
    set srcintf "internal"
    set dstintf "wan1"
    set srcaddr "LAN_NET"
    set dstaddr "all"
    set service "HTTPS" "DNS"
    set action accept
    set nat enable                 ← NAT lives INSIDE the policy
    set av-profile "default"       ← so does antivirus
    set ips-sensor "protect_client"   ← and IPS
    set webfilter-profile "corp"   ← and web filtering
    set ssl-ssh-profile "deep"     ← and SSL inspection
  next
end
```

That is **one line in the GUI** and **four jobs**. In OPNsense it becomes:

1. A **firewall rule** (`internal` → any, service HTTPS/DNS, pass) — the filtering.
2. **Outbound NAT** for `LAN_NET` — the `nat enable` part, configured in a completely different menu.
3. A **Suricata** policy and/or **web proxy** category set — the `av`/`ips`/`webfilter` profiles, as plugins you install and tune.
4. **Logging** enabled on the rule — FortiGate logged this by policy; you set it per OPNsense rule.

Translate only job #1 and the traffic flows — which is exactly why the mistake survives testing. The malware scanning, IPS, and web filtering that the FortiGate was silently doing are just *gone*, and nothing about a passing connection tells you so. **For every policy, write down all four jobs before you build anything, and check them off in OPNsense one at a time.**

One more thing to resolve up front: **which NAT mode** the FortiGate runs. With **central NAT** disabled (the default), NAT is configured per-policy as above. With central NAT **enabled**, NAT lives in separate Central SNAT/DNAT tables and the policies don't carry it. You read — and translate — the config completely differently depending on which it is, so check first.

---

## The Order of Operations

1. **Inventory the FortiGate.** `show full-configuration` (or a GUI revision backup). Pull, in order: VDOMs, zones/interfaces, address & service objects/groups, **NAT mode**, firewall policies *with their UTM profiles noted*, SD-WAN config, VPNs, routes.
2. **Stand up OPNsense in parallel.** New box/VM, interfaces and VLANs to match. Never cut over live.
3. **Recreate objects as Aliases** first — rules and NAT will reference them.
4. **Decompose each policy** into its rule, its NAT piece, and a note of which UTM profiles it used. This is the bulk of the work.
5. **Rebuild NAT** (Outbound NAT → Hybrid/Manual; Port Forwards; 1:1), matching the FortiGate's NAT mode.
6. **Rebuild UTM as plugins:** Suricata for IDS/IPS, web proxy for category filtering, Zenarmor/Sensei for app-aware L7 if you need it. Accept that this is tuning, not translation.
7. **Rebuild SD-WAN** as Gateways + Gateway Groups + policy-based routing (firewall rules with a gateway set) + gateway monitoring.
8. **Re-platform VPNs:** IPsec site-to-site phase-for-phase against the peer; FortiClient SSL VPN → OpenVPN/WireGuard (new client, plan user comms).
9. **Pilot in parallel**, then cut over in a window, then hold the rollback open.

---

## Gotchas That Cost a Weekend

- **The bundled NAT and UTM are the easy things to drop.** They're invisible in the "does traffic flow?" test. Build the four-jobs checklist and don't skip it.
- **Resolve central-vs-policy NAT before translating** — guess wrong and every NAT rule is in the wrong place.
- **UTM is not one-to-one.** FortiGuard's integrated stack becomes several independently tuned plugins. SSL deep inspection is the hardest to reproduce and the easiest to under-scope.
- **SD-WAN was probably doing more than you remember.** Application-aware path selection and failover get rebuilt from gateway groups and PBR; until you do, traffic that used to fail over just… doesn't.
- **VDOMs don't exist in OPNsense.** A multi-VDOM FortiGate is a multi-instance OPNsense design, not a single box.
- **FortiClient users need a new client.** OpenVPN Connect or WireGuard, with new profiles. Comms two weeks early.
- **Hardware offload disappears.** FortiGate's NP ASICs do in silicon what OPNsense does in software. UTM/IPS throughput in particular drops hard off-ASIC — size the hardware (and AES-NI) for the real inspected load.

---

## Claude as the Translator

The decomposition is mechanical once you force the model to account for all four jobs, not just the filter:

```
You are migrating a FortiGate firewall policy to OPNsense.

Here is the policy and its referenced objects: [paste the firewall policy,
the address/service objects, and any referenced security profiles].
Also: central NAT is [enabled/disabled] on this FortiGate.

For this single policy, output FOUR sections:
  1. The OPNsense firewall RULE (interface, action, source, dest, service).
  2. The NAT translation it implies, and where it goes in OPNsense.
  3. Every UTM profile it references (AV, IPS, web filter, app control, SSL)
     and the OPNsense plugin that replaces each.
  4. Whether logging is on, and the matching OPNsense rule logging setting.
Flag anything that has no clean OPNsense equivalent.
```

The "FOUR sections" structure is the whole point — it stops the model from translating the filter and dropping the NAT and UTM, which is precisely how these migrations lose their security posture. Then run the result through the [firewall-rule review prompt](/blog/using-claude-to-audit-firewall-rules) before go-live.

---

## The Rollback Plan

- **Keep the FortiGate configured, powered, and cabled.** The revert is a routing/uplink change.
- **Write the revert in three lines or fewer** — which cable or gateway changes, and how long it takes. If you can't, you don't have a rollback.
- **Export the OPNsense config** (`System ▸ Configuration ▸ Backups`) the moment it works.
- **Set the abort trigger in advance:** e.g., "if site-to-site VPN or remote users aren't up by 07:00, we revert." Decide it before you're tired.

---

## The One-Line Takeaway

**A FortiGate policy is four OPNsense objects in a trench coat — a rule, a NAT, an inspection plugin, and a log setting. Unbundle all four for every policy, and remember SD-WAN was quietly doing your path selection the whole time.**

---

## Next in the Migration Playbook

Migration #03 — **Cisco IOS router → VyOS**, and the mindset shift from `copy run start` to treating your edge config as code in a git repo.

— **Subscribe to Packet Drop** (newsletter form below) to get the next playbook when it ships.

— **Want the translation and audit prompts ready-to-paste?** [Get the Prompt Pack](/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=migration-fortigate-to-opnsense) — 60 production prompts for network admins, $29, lifetime updates.
