---
title: '5 Free Network Troubleshooting Tools Every Admin Should Have in 2026'
description: 'Paid tools are great. Free tools solve 80% of real problems and run on every machine you already own. Here are five free network troubleshooting tools every admin should be able to drive cold — what each one does, when to reach for it, and the one limitation that bites you.'
pubDate: '2026-04-24'
heroAscii: |
  ┌─ THE FREE TOOL BELT ──────────────────────────────────┐
  │                                                       │
  │  [1]  Wireshark   →  see every packet on the wire     │
  │  [2]  Nmap        →  who is on my network, on what    │
  │  [3]  iperf3      →  is this link actually fast?      │
  │  [4]  LibreNMS    →  what is happening over time      │
  │  [5]  MTR         →  where exactly does the path die  │
  │                                                       │
  │  [!] All five are free. All five are production-ready │
  │  [→] Learn one a week and you have a toolkit in 5     │
  └───────────────────────────────────────────────────────┘
---

The networking software market wants you to believe that real visibility costs five figures a year. It doesn't. The five tools below are free, mature, used by every serious operator on the planet, and together they handle the overwhelming majority of real troubleshooting situations.

Paid tools earn their seat in three places: dashboards your CIO wants, automated alerting at scale, and DPI-class application visibility. Outside of those, free tools win — and learning them deeply pays back forever, because they don't disappear when the contract lapses.

Here's the toolkit, in the order you'll likely reach for them.

---

## 1. Wireshark — See What's Actually on the Wire

**What it is:** A packet capture and analysis tool. Decodes thousands of protocols, gives you per-packet detail, and reveals what's actually happening between two endpoints.

**When to reach for it:**
- An app says "connection failed" and you need to know why
- TCP retransmissions, zero-window events, RST floods
- TLS handshake failures (cipher mismatch, bad cert chain)
- DNS or DHCP weirdness you can't explain from logs alone
- Anything where the answer is "what is this device sending and receiving?"

**Quick win — find the slow client:**

```
# Display filter: show TCP connections with high RTT
tcp.analysis.ack_rtt > 0.1

# Display filter: show all retransmissions
tcp.analysis.retransmission

# Display filter: TLS SNI — what hostnames is this client hitting?
tls.handshake.extensions_server_name
```

The **Analyze → Expert Information** panel summarizes every anomaly in a capture in one screen. If you only learn one Wireshark feature, learn that one.

**Where it bites you:** You need a span port, a TAP, or local capture access. You can't capture what you can't see. Plan your capture point before you start.

