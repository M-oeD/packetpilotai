---
title: "I built a 'WAN just dropped 5 minutes before the board meeting' panic button"
description: 'One click. It SSHes your router, grabs live stats, runs traceroutes, and hands everything to Claude. You get a root cause and an exec-ready update in 90 seconds. I hope I never need it.'
pubDate: '2026-05-30'
heroAscii: |
  ╔══════════════════════════════╗
  ║   [!] WAN DOWN  T+0:00      ║
  ║   ┌──────────────────────┐  ║
  ║   │  ░░  PANIC.SH  ░░░░  │  ║
  ║   │  ████████████████ 🔴 │  ║
  ║   └──────────────────────┘  ║
  ╚══════════════════════════════╝
  → one click. root cause in 90s.
---

network outages are getting out of hand so I built a **[WAN DOWN]** panic button 🚨

one click, and it SSHes your router and grabs live interface stats, runs traceroutes to three external targets, pings your gateway 50 times for loss percentage, and hands all of it to Claude with your full network context pre-loaded 🙂

I hope I never need it. It's ready. 👍

---

Here's the script. Save it, fill in your four variables at the top, bind it to a key, and forget it exists until the moment you need it most.

```bash
#!/usr/bin/env bash
# panic.sh — WAN triage in one keystroke
# Bind to a Stream Deck key, keyboard shortcut, or alias

ROUTER_IP="192.168.1.1"          # your router/firewall IP
ROUTER_USER="admin"              # SSH username
WAN_IFACE="GigabitEthernet0/0"  # WAN interface name (Cisco) or "wan" (pfSense)
GATEWAY_IP="192.168.1.1"        # first hop to ping

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  [PANIC] WAN triage — $(date '+%Y-%m-%d %H:%M:%S')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: Ping the gateway for loss
echo ""
echo "[1/4] pinging gateway ($GATEWAY_IP) × 50..."
PING=$(ping -c 50 -q "$GATEWAY_IP" 2>&1)
echo "$PING" | tail -3

# Step 2: Traceroute to three external targets
echo ""
echo "[2/4] tracerouting to 8.8.8.8, 1.1.1.1, 208.67.222.222..."
TR1=$(traceroute -n -w 2 -q 1 -m 15 8.8.8.8 2>&1)
TR2=$(traceroute -n -w 2 -q 1 -m 5  1.1.1.1 2>&1)

# Step 3: Pull live stats from router via SSH
echo ""
echo "[3/4] SSHing router ($ROUTER_IP) for interface stats..."
ROUTER_DATA=$(ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no \
  "$ROUTER_USER@$ROUTER_IP" "
  show interfaces $WAN_IFACE
  show ip route | head -30
  show processes cpu sorted | head -15
" 2>&1)

# Step 4: Build the Claude prompt and copy to clipboard
echo ""
echo "[4/4] building Claude prompt..."

PROMPT="## Network Incident — $(date '+%Y-%m-%d %H:%M:%S')

### Gateway Ping Results (50 packets)
$PING

### Traceroute to 8.8.8.8
$TR1

### Traceroute to 1.1.1.1
$TR2

### Router Interface Stats (SSH output)
$ROUTER_DATA

---

You are a senior network engineer. Based on the data above:

1. **What is the most likely root cause?** (one sentence)
2. **What is the probability this is an ISP issue vs internal?**
3. **What are the three immediate actions I should take right now, in order?**
4. **Write an exec-ready status update** (2 sentences, non-technical, suitable for Slack or email to senior management)

Be direct. I have 5 minutes."

# Copy to clipboard (works on Linux with xclip, macOS with pbcopy)
echo "$PROMPT" | xclip -selection clipboard 2>/dev/null \
  || echo "$PROMPT" | pbcopy 2>/dev/null \
  || echo "$PROMPT" > /tmp/panic_prompt.txt

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  [✓] prompt copied to clipboard — paste into Claude"
echo "      (or open /tmp/panic_prompt.txt)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

Copy into Claude. Get this:

```
ROOT CAUSE (most likely): CRC errors on GigabitEthernet0/0 indicate
a physical layer issue — degraded SFP or cable at the WAN handoff.

ISP vs internal: 70% internal (errors on your side of the demarc),
30% ISP (could be their CPE port).

