---
title: 'AI Showdown #02: Can Claude, ChatGPT, and Gemini Write a Netmiko Script That Survives 50 Switches?'
description: 'We gave three AI models the same automation task — back up the running-configs of 50 switches with Netmiko — and scored the output against the failures that actually bite: hardcoded credentials, swallowed exceptions, and the devices a script silently skips. The rubric, Claude''s real script, and how to grade your own run.'
pubDate: '2026-05-31'
stream: 'showdown'
streamNum: 2
heroAscii: |
  $ ai "python netmiko script to back up 50 switches"

  TASK  read inventory · pull running-config · save dated · survive failures
  ────────────────────────────────────────────────────────────────────
  [✓] connects and pulls the config
  [✗] password = "Cisco123"      hardcoded in the script
  [✗] except: pass               unreachable devices vanish silently
  ────────────────────────────────────────────────────────────────────
  [!] the script that "works" on 50 devices quietly backs up 47
---

A config-backup script is the most-requested piece of network automation there is, and the most dangerous to get subtly wrong — because the failure mode isn't a crash, it's a *silent gap*. The script runs, prints a cheerful "done," writes 47 files, and the three switches it couldn't reach simply aren't there. You find out the day you need the backup of one of those three.

So this is the rig for it. One task, one prompt, one rubric that grades the things that separate a demo from something you'd trust in cron. Here's Claude's scored run and the failure modes to watch for when you run the prompt on ChatGPT and Gemini yourself.

---

## The Task

Back up the running-config of **50 switches**, with the properties a real backup job needs:

1. Read the device list from an **inventory file** — no hardcoded host lists.
2. **Never hardcode credentials.** Pull them from the environment or prompt.
3. One unreachable or misbehaving device must **not abort the run** or, worse, vanish silently.
4. Save each config to a **timestamped file** that doesn't clobber yesterday's.
5. End with a **summary that names every device that failed**, and a non-zero exit code if any did.

Requirements 3 and 5 are the trap. A script that aborts on the first failure is annoying; a script that *swallows* failures is dangerous, because it looks identical to a script that worked.

---

## The Exact Prompt

```
Write a Python 3 script using Netmiko that backs up the running-config of
about 50 Cisco switches.

Requirements:
  - Read the device list (host, device_type) from an inventory CSV.
  - Get credentials from environment variables or an interactive prompt.
    Do NOT hardcode credentials anywhere.
  - Connect to each device, run "show running-config", and save it to a
    file named with the hostname and a timestamp.
  - If a device is unreachable or errors, the script must keep going AND
    record the failure — never silently skip it.
  - At the end, print how many succeeded and list every device that failed,
    and exit non-zero if any failed.
  - Use connection timeouts so one dead device can't hang the run.
Output the complete script.
```

---

## The Scoring Rubric

| # | Criterion | Weight | Fail looks like |
|---|-----------|--------|-----------------|
| 1 | **No hardcoded credentials** | Critical | `password = "Cisco123"` in the source |
| 2 | **Per-device error handling** | Critical | One bad device aborts all 50 |
| 3 | **Failures reported, not swallowed** | Critical | `except: pass` — the silent-skip footgun |
| 4 | **Timeouts set** | High | No `conn_timeout`; one dead host hangs forever |
| 5 | **Dated, non-clobbering output** | Medium | Writes `switch.cfg`, overwrites it every run |
| 6 | **Correct Netmiko API, no hallucinations** | Critical | Invented methods, wrong exception import |

Criteria 1, 2, 3, and 6 are pass/fail gates. A script that leaks a password, dies on device one, hides failures, or calls a method that doesn't exist is a zero — polish on the rest doesn't redeem it.

---

## Claude's Run, Scored

```python
#!/usr/bin/env python3
"""Back up running-configs from an inventory of switches using Netmiko."""
import csv
import os
import sys
from datetime import datetime
from getpass import getpass
from concurrent.futures import ThreadPoolExecutor, as_completed

from netmiko import ConnectHandler
from netmiko.exceptions import (
    NetmikoTimeoutException,
    NetmikoAuthenticationException,
)

BACKUP_DIR = "backups"
MAX_WORKERS = 8


def load_inventory(path):
    """Inventory CSV columns: host, device_type (optional, default cisco_ios)."""
    with open(path, newline="") as f:
        return list(csv.DictReader(f))


def backup_one(device, username, password, secret, stamp):
    host = device["host"]
    params = {
        "device_type": device.get("device_type") or "cisco_ios",
        "host": host,
        "username": username,
        "password": password,
        "secret": secret,
        "conn_timeout": 15,
    }
    try:
        with ConnectHandler(**params) as conn:
            if secret:
                conn.enable()
            cfg = conn.send_command("show running-config", read_timeout=60)
    except NetmikoAuthenticationException:
        return host, False, "authentication failed"
    except NetmikoTimeoutException:
        return host, False, "unreachable / timed out"
    except Exception as exc:  # report, never swallow
        return host, False, f"error: {exc}"

    path = os.path.join(BACKUP_DIR, f"{host}_{stamp}.cfg")
    with open(path, "w") as fh:
        fh.write(cfg)
    return host, True, path


def main():
    if len(sys.argv) != 2:
        sys.exit("usage: backup.py <inventory.csv>")

    inventory = load_inventory(sys.argv[1])
    username = os.environ.get("NET_USER") or input("username: ")
    password = os.environ.get("NET_PASS") or getpass("password: ")
    secret = os.environ.get("NET_SECRET", "")
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    os.makedirs(BACKUP_DIR, exist_ok=True)

    ok, failed = [], []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = [
            pool.submit(backup_one, d, username, password, secret, stamp)
            for d in inventory
        ]
        for fut in as_completed(futures):
            host, success, detail = fut.result()
            (ok if success else failed).append((host, detail))
            print(f"[{'ok' if success else 'FAIL'}] {host}  {detail}")

    print(f"\n{len(ok)}/{len(inventory)} backed up · {len(failed)} failed")
    for host, detail in failed:
        print(f"  FAILED  {host}: {detail}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
```

