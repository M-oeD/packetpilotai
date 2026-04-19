---
title: 'How to Diagnose Packet Loss Fast'
description: 'Packet loss kills voice calls, video, and file transfers — but the cause is rarely obvious. This step-by-step guide walks you from complaint to root cause using ping, traceroute, switch commands, and Wireshark.'
pubDate: '2026-04-18'
heroAscii: |
  $ ping 192.168.1.1 -n 100

  Packets: Sent=100  Received=83  Lost=17 (17% loss)

  SW01# show interfaces GigabitEthernet0/4
    Input errors:  3,847
    CRC:           3,201   ← bad cable or duplex mismatch
    Runts:           646

  [!] Root cause: CRC errors on Gi0/4
  [→] Replace cable on port 4. Recheck in 5 min.
---

Packet loss is sneaky. It doesn't always take down a connection — it just makes everything feel broken. Voice calls cut out. Video freezes. File transfers stall and retry. Users complain that "the network is acting weird."

The good news: packet loss always has a cause, and there's a repeatable process for finding it. This guide walks you through it step by step — from the first complaint to the fix.

---

## What Is Packet Loss?

Every piece of data traveling across a network is broken into packets. Packet loss is what happens when one or more of those packets never reach their destination.

At 0.1% loss, most users won't notice. At 1%, voice and video start degrading. At 5%+, applications become unusable. Even tiny amounts of loss on a local network are a red flag — LAN connections should be near 0%.

---

## Step 1: Confirm It's Actually Packet Loss

Start by confirming the symptom. Run an extended ping — 100 packets gives you a statistically meaningful result:

```powershell
# Windows
ping 8.8.8.8 -n 100

# Linux / Mac
ping 8.8.8.8 -c 100
```

At the end of the output, look for the **loss percentage**:

```
Packets: Sent = 100, Received = 94, Lost = 6 (6% loss)
```

Any loss to an internet destination could be in your network or beyond it. Any loss to your **default gateway** is almost certainly your problem — the local network should be lossless.

```powershell
# Replace with your actual gateway IP
ping 192.168.1.1 -n 100
```

If you're losing packets to your own gateway, stop here — the problem is local. Keep reading.

---

## Step 2: Use Traceroute to Find the Hop

Traceroute sends packets to every router between you and a destination, measuring the response at each hop. It tells you exactly where packets start dropping.

```powershell
# Windows
tracert 8.8.8.8

# Linux / Mac
traceroute 8.8.8.8
```

**What to look for:**

| What you see | What it means |
|---|---|
| `* * *` on every hop after a certain point | Loss starts at that hop |
| High RTT that appears suddenly at one hop | Congestion or a problem at that router |
| `* * *` only on one hop, then normal again | That device just doesn't respond to ICMP — usually not a real issue |
| Loss at hop 1 (your gateway) | Problem is between you and your first router |

If loss appears at **hop 1**, you don't need to go further — the problem is on your local segment. If it appears at **hop 3 or beyond**, it's likely the ISP.

---

## Step 3: Check the Physical Layer

Most LAN packet loss comes down to physical issues — bad cables, failing ports, or misconfigured duplex settings. SSH into the switch connected to the affected device and check the interface:

```
show interfaces GigabitEthernet0/1
```

Scan the output for these counters:

```
Input errors: 0
CRC: 0
Frame: 0
Runts: 0
Output drops: 0
```

**Non-zero values mean something is wrong.** Here's what each one points to:

| Counter | Likely cause |
|---|---|
| CRC errors | Bad cable, damaged SFP, or duplex mismatch |
| Runts | Duplex mismatch or collision |
| Input errors | Failing NIC or cable |
| Output drops | Port is congested or overwhelmed |

Also check speed and duplex — a mismatch here is one of the most common causes of packet loss:

```
show interfaces GigabitEthernet0/1 | include duplex|speed
```

You want to see `Full-duplex, 1000Mb/s`. If you see `Half-duplex` on either side, fix it:

```
interface GigabitEthernet0/1
 duplex full
 speed 1000
```

---

## Step 4: Test the Cable

