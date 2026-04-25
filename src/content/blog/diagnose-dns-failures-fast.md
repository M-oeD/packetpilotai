---
title: 'How to Diagnose DNS Failures Fast'
description: 'When DNS breaks, everything looks broken — but the real cause is rarely obvious. This step-by-step guide takes you from "the internet is down" to root cause using nslookup, dig, and a handful of resolver checks.'
pubDate: '2026-04-24'
heroAscii: |
  $ nslookup app.example.com

  Server:   192.168.1.10
  Address:  192.168.1.10#53

  ** server can't find app.example.com: SERVFAIL

  $ nslookup app.example.com 8.8.8.8

  Non-authoritative answer:
  Name:     app.example.com
  Address:  203.0.113.42

  [!] Internal resolver fails. Public resolver works.
  [→] The record is fine. Your DNS server isn't.
---

DNS failures are sneaky. The user doesn't say "DNS is broken" — they say "the website is down," "Outlook can't connect," "VPN won't authenticate." Every one of those can be DNS, and DNS is almost always the last thing anyone checks.

The good news: DNS failures leave fingerprints. There's a repeatable workflow that takes you from a vague complaint to the exact resolver, record, or firewall rule that's wrong. This guide walks you through it.

---

## What DNS Resolution Actually Does

Every time something on your network connects to a name — `office.com`, `update.windows.com`, an internal app — it makes a sequence of DNS lookups:

1. Check the local cache (yes/no answer in microseconds)
2. Ask the configured resolver (your domain controller, your firewall, or a public resolver)
3. The resolver walks the chain: root → TLD → authoritative nameserver
4. Answer comes back, gets cached for the TTL

Any one of those four steps can fail. The trick is knowing which.

---

## Step 1: Confirm It's Actually DNS

Before chasing resolvers, prove the symptom is name resolution. Ping the destination by name and by IP:

```powershell
# Ping by name
ping app.example.com

# Ping by IP (use one you know works, like the gateway or a known internal host)
ping 192.168.1.1
```

**Interpreting results:**

| What you see | What it means |
|---|---|
| Name fails, IP works | DNS — your problem |
| Name works, IP works | Not DNS — look elsewhere |
| Both fail | Not DNS — connectivity issue, go troubleshoot that first |
| Name resolves but app still broken | DNS resolved, but maybe to the wrong record — keep reading |

If `ping <name>` returns "could not find host" or "request timed out" but the IP responds, you've confirmed DNS. Move on.

---

## Step 2: Check the Client's Resolver Config

The client may be asking the wrong server. Check what resolvers it's using:

```powershell
# Windows
ipconfig /all | findstr "DNS Servers"

# Linux / Mac
cat /etc/resolv.conf

# Or, on systemd-resolved systems:
resolvectl status
```

You're looking for two things:

- **Which servers are listed** — the order matters; the first is tried first
- **Are they reachable?** Ping each:

```powershell
ping 192.168.1.10
```

A common failure mode: the client has a stale DHCP lease pointing at a DNS server that no longer exists, or a manual override set during a long-ago troubleshooting session. If a listed resolver doesn't ping, that's already the problem.

Also flush the local cache before going further — stale negative caches will lie to you:

```powershell
# Windows
ipconfig /flushdns

# Linux (systemd-resolved)
sudo resolvectl flush-caches

# Mac
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

---

## Step 3: Test Against an Alternate Resolver

This is the fastest way to isolate "is it the record or is it my DNS server?"

```powershell
# Ask Google's resolver directly
nslookup app.example.com 8.8.8.8