IMMEDIATE ACTIONS:
1. Check GigabitEthernet0/0 error counters: show interfaces Gi0/0
   — if CRC > 0, swap the cable between the router and the ISP handoff box
2. Check the SFP in the WAN port — reseat or swap if accessible
3. If errors are zero and traceroute dies at hop 2, call the ISP now
   — reference the traceroute showing 100% loss starting at their gateway

EXEC UPDATE:
"We're experiencing a WAN connectivity issue traced to the connection
between our router and the ISP handoff — our team is investigating now
and has a probable fix identified. ETA for resolution: 15–30 minutes."
```

Root cause, three actions, exec update. Before the board meeting starts.

---

## Setup (3 minutes)

**1. Save the script:**
```bash
curl -o ~/panic.sh https://packetpilotai.com/panic.sh
chmod +x ~/panic.sh
```

**2. Fill in your four variables:**
- `ROUTER_IP` — your firewall or router's management IP
- `ROUTER_USER` — SSH username (make sure you have key-based auth set up)
- `WAN_IFACE` — interface name from `show interfaces brief`
- `GATEWAY_IP` — your default gateway

**3. Test it now, not during an outage:**
```bash
~/panic.sh
```

Check that the SSH connects and the Claude prompt looks right. Fix any issues while the network is up, not down.

**4. Bind it to a key:**
- **Stream Deck:** Add an "Open" action pointing to `~/panic.sh` — run in terminal
- **macOS:** Automator → Run Shell Script → assign a keyboard shortcut
- **Linux:** `xbindkeys` or your DE's keyboard shortcut manager
- **Alias:** Add `alias panic='~/panic.sh'` to your `.bashrc` or `.zshrc`

---

## What it actually gives Claude

The prompt includes everything Claude needs to diagnose without asking follow-up questions:

- **Timestamped ping results** — loss percentage, min/avg/max RTT to your gateway
- **Traceroutes to three targets** — if all three die at the same hop, it's that hop; if only one dies, it's DNS or routing
- **Live router stats** — interface error counters, the routing table, CPU load
- **The explicit question** — "what is the most likely root cause" forces a direct answer instead of a list of possibilities

The difference between pasting raw output and using this prompt is the last section. Most engineers paste data and ask "what's wrong?" — Claude then produces a five-paragraph essay covering every possibility. The prompt above forces a verdict first, then supporting actions.

---

## pfSense version

If you're running pfSense instead of Cisco IOS, swap the SSH command:

```bash
ROUTER_DATA=$(ssh -o ConnectTimeout=5 \
  "$ROUTER_USER@$ROUTER_IP" "
  ifconfig \$(pfSsh.php playback getifstats 2>/dev/null | head -1)
  netstat -rn
  top -bSn 1 | head -20
" 2>&1)
```

And update the WAN interface variable to whatever pfSense names it — usually `igb0`, `em0`, or `vtnet0`. Check under **Interfaces → WAN** in the pfSense UI.

---

## The "at my desk" version vs the "on my phone" version

**At your desk:** run `panic.sh`, paste into Claude on your laptop, read the output.

**On your phone at 3am:** the script outputs to `/tmp/panic_prompt.txt`. Set up a share to a notes app (or pipe to a Slack webhook) and you can read the Claude response from anywhere.

One-liner to send the result directly to Slack (add your webhook URL):

```bash
RESULT=$(echo "$PROMPT" | claude --print 2>/dev/null)
curl -s -X POST -H 'Content-type: application/json' \
  --data "{\"text\":\"[PANIC] WAN triage result:\n\`\`\`\n$RESULT\n\`\`\`\"}" \
  https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

Now the Claude diagnosis goes straight to your #network-ops channel. By the time you've pulled up the page, the answer is already there.

---

## Why one click matters

When the network is down, the people who look calm are the ones with a procedure. Not because they know more — because they're running a script instead of deciding what to run.

This is the script. Run it before you panic, not after.

---

## The pre-built prompt library

The Claude prompt inside `panic.sh` is a simplified version of the structured troubleshooting prompts in the [Claude Prompt Pack for Network Admins](/prompt-pack). The pack includes full variants for common outage types — packet loss, DNS failures, BGP drops, firewall issues — each pre-loaded with the context Claude needs to go from raw data to root cause on the first try.

**[→ Get the Claude Prompt Pack — $29](/prompt-pack)**

60 prompts. One PDF. No Python required.
