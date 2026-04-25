---
title: "How to Find What's Saturating Your WAN"
description: 'A saturated WAN feels like the entire network is broken — but the cause is usually one app, one host, or one runaway backup. This step-by-step guide takes you from "everything is slow" to the exact source using interface stats, NetFlow, DPI, and Wireshark.'
pubDate: '2026-04-24'
heroAscii: |
  $ show interfaces GigabitEthernet0/0 | include rate

    5 minute input rate  942,184,000 bits/sec
    5 minute output rate  47,221,000 bits/sec

  $ show ip cache flow | top 5

  SrcAddr           DstAddr           Pkts    Bytes   App
  10.10.42.31  →   151.101.65.69    1.2M    8.4 GB   HTTPS
  10.10.42.31  →   13.107.42.14     820K    5.1 GB   HTTPS
  10.10.40.15  →   140.82.121.4      94K    540 MB   HTTPS

  [!] One host pushing 13 GB inbound on a 1 Gbps link.
  [→] Find the host. Find the app. Then decide what to do.
---

A saturated WAN doesn't announce itself politely. It shows up as "the internet is slow," "Teams is choppy," "VPN keeps dropping," and a flood of tickets that all sound different but have the same root cause: one fat link, fully booked.

The fix isn't always obvious — and it almost never is "buy more bandwidth" until you know what's eating the bandwidth you have. This guide walks the steps that take you from "users are complaining" to "this host, this app, here's what we're doing about it."

---

## What "Saturated" Actually Means

A WAN link is saturated when the offered traffic exceeds what the link can carry. When that happens, the device's egress queue fills, and once the queue overflows, packets get dropped. TCP retransmits, latency spikes, real-time apps stutter.

A few useful numbers to keep in mind:

- **A link sitting consistently above 80% utilization** is functionally saturated — the bursts that exceed 100% are causing drops even though the average looks fine
- **Egress is what matters most** — a 1 Gbps link with 950 Mbps outbound and 50 Mbps inbound is a problem
- **Asymmetric links** (like a 1 Gbps down / 100 Mbps up cable circuit) saturate the small side first, often invisibly

---

## Step 1: Confirm the Link Is Actually Saturated

Before chasing top talkers, prove the link is full. Pull live interface utilization:

```
# Cisco IOS / IOS-XE
show interfaces GigabitEthernet0/0 | include rate

# Look for these lines:
  5 minute input rate  942000000 bits/sec, 78000 packets/sec
  5 minute output rate  47000000 bits/sec, 31000 packets/sec
```

Convert to a percentage: `942 Mbps / 1000 Mbps = 94%`. That's saturated.

For a quick sanity check, also pull queue drops:

```
show interfaces GigabitEthernet0/0 | include drops|queue
```

```
Output queue: 0/40 (size/max)
Total output drops: 184,592
```

**Output drops > 0 means packets are being dropped because the link can't keep up.** That's the smoking gun.

If utilization is low but drops are high, you don't have a saturation problem — you have a microburst or QoS misconfiguration problem. Different troubleshooting path.

---

## Step 2: Find the Top Talkers with NetFlow or sFlow

Once you know the link is saturated, the next question is "by what?" NetFlow (Cisco) and sFlow (Juniper, Arista, HP) give you per-flow visibility — source, destination, port, byte count.

If you already have a flow collector (PRTG, ntopng, Plixer, SolarWinds), open it, filter to the WAN interface, and sort by bytes descending. The top 5 flows are your suspects.

If you don't, you can still get useful data straight from the device:

```
# Cisco IOS — view active flows on a router with NetFlow enabled
show ip cache flow

# Top talkers (newer IOS / IOS-XE)
show flow monitor [name] cache aggregate ipv4 source address top 10
```

```
SrcIf      SrcIPaddress    DstIf      DstIPaddress    Pr   Bytes
Gi0/1      10.10.42.31     Gi0/0      151.101.65.69   06   8.4G
Gi0/1      10.10.42.31     Gi0/0      13.107.42.14    06   5.1G
Gi0/1      10.10.40.15     Gi0/0      140.82.121.4    06   540M
```

If your routers don't speak NetFlow/sFlow, a free port-mirrored capture into ntopng will give you the same picture in 10 minutes.

**What you're looking for:**

| Pattern in the flow data | Likely cause |
|---|---|
| One source IP responsible for >50% of traffic | A user, server, or runaway process |
| Many sources, one destination | Inbound CDN burst, video stream, or update storm |
| Many sources, many destinations, all on port 443 | Generic "the internet is busy" — probably normal traffic at peak |
| Heavy traffic to a cloud storage IP range | Backup or sync job |
| Traffic on unusual ports | Exfiltration, P2P, or misconfigured app |

---

## Step 3: Identify the Application

A top-talker IP gives you "host 10.10.42.31 is the problem" — but you still need to know what `10.10.42.31` is *doing*. Most modern WAN traffic is HTTPS, so just looking at port 443 doesn't tell you which app.

A few ways to identify the application without DPI gear:

```bash
# Reverse DNS the destination
dig -x 151.101.65.69
# → fastly CDN — probably software updates or web app

# Whois the IP
whois 13.107.42.14
# → Microsoft — Teams, OneDrive, Exchange Online

# Check certificate SNI in a packet capture (works for HTTPS)
tshark -i <iface> -Y "tls.handshake.extensions_server_name" \
       -T fields -e ip.src -e tls.handshake.extensions_server_name
```