# Ask Cloudflare's resolver
nslookup app.example.com 1.1.1.1
```

**What the answers tell you:**

| Result | Meaning |
|---|---|
| Public resolvers answer, internal doesn't | Your internal DNS server is broken or filtering |
| Both return the same wrong IP | The record itself is wrong (authoritative side) |
| Both return SERVFAIL | The authoritative nameservers are down |
| Internal answers, public doesn't | Internal-only record (expected behavior) |
| Public answers, internal returns NXDOMAIN | Internal resolver has a bad zone or stale forwarder config |

If public works and internal doesn't, you've narrowed it to your resolver. Move to Step 4.

---

## Step 4: Use `dig +trace` to Find the Failing Step

`dig` shows you the full resolution chain. `+trace` makes it walk the tree manually — root, TLD, authoritative — so you see exactly which step fails.

```bash
dig +trace app.example.com
```

`dig` ships with most Linux distros and Mac. On Windows, install BIND tools or use `Resolve-DnsName`:

```powershell
Resolve-DnsName app.example.com -DnsOnly
Resolve-DnsName app.example.com -Server 8.8.8.8
```

**What `+trace` output reveals:**

- Each level (`.`, `com.`, `example.com.`) returns the nameservers for the next level
- A timeout or REFUSED at any level pinpoints the broken layer
- If the chain succeeds but the final A record is wrong, the authoritative server has a stale or incorrect record

If you see `connection timed out; no servers could be reached` partway through, that's a network/firewall issue between you and that nameserver — not a DNS configuration problem.

---

## Step 5: Check the Firewall — Port 53 and Port 853

DNS traffic uses **UDP/53** for normal queries, **TCP/53** for large responses (and zone transfers), and **TCP/853** for DNS-over-TLS (DoT). A firewall blocking any of these breaks resolution in ways that aren't always obvious.

Test port reachability from the client:

```powershell
# Windows — test UDP/53 to your resolver
Test-NetConnection -ComputerName 192.168.1.10 -Port 53

# Linux — TCP/53 test
nc -zv 192.168.1.10 53

# DNS-over-TLS check (used by Android, modern resolvers)
nc -zv 1.1.1.1 853
```

**Common firewall failures:**

| Symptom | Likely cause |
|---|---|
| Most names resolve, big ones (DNSSEC) fail | TCP/53 blocked outbound (large responses fall back to TCP) |
| Some clients work, some don't | Per-VLAN or per-host ACL blocking 53 |
| Resolution works on Wi-Fi but not VPN | Split-tunnel or DNS leak protection routing queries oddly |
| Mobile devices fail, desktops work | Android/iOS DoT (port 853) blocked |

If your firewall logs show drops to UDP/53 from the affected client, the answer is in front of you.

---

## Step 6: Authoritative Side — TTL, Stale Records, and Propagation

If the record itself is wrong, no amount of resolver troubleshooting fixes it. Query the authoritative nameservers directly:

```bash
# Find the authoritative nameservers for the zone
dig NS example.com

# Query each one directly
dig @ns1.example.com app.example.com
```

**What to check:**

- Does each authoritative nameserver return the same answer? Inconsistency points to a failed zone replication.
- Is the TTL very long? A record with TTL 86400 means a stale answer survives in caches for a full day after you fix it.
- Was the record recently changed? If yes, intermediate caches (your ISP's resolver, Cloudflare's resolver, `8.8.8.8`) may still hold the old value until the TTL expires.

For zones you control: cut the TTL down (300 seconds is a common pre-change value) at least 24 hours before any planned record change. For zones you don't control: wait, or query an authoritative server directly to bypass cache.

To see what's currently cached at a public resolver:

```bash
dig app.example.com @8.8.8.8 +noall +answer
```

The TTL in the answer line shows how much time is left on the cached record.

---

## Root Cause Quick Reference

| Symptom | Most likely cause | Where to look |
|---|---|---|
| Name fails, IP works | Resolver config or resolver itself | `ipconfig /all`, ping the resolvers |
| Public works, internal doesn't | Internal DNS server / forwarder | DNS server logs, forwarder config |
| One zone broken, others fine | Zone replication or stale forwarder | Authoritative servers, conditional forwarders |
| Works on some clients, fails on others | Firewall ACL or DHCP option mismatch | Firewall logs, DHCP scope DNS option |
| Worked yesterday, fails today | TTL expired with bad upstream record | Query authoritative directly |
| Random intermittent failures | UDP fragmentation or rate limiting | Try TCP/53, check ISP rate-limit policy |
| App works locally, fails on VPN | DNS leak / split-horizon mismatch | VPN client DNS settings |

---

## The Workflow at a Glance

```
User reports "site/app/service is down"
│
├─ ping <name> vs ping <IP> → name fails, IP works?
│  └─ Yes → confirmed DNS, continue
│
├─ ipconfig /all → are the configured resolvers reachable?
│  └─ No → fix resolver config or DHCP
│
├─ nslookup <name> 8.8.8.8 → does a public resolver answer?
│  ├─ Yes → your internal resolver is the problem
│  └─ No → record itself is broken (go to authoritative)
│
├─ dig +trace → which level fails?
│  └─ Pinpoint the broken layer
│
├─ Test port 53 (UDP and TCP) → firewall blocking?
│  └─ Yes → firewall rule
│
└─ Query authoritative nameservers directly → record correct?
   └─ No → zone file or replication problem
```

DNS has fingerprints. Follow them, and you'll have your answer before the user finishes typing the ticket.