A bad cable can cause intermittent loss that's hard to reproduce. Before spending more time troubleshooting:

1. **Swap the cable** — replace it with one you know is good
2. **Try a different switch port** — the port itself may be failing
3. **Check the patch panel** — loose punch-downs cause loss under load

If the loss disappears after a cable swap, you found it. Mark the bad cable and move on.

For wireless clients, packet loss is often caused by:
- Weak signal (client too far from AP)
- Channel interference (check neighboring APs on the same channel)
- High client density (too many devices on one AP)

Check signal strength with:

```powershell
# Windows — signal strength in dBm
netsh wlan show interfaces
```

Anything below -70 dBm will cause problems. Below -80 dBm and you'll see significant loss.

---

## Step 5: Check for Bandwidth Saturation

A saturated link drops packets when the queue overflows. Check utilization on the uplink:

```
show interfaces GigabitEthernet0/1 | include rate
```

Look at the `5 minute input rate` and `5 minute output rate`. If either is near the link's maximum capacity, you've found your problem — the link is dropping packets because it can't keep up.

**Fixes:**
- Identify what's consuming the bandwidth (`show ip cache flow` or a traffic analysis tool)
- Apply QoS to prioritize critical traffic (voice, video)
- Upgrade the link if it's consistently saturated

---

## Step 6: Verify with a Packet Capture

If the above steps haven't pinpointed the cause, a Wireshark capture will. Filter to the affected host and look for retransmissions — the clearest sign that packets are being lost and resent.

**Capture filter:**
```
host 192.168.1.50
```

**Display filters to run after capture:**

```
# TCP retransmissions — packets being resent because originals were lost
tcp.analysis.retransmission

# Duplicate ACKs — receiver is asking for a packet it didn't get
tcp.analysis.duplicate_ack

# Out-of-order packets — packets arriving in the wrong sequence
tcp.analysis.out_of_order
```

A healthy connection should show almost none of these. If you're seeing retransmissions consistently, the path between the two endpoints is dropping packets.

Use **Analyze → Expert Information** in Wireshark for a summary — it categorizes all anomalies automatically.

---

## Step 7: Is It the ISP?

If loss only appears beyond your network edge (hop 3+ in traceroute), run a few tests to confirm before calling your ISP:

```powershell
# Continuous ping to your ISP's gateway (first hop outside your router)
ping <isp-gateway-ip> -n 200

# Speed test from the command line (requires curl)
curl -s https://raw.githubusercontent.com/sivel/speedtest-cli/master/speedtest.py | python -
```

Also check for **line errors on your WAN interface**:

```
show interfaces [WAN-interface]
```

If you're seeing CRC errors on the WAN port, that's a physical layer issue between you and the ISP — their problem to fix, but you need the data to make the case.

---

## Root Cause Quick Reference

| Symptom | Most likely cause | Where to look |
|---|---|---|
| Loss to gateway | Bad cable, duplex mismatch, failing port | Physical layer, switch interface stats |
| Loss only on Wi-Fi | Weak signal, interference, AP overload | Signal strength, channel utilization |
| Loss starts at ISP hop | ISP congestion or line issue | WAN interface errors, ISP support ticket |
| Loss under load only | Bandwidth saturation | Interface utilization, traffic analysis |
| Intermittent, hard to reproduce | Failing cable or SFP | Cable swap, port swap |
| Loss on specific app only | QoS misconfiguration or application issue | QoS policy, app-level troubleshooting |

---

## The Workflow at a Glance

```
User reports packet loss / degraded connection
│
├─ Ping gateway 100x → loss to gateway?
│  └─ Yes → physical layer (cable, port, duplex)
│
├─ Traceroute → which hop drops first?
│  ├─ Hop 1 → local segment
│  └─ Hop 3+ → ISP
│
├─ show interfaces → CRC errors, duplex mismatch?
│  └─ Yes → cable swap, fix duplex
│
├─ Check bandwidth utilization → saturated?
│  └─ Yes → QoS or upgrade
│
└─ Wireshark → TCP retransmissions confirm loss path
```

Packet loss has a cause. Work the steps, and you'll find it.