Scoring it:

| # | Criterion | Result | Note |
|---|-----------|--------|------|
| 1 | No hardcoded creds | ✅ | Env vars, falling back to `getpass` (no echo) |
| 2 | Per-device handling | ✅ | Each device runs in its own task; one failure is isolated |
| 3 | Failures reported | ✅ | Caught, returned with a reason, listed in the summary, non-zero exit |
| 4 | Timeouts | ✅ | `conn_timeout=15` and a `read_timeout` on the command |
| 5 | Dated output | ✅ | `{host}_{stamp}.cfg` — never clobbers |
| 6 | Correct API | ✅ | `netmiko.exceptions` import path, context-manager connect, `read_timeout` (Netmiko 4.x) |

The honest asterisk, same as last time:

> **This is the score on the detailed prompt.** Ask any model for "a netmiko script to back up my switches" with no requirements, and the single most common result drops criteria 1 and 3 together: credentials hardcoded at the top, and a `try/except` that prints "failed" or just `pass`-es — backing up the reachable devices and disappearing the rest. The script demos perfectly because every device in the demo is reachable.

---

## Where AI Models Skip Devices: The Failure Modes to Score Against

Run the prompt on ChatGPT and Gemini, grade against the six. These are the points that drop, hardest first:

- **`except Exception: pass` (criterion 3).** The defining sin of AI-generated automation. The unreachable devices don't error loudly — they're caught and discarded. The run "succeeds" with a silent gap exactly where you most need data.
- **Hardcoded credentials (criterion 1).** A `username`/`password` literal at the top of the file, which then gets committed to a repo. This is how network creds end up in git history.
- **Abort on first failure (criterion 2).** A single `try` wrapped around the *whole loop* instead of per-device, so device #7 being down means devices #8–50 never get backed up.
- **No timeouts (criterion 4).** One powered-off switch and the script hangs on a TCP connect for minutes — or forever — and the cron job overlaps itself.
- **Hallucinated API (criterion 6).** Invented method names, or the *old* exception import (`netmiko.ssh_exception`) that breaks on current Netmiko, or `send_command` with a `delay_factor` where 4.x wants `read_timeout`. These fail at runtime, which is the lucky case.

We won't fabricate ChatGPT and Gemini transcripts — running the prompt yourself is the rig. Score what they actually produce.

---

## Run It Yourself (and graduate this into a real bench)

Run the prompt on the other two, grade them against the rubric, and send us the raw scripts (`hello@packetpilotai.com` or reply to Packet Drop). We'll score them against this exact rubric and publish the full head-to-head with your outputs credited. Fixed metric, reproducible inputs — that's a benchmark, not a vibe.

---

## The Review Prompt That Catches a Silent Skip

Before any automation script goes in cron, run it through this:

```
Audit this Python network automation script for production safety. Here it
is: [paste]. Check specifically for:
  1. Any hardcoded credentials or secrets.
  2. Exception handling that SILENTLY swallows failures (e.g. except: pass)
     instead of recording and reporting them.
  3. Whether one failed device aborts the entire run.
  4. Missing connection/read timeouts.
  5. Any Netmiko method or import that is incorrect or deprecated.
For each issue: severity, the exact line, and the fix.
```

The phrase "silently swallows failures" is doing the work. It makes the model hunt for the bare `except` — the bug that, by definition, never shows up in testing.

---

## The One-Line Takeaway

**With automation the dangerous failure isn't a crash, it's a silent skip. Grade every AI-generated script on whether a dead device gets *reported* — and never let one ship with hardcoded credentials or a bare `except`.**

---

## Next in the Showdown

Showdown #03 — same three models, a 200-line ACL with shadowed rules buried in it. Who finds every dead rule, who invents one that isn't there, and who just summarizes the file back to you?

— **Subscribe to Packet Drop** (newsletter form below) to get the next head-to-head when it ships.

— **Want the structured prompts that score top marks?** [Get the Prompt Pack](/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=showdown-02-claude-vs-chatgpt-vs-gemini-netmiko) — 60 production prompts for network admins, $29, lifetime updates.
