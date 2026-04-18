---
title: 'How to Use AI to Generate Network Configurations'
description: 'Stop hand-writing configs. Learn how to use AI tools like ChatGPT and GitHub Copilot to generate accurate Cisco IOS, Junos, and MikroTik configurations in seconds.'
pubDate: '2026-04-18'
heroImage: '../../assets/blog-placeholder-1.jpg'
---

Every network admin has been there — staring at a blank config file, trying to remember the exact syntax for a VLAN trunk, an OSPF neighbor statement, or an ACL that does exactly what you need. You know *what* you want. Getting it written correctly is the friction.

AI changes that. In this guide you'll learn how to prompt AI tools to generate production-ready network configs, how to validate them before touching a device, and where the guardrails are.

---

## The Core Skill: Writing Good Prompts

AI generates configs based on what you tell it. Vague input → vague output. Specific input → config you can actually use.

**Bad prompt:**
> Make a VLAN config

**Good prompt:**
> Generate a Cisco IOS configuration for a Catalyst 2960 switch. Create VLAN 10 named CORP and VLAN 20 named GUEST. Assign Gi0/1 through Gi0/8 to VLAN 10 as access ports. Assign Gi0/9 through Gi0/16 to VLAN 20 as access ports. Configure Gi0/24 as a trunk port allowing VLANs 10 and 20.

The more context you give — device vendor, model, what ports, what behavior — the more accurate the output.

---

## Example 1: VLAN and Trunk Configuration (Cisco IOS)

**Prompt:**
> Generate Cisco IOS config for a 2960 switch. VLANs: 10 (CORP), 20 (GUEST), 99 (MGMT). Gi0/1-8 access VLAN 10, Gi0/9-16 access VLAN 20. Gi0/24 trunk, allow 10, 20, 99. Management IP 192.168.99.10/24 on VLAN 99.

**AI output (cleaned up):**

```
vlan 10
 name CORP
vlan 20
 name GUEST
vlan 99
 name MGMT

interface range GigabitEthernet0/1 - 8
 switchport mode access
 switchport access vlan 10
 spanning-tree portfast

interface range GigabitEthernet0/9 - 16
 switchport mode access
 switchport access vlan 20
 spanning-tree portfast

interface GigabitEthernet0/24
 switchport mode trunk
 switchport trunk allowed vlan 10,20,99

interface Vlan99
 ip address 192.168.99.10 255.255.255.0
 no shutdown

ip default-gateway 192.168.99.1
```

That's a complete, deployable config generated in about 10 seconds.

---

## Example 2: OSPF Neighbor Configuration

**Prompt:**
> Cisco IOS router. Configure OSPF area 0. Interfaces: Gi0/0 = 10.0.0.1/30 (connected to ISP router), Gi0/1 = 192.168.1.1/24 (LAN). Advertise LAN network only. Set Gi0/0 as passive if possible but still form neighbor.

**AI output:**

```
router ospf 1
 router-id 10.0.0.1
 passive-interface GigabitEthernet0/1
 network 10.0.0.0 0.0.0.3 area 0
 network 192.168.1.0 0.0.0.255 area 0

interface GigabitEthernet0/0
 ip address 10.0.0.1 255.255.255.252
 ip ospf 1 area 0

interface GigabitEthernet0/1
 ip address 192.168.1.1 255.255.255.0
 ip ospf 1 area 0
```

Note: AI correctly flagged in its response that making Gi0/0 fully passive would prevent neighbor formation — it applied passive only to the LAN side. That's the kind of nuance good prompting surfaces.

---

## Example 3: ACL for Guest Network Isolation

**Prompt:**
> Cisco IOS extended ACL. Guest VLAN 192.168.20.0/24 should access the internet but NOT reach the corporate LAN 192.168.10.0/24 or management network 192.168.99.0/24. Apply inbound on VLAN 20 SVI.

**AI output:**

```
ip access-list extended GUEST_RESTRICT
 deny   ip 192.168.20.0 0.0.0.255 192.168.10.0 0.0.0.255
 deny   ip 192.168.20.0 0.0.0.255 192.168.99.0 0.0.0.255
 permit ip 192.168.20.0 0.0.0.255 any

interface Vlan20
 ip access-group GUEST_RESTRICT in
```

Clean. No fuss.

---

## Validating AI-Generated Configs

**Never paste AI output directly into production.** That's the one rule. Here's the validation workflow:

**1. Read it line by line.**
Does each line make sense? AI occasionally hallucinates a command that doesn't exist or mismatches a syntax version. If something looks off, ask the AI to explain that specific line.

**2. Check the vendor/version.**
Ask AI: *"Is this syntax valid for IOS 15.2?"* or specify the version in your prompt upfront. Syntax differences between IOS 12.x and 15.x, or between IOS and IOS-XE, will cause issues.

**3. Test in a lab first.**
GNS3, EVE-NG, or even Packet Tracer. Paste the config into a virtual device and verify it behaves as expected before touching anything real.

**4. Use `show` commands to verify.**
After applying:
```
show vlan brief
show interfaces trunk
show ip ospf neighbor
show ip access-lists
```

---

## AI Tools That Work Well for Network Configs

| Tool | Strengths |
|---|---|
| ChatGPT (GPT-4o) | Broad vendor support, good at explaining output |
| GitHub Copilot | Great for Python/Netmiko automation scripts |
| Claude | Strong at structured configs, good at catching edge cases |
| Gemini | Solid for multi-step config walkthroughs |

All of them work. The difference is in how you prompt, not which tool you use.

---

## Prompt Templates to Save

Copy these and fill in your details:

**VLAN setup:**
> Generate [vendor] config for [device model]. Create VLANs [list with names]. Assign ports [range] to [VLAN]. Configure [port] as trunk allowing [VLANs]. Management IP [IP/mask] on VLAN [ID].

**Routing:**
> Configure [OSPF/BGP/EIGRP] on [vendor] router. Interfaces: [list with IPs]. Advertise [networks]. [Any specific requirements].

**ACL/Firewall rule:**
> Create an ACL on [vendor] device. Allow [source] to reach [destination] on [ports]. Deny [source] from reaching [destination]. Apply [inbound/outbound] on [interface].

**Troubleshooting a config:**
> Here is my current config: [paste config]. I'm seeing [problem]. What is wrong and how do I fix it?

---

AI won't replace your knowledge — it will multiply it. The admin who knows *what* they want but can get it configured in 10 seconds instead of 30 minutes is the one who ships faster and goes home on time.

Next up: [Automate Network Tasks with Python — Beginner Guide](#).