If you have a real DPI-capable firewall (Palo Alto, Fortinet, Meraki), you already have an Application Visibility view — go look there. Filter to the offending source IP and you'll see the app name directly.

For BYOD or unmanaged endpoints, sometimes the only way to know what's running is to walk over and look. Cloud backup clients, OS update services, video conferencing apps, and game updaters are the four most common silent saturators.

---

## Step 4: Wireshark on the WAN Port (When Flow Data Isn't Enough)

If NetFlow points at a host but you still don't know what it's running, mirror the WAN port to a span port and capture for a few minutes.

**Capture filter:**

```
host 10.10.42.31
```

**Display filters worth knowing:**

```
# What domains is this host hitting? (TLS SNI)
tls.handshake.extensions_server_name

# DNS queries — shows you what the host is looking up before it connects
dns.qry.name

# HTTP user-agent (rare on WAN now, but useful when present)
http.user_agent
```

Within a couple of minutes you'll have a list of the destinations and SNI hostnames the host is talking to. That tells you the app.

---

## Step 5: Look for Time-of-Day Patterns

Some saturation is constant. Some is scheduled and invisible until you look for it. Pull the interface utilization graph over a 24-hour and 7-day window:

- **Daily spike at 2 AM** — almost always a backup job
- **Spike at 8–9 AM** — users arriving, mail/Teams sync flood, OS update check
- **Spike Mondays at 10 AM** — Patch Tuesday update rollout
- **Spike Fridays at 5 PM** — large weekly export, file dump, or video sync
- **Constant high baseline** — a service is misconfigured to run continuously

If you can correlate the user-reported "slow" times with a graph spike, you've found the window. Then a flow query *during* that window points at the source.

If your monitoring doesn't graph history yet, that's the gap to fix first — you can't troubleshoot saturation without history. LibreNMS, PRTG, or Cloudflare's free analytics will all do this.

---

## Step 6: Fix It

Once you know **who, what, and when**, the fix usually falls into one of four buckets:

### A. Reschedule or rate-limit the offender

Backups, replication jobs, large pushes — move them to off-peak windows or cap their bandwidth at the source. This is the cheapest, fastest fix and works for ~60% of saturation cases.

### B. Apply QoS to protect the important traffic

If the saturator is legitimate but you need to keep voice and Teams smooth:

```
# Cisco IOS QoS — basic example, prioritize voice and limit bulk
class-map match-any VOICE
 match dscp ef
class-map match-any BULK
 match access-group name BULK_TRAFFIC

policy-map WAN-OUT
 class VOICE
  priority percent 30
 class BULK
  bandwidth percent 20
 class class-default
  fair-queue

interface GigabitEthernet0/0
 service-policy output WAN-OUT
```

QoS doesn't add bandwidth — it decides who suffers when there isn't enough.

### C. Cache or offload

For Microsoft 365, Windows updates, or any large repeated download: a local caching server (BranchCache, Connected Cache, WSUS, Squid) can eliminate the duplication.

### D. Upgrade the link — but only when justified

Upgrade if all of these are true:

- Saturation is sustained, not bursty
- You've eliminated rogue / misconfigured sources
- QoS isn't enough to protect critical apps
- The cost of slow users exceeds the recurring cost of more bandwidth

If you can't show a graph that justifies the upgrade, your boss won't approve it — and rightly so.

---

## Root Cause Quick Reference

| Pattern | Most likely cause | Fix path |
|---|---|---|
| One host >50% of traffic | Backup, sync, or rogue process | Find process, reschedule or rate-limit |
| Spike at 2 AM | Off-hours backup job | Reschedule or shape |
| Spike at 8–9 AM | Mass update / sync at login | Stagger updates, cache locally |
| Outbound saturated, inbound idle | Upload-heavy job (cloud sync, file dump) | Source rate-limit |
| Inbound saturated, outbound idle | Downloads, streaming, CDN burst | Identify source, cache if repeated |
| Heavy traffic to one cloud IP range | M365, AWS, OneDrive sync | App-aware QoS or caching |
| Many small flows, all 443, low per-flow | Genuine user demand at peak | QoS + plan capacity |
| Output drops with low utilization | Microburst | Per-class queue tuning |

---

## The Workflow at a Glance

```
User reports "WAN is slow / VPN choppy / Teams cutting out"
│
├─ show interfaces rate → above 80% sustained?
│  └─ Yes → saturation confirmed
│
├─ show interfaces drops → output drops increasing?
│  └─ Yes → packets being dropped, real impact
│
├─ NetFlow / sFlow → top 5 flows on the WAN
│  └─ Pin the source(s)
│
├─ Reverse DNS / whois / SNI capture → which app
│  └─ Now you know who and what
│
├─ Graph over 24h / 7d → when does it happen?
│  └─ Now you know when
│
└─ Fix: reschedule, rate-limit, QoS, cache, or upgrade
```

Saturation isn't mysterious. It's one of: a host, an app, a schedule, or a capacity gap — and a flow report plus a 24-hour graph almost always tells you which.
