---
title: 'Troubleshoot Slow Network Performance Step-by-Step'
description: 'A systematic methodology for diagnosing slow networks — from end-user complaint to root cause. Covers ping, traceroute, packet capture, interface stats, and common fixes.'
pubDate: '2026-04-18'
heroImage: '../../assets/blog-placeholder-2.jpg'
---

"The network is slow." It's the vaguest complaint in IT, and it lands on your desk at least once a week. Without a methodology, you're guessing. With one, you find the cause in minutes.

This is the workflow I use every time. It's sequential on purpose — each step narrows the problem before you move to the next.

---

## Step 1: Define "Slow"

Before touching a single device, get specifics from whoever reported the issue:

- **What is slow?** A specific app, a website, file transfers, everything?
- **Where are they?** On-site, remote, specific VLAN or building?
- **When did it start?** Constant, or only at certain times?
- **How many people are affected?** Just them, their team, everyone?

One user with slow Teams calls is a different problem than an entire floor with slow everything. The answers tell you where to start looking.

---

## Step 2: Isolate the Scope

Run a quick ping test from the affected machine to progressively further destinations:

```
ping 127.0.0.1          # localhost — rules out the NIC driver
ping 192.168.1.1        # default gateway — tests local LAN
ping 8.8.8.8            # internet IP — tests WAN/routing
ping google.com         # DNS + internet — tests name resolution
```

**Interpreting results:**

| What fails | Where the problem is |
|---|---|
| All fail | NIC, driver, or IP config |
| Gateway fails, localhost ok | LAN segment or switch |
| Internet IP fails, gateway ok | Router, WAN, or ISP |
| Domain fails, IP ok | DNS |
| All pass but "still slow" | Latency or throughput — go to Step 3 |

---

## Step 3: Measure Latency and Packet Loss

Pings that reply aren't always healthy. Add `-n 50` (Windows) or `-c 50` (Linux) to run 50 pings and look for:

- **Packet loss** — any loss to the gateway is a red flag
- **High average RTT** — >5ms on a LAN is worth investigating
- **Jitter** — wide variance between min and max RTT

```powershell
# Windows — 50 pings to gateway
ping 192.168.1.1 -n 50

# Linux/Mac
ping 192.168.1.1 -c 50
```

If you see packet loss to the **gateway**, the problem is almost certainly between the host and the first switch — bad cable, duplex mismatch, or a flapping port.

If latency is high only to **internet destinations**, the issue is at or beyond the router.

---

## Step 4: Run Traceroute to Find the Hop

Traceroute shows where latency spikes or where packets stop:

```powershell
# Windows
tracert 8.8.8.8

# Linux/Mac
traceroute 8.8.8.8
```

**What to look for:**
- A hop where RTT jumps significantly (e.g., 2ms → 180ms) — that's the problem segment
- `* * *` — can mean the device doesn't respond to ICMP (not always a problem) or packets are being dropped there
- RTT that stays high from a certain hop onwards — problem is at or before that hop

If latency spikes at **hop 1** (your gateway), start there. If it spikes at **hop 3** (ISP), call your ISP.

---

## Step 5: Check Interface Statistics on the Switch/Router

High error counts on a port are the most common cause of LAN slowness and packet loss. SSH into the switch and check:

```
show interfaces GigabitEthernet0/1
```

Look for these counters in the output:

```
Input errors: 0
CRC: 0
Frame: 0
Runts: 0
Giants: 0
Output errors: 0
Collisions: 0
```

**Any non-zero value here is a problem.** Common culprits:

| Counter | Likely cause |
|---|---|
| CRC errors | Bad cable, damaged SFP, or duplex mismatch |
| Runts | Duplex mismatch or collision domain |
| Input errors | Bad NIC, cable, or patch panel |
| Collisions | Half-duplex device connected to full-duplex port |
| Output queue drops | Bandwidth saturation |

Also check speed and duplex:
```
show interfaces GigabitEthernet0/1 | include duplex|speed
```

You want `Full-duplex, 1000Mb/s` or similar. If you see `Half-duplex` or a mismatch between the switch and the device, fix it:

```
interface GigabitEthernet0/1
 duplex full
 speed 1000
```

---

## Step 6: Check Bandwidth Utilization

A saturated link looks like slowness to the user but has nothing wrong with the physical layer. Check interface utilization:

```
show interfaces GigabitEthernet0/1 | include rate
```

Or use `show interfaces` and look at the `5 minute input/output rate` lines. If a link is consistently above 80% utilization, it needs upgrading or traffic shaping.

On a router, check WAN utilization the same way. If the WAN link is maxed, prioritize traffic with QoS or talk to your ISP about upgrading bandwidth.

---

## Step 7: Packet Capture (When You Still Can't Find It)

If the previous steps don't reveal the cause, capture traffic and look at what's actually happening. Wireshark is your best tool here.

Run a capture filtered to the affected host:

**Capture filter:**
```
host 192.168.1.50
```

**What to look for in the capture:**

- **TCP retransmissions** — packets being resent means something upstream is dropping them
- **TCP Zero Window** — the receiver is overwhelmed and telling the sender to stop
- **High TCP RTT** — visible in the `tcp.analysis.ack_rtt` field; filter with `tcp.analysis.ack_rtt > 0.1` for anything over 100ms
- **DNS failures or timeouts** — if name resolution is failing, apps will appear slow

The **Expert Information** panel in Wireshark (Analyze → Expert Information) will flag most of these automatically.

---

## Step 8: Common Fixes by Root Cause

| Root cause | Fix |
|---|---|
| Duplex mismatch | Force speed/duplex on switch port and NIC |
| Bad cable | Replace cable or SFP |
| DNS slowness | Change DNS to 8.8.8.8 / 1.1.1.1 temporarily to test; fix DNS server if confirmed |
| Bandwidth saturation | QoS, traffic shaping, or upgrade the link |
| Congested Wi-Fi channel | Change AP channel, check channel utilization |
| Faulty switch port | Move device to another port, disable bad port |
| ISP issue | Run a speed test to confirm, open a ticket |

---

## The One-Page Cheat Sheet

```
User reports slow network
│
├─ Ping localhost → gateway → 8.8.8.8 → google.com
│  └─ Fails? → Narrow to that segment
│
├─ Ping with 50 packets → check loss and jitter
│  └─ Loss to gateway? → cable / switch port / duplex
│
├─ Traceroute → find the hop where latency spikes
│
├─ show interfaces → check error counters and duplex
│  └─ Errors? → cable, SFP, duplex mismatch
│
├─ Check interface utilization → saturation?
│  └─ > 80%? → QoS or upgrade
│
└─ Packet capture → TCP retransmits, zero window, DNS
```

Slow networks have causes. Follow the steps, and you'll find it — every time.