**Get it:** [wireshark.org](https://www.wireshark.org/) — Windows, Mac, Linux. Pair with `tshark` for command-line capture and scripting.

---

## 2. Nmap — Know Who's On Your Network

**What it is:** A network scanner. Discovers hosts, identifies open ports, fingerprints operating systems, and probes services with depth that rivals commercial scanners.

**When to reach for it:**
- "What's actually on this VLAN?" — the answer your IPAM doesn't have
- Verifying a firewall change actually blocks what it should
- Confirming a service is listening (and on the port you think)
- Finding rogue devices and shadow IT
- Pre-audit inventory in 90 seconds

**Three commands worth memorizing:**

```bash
# Fast ping sweep of a subnet — who's alive?
nmap -sn 192.168.1.0/24

# Service version detection on a target
nmap -sV -p- 192.168.1.50

# Default scripts + version detection (lightweight audit)
nmap -sC -sV 192.168.1.50
```

The output of `nmap -sV` is the fastest answer to "what is that mystery host on port 8080?" you'll find anywhere.

**Where it bites you:** Run it without permission and you'll trip every IDS in the building. Always coordinate, especially in production. Aggressive scans (`-T5`, `--max-rate`) can knock over fragile embedded gear like printers and IP cameras.

**Get it:** [nmap.org](https://nmap.org/) — included by default in Kali, available everywhere else. Zenmap (the GUI) is fine for occasional use; the CLI is faster once you know it.

---

## 3. iperf3 — The Real Throughput Number

**What it is:** A throughput tester. One side runs in server mode, the other side hits it; you get the actual end-to-end throughput between two specific points on your network.

**When to reach for it:**
- "The internet is slow" — confirm or rule out the link itself
- Validating a new circuit before signing off
- Comparing path A vs path B (failover testing)
- Proving the LAN side is fine and the WAN is the bottleneck
- Sanity-checking a vendor's bandwidth claim

**The five-second workflow:**

```bash
# On the receiver
iperf3 -s

# On the sender
iperf3 -c <receiver-ip>           # default 10s test, TCP

# UDP test (for VoIP / real-time path)
iperf3 -c <receiver-ip> -u -b 100M

# Reverse — useful when ISP throttling is asymmetric
iperf3 -c <receiver-ip> -R
```

Run it client-to-server inside the LAN first, then client-to-WAN-edge, then client-to-internet. The point where the number falls off a cliff is the bottleneck.

**Where it bites you:** iperf3 measures raw throughput between two iperf endpoints. It does *not* tell you what your real applications experience — TCP behavior over a saturated link, or jitter that ruins voice but doesn't show up in megabits per second. Pair it with Wireshark for the full picture.

**Get it:** [iperf.fr](https://iperf.fr/) — Windows, Mac, Linux, BSD. There's a public iperf server list if you don't have a remote endpoint to test against.

---

## 4. LibreNMS — History, So You Can Actually Troubleshoot

**What it is:** An open-source network monitoring system. Polls SNMP, graphs everything, alerts on thresholds, and gives you the history every after-the-fact troubleshooting session needs.

**When to reach for it:**
- "It was slow yesterday at 3 PM" — without history you have nothing
- Capacity planning ("are we going to run out of WAN bandwidth?")
- Root-cause for an interface that flaps once a week
- Baseline comparison: is *this* CPU spike normal for *this* device?
- Inventory you can actually trust

**The one-time setup pays back forever.** Once it's polling your gear, you stop guessing about historical state. Walked into a "the network was slow last night" ticket? Open the graph, see the spike, find the offender. Without monitoring, that ticket is unanswerable.

```yaml
# Minimum viable monitoring scope:
- Every WAN/uplink interface (utilization + errors + drops)
- CPU and memory on every router and core switch
- Power and fan status on chassis gear
- Temperature on every closet (humidity too if you have it)
- Ping/uptime to every gateway
```

**Where it bites you:** It's not magic — you have to set the thresholds. Default alerting is noisy until you tune it. Plan a half-day to get alerts useful.

**Alternatives at the same price (zero):** Zabbix (more powerful, steeper learning curve), PRTG Free (limited to 100 sensors but excellent UI), Observium Community (older codebase but stable).

**Get it:** [librenms.org](https://www.librenms.org/) — Docker image is the fastest path; runs happily on a 2-vCPU VM for a small environment.

---

## 5. MTR — Traceroute With a Memory

**What it is:** A path-analysis tool. It's traceroute and ping combined, running continuously, showing per-hop latency and packet loss in real time.

**When to reach for it:**
- "Latency to this site is bad sometimes" — find the hop that flutters
- ISP troubleshooting when you need data, not feelings
- Verifying a path change after BGP failover or a route flap
- Detecting asymmetric packet loss that regular ping misses

**The first command you'll run:**

```bash
# Linux / Mac
mtr -r -c 100 8.8.8.8

# Output: each hop, with loss%, average RTT, jitter
```

```
HOST: laptop                     Loss%  Snt  Avg  Best  Wrst StDev
  1.|-- 192.168.1.1              0.0%   100   1.2   0.9   2.1   0.2
  2.|-- 10.0.0.1                 0.0%   100   3.4   2.8   5.1   0.4
  3.|-- 203.0.113.1             14.0%   100  78.2  45.1 198.4  31.8  ← problem
  4.|-- 8.8.8.8                  0.0%   100  12.4  11.9  14.8   0.5
```

The hop at line 3 is where loss starts. Now you have a specific datum to send your ISP.

**Where it bites you:** Some routers de-prioritize ICMP, so you'll see "loss" at intermediate hops that aren't actually losing user traffic. Always check the *destination* hop's loss number to know if real traffic is impacted.

**Get it:** [bitwizard.nl/mtr](https://www.bitwizard.nl/mtr/) (or any package manager). On Windows, **WinMTR** is a perfectly good GUI fork.

---

## Side-by-Side Comparison

| Tool | Use case | Skill curve | OS coverage | Where it shines |
|---|---|---|---|---|
| Wireshark | Packet-level forensics | Medium-high | Win / Mac / Linux | "What is actually on the wire?" |
| Nmap | Discovery and audit | Low-medium | Win / Mac / Linux | "What's out there and what's open?" |
| iperf3 | Throughput truth | Low | Win / Mac / Linux / BSD | "Is the link really slow, or is the app slow?" |
| LibreNMS | Long-term history + alerts | Medium (setup) / Low (use) | Linux server | "What did the network look like at 3 PM yesterday?" |
| MTR | Per-hop path analysis | Low | Linux / Mac / Win (WinMTR) | "Where exactly does the path get bad?" |

---

## Build Your Free Toolkit

Here are the install one-liners. Put these on your jump box and forget about them:

```bash
# Debian / Ubuntu
sudo apt install -y wireshark tshark nmap iperf3 mtr-tiny

# Fedora / RHEL
sudo dnf install -y wireshark nmap iperf3 mtr

# Mac (Homebrew)
brew install wireshark nmap iperf3 mtr

# Windows (winget)
winget install WiresharkFoundation.Wireshark
winget install Insecure.Nmap
winget install Iperf-3.iperf3
winget install WinMTR.WinMTR
```

LibreNMS deserves its own VM — don't try to bolt it onto a workstation. The official Docker compose is the fastest start.

---

Free tools have one trait the paid ones don't: they're still here next year, regardless of vendor pricing changes, regardless of contract status. Learning them deeply is one of the highest-leverage things a network admin can do — and the five above are where to start.
