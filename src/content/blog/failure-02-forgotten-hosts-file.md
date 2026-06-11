---
title: "Failure Library #02: The DNS Outage That Wasn't DNS"
description: 'An app server lost its database the instant the DB was migrated to a new IP — and DNS pointed at the right place the entire time. A two-hour outage caused by one line in a hosts file, added as a "temporary" override in 2018. The post-mortem: the false lead, the tell, the fix, and the Claude prompt that would have ended it in five minutes.'
pubDate: '2026-05-31'
stream: 'failure-library'
streamNum: 2
heroAscii: |
  14:02  CHANGE   db migrated → 10.0.6.40   (old 10.0.6.12 decommissioned)
  14:03  ALERT    app01: connection refused to database
  14:09  on-call  "nslookup says 10.0.6.40 — DNS is correct?!"
  14:55  still down · DNS re-checked 4× · DBAs swear the DB is up
  15:48  "...why is app01 still talking to .12? nothing resolves to .12"
  15:51  > type C:\…\drivers\etc\hosts
         10.0.6.12   db.corp        ← added during a 2018 migration
  15:53  RESOLVED   removed the line · app reconnected in seconds

  [!] root cause: one static hosts entry silently overrode DNS for six years
---

At 14:02 the DBAs migrated a database to new hardware: old IP `10.0.6.12` decommissioned, new IP `10.0.6.40`, DNS record updated and confirmed. By 14:03 `app01` was throwing connection-refused errors at a database that was, by every available measure, up and correctly named. We spent the next hour and three-quarters interrogating DNS. DNS was innocent the entire time. The guilty party was a single line in a hosts file that a contractor added in 2018 and nobody ever removed. This is the post-mortem.

---

## What I Saw First

`app01` couldn't reach the database. The first thing anyone does is check the name:

```
C:\> nslookup db.corp
Name:    db.corp
Address: 10.0.6.40
```

`10.0.6.40` — the new, correct address. DNS is doing exactly what it should. So we have an application that can't reach a database whose name resolves perfectly to a server that is demonstrably up. That contradiction is where the next ninety minutes went to die.

---

## The First Wrong Theory (Cost: 90 Minutes)

The theory was "DNS caching / propagation lag." It's the reflex, and it felt right: IP just changed, app is behind, something somewhere is holding the old record.

So we did all of it. Flushed the DNS cache on `app01` (`ipconfig /flushdns`). Checked the record's TTL. Restarted the app to clear any in-process resolver cache. Verified the DNS server itself had only the new record. Queried it from three other machines — all returned `10.0.6.40`.

Every check passed, which should have been the clue. `nslookup` had *already* told us the name resolved to the right IP. Re-confirming a thing that was never broken is how you spend an hour standing still. **The data contradicted the theory at minute one, and we kept testing the theory instead of believing the data.**

---

## The Tell That Cracked It

The break came from asking a different question: not "what does the name resolve to?" but "what is `app01` *actually connecting to*?"

```
C:\> netstat -ano | findstr 10.0.6
 TCP  10.0.9.30:51120   10.0.6.12:5432   SYN_SENT
```

There it is. `nslookup` says the name points at `.40`. The application is opening connections to `.12` — the dead server. The name resolution the app is using and the answer `nslookup` returns **do not match**. Something is resolving `db.corp` to the old IP *before* DNS ever gets consulted — and whatever it is, `nslookup` can't see it.

There's only one thing on a host that beats DNS to the answer.

```
C:\> type C:\Windows\System32\drivers\etc\hosts
# ...
10.0.6.12   db.corp
```

---

## What the hosts File Actually Does (And Why nslookup Lied)

The operating system's resolver checks the **hosts file before it queries DNS**. On Windows those entries are loaded into the DNS client cache; on Linux the order is set by `nsswitch.conf` (`hosts: files dns` — *files* first). A line like `10.0.6.12 db.corp` is an absolute override: the OS sees the name, finds it in the hosts file, returns `.12`, and never asks DNS at all.

Here's the cruel part, the reason five people stared at DNS for ninety minutes: **`nslookup` and `dig` bypass the hosts file.** They are DNS tools — they send a query straight to the DNS server and report what it says. They never consult the resolver path your *application* actually uses. So `nslookup db.corp` cheerfully returned `.40` while every real connection went to `.12`. The diagnostic tool answered a different question than the one we were actually asking, and we trusted it.

The tell that would have caught it in one line is `ping`, which *does* honor the hosts file:

```
C:\> ping db.corp
Pinging db.corp [10.0.6.12] with 32 bytes of data:    ← ping and nslookup disagree
```

`ping` says `.12`, `nslookup` says `.40`. When those two disagree, you are looking at a hosts-file override, every time.

---

## The Fix

```
C:\> notepad C:\Windows\System32\drivers\etc\hosts   # delete the db.corp line
C:\> ipconfig /flushdns
```

Eleven seconds. The application reconnected on its next retry. The fix is always trivial; the finding is the whole job.

---

## The Real Root Cause

The migration didn't cause this outage. It *triggered* a landmine planted six years earlier.

1. **A "temporary" hosts override from 2018.** During a previous migration, a contractor added `10.0.6.12 db.corp` to test cutover before DNS propagated — a legitimate technique. They never removed it. There was no ticket, no expiry, no comment.
2. **It was harmless for six years.** The override happened to match DNS, so it did nothing visible — right up until the IP changed again and the stale pin and the live record finally disagreed.
3. **`nslookup` masked the real resolution path.** The team's primary diagnostic tool structurally cannot see the bug, and everyone trusted it over the application's own behavior.
4. **No configuration management on the app servers.** Nothing audited or enforced the contents of `hosts`, so a six-year-old manual edit lived on invisibly.
5. **The migration runbook checked DNS, not hosts files.** It validated the thing that was correct and never looked at the thing that was wrong.

Any one of those addressed, and 14:02 is a non-event.

---

## What Changed After

- **Audited `hosts` files fleet-wide.** Two other servers had stale pins from old projects. Both were ticking.
- **Configuration management now enforces a standard `hosts` file** on every managed host. Manual edits get reverted on the next run.
- **The migration runbook gained one line:** "Confirm the app's *actual* connection target with `netstat`/`ping`, not just `nslookup`."
- **Team rule:** when `ping` and `nslookup` disagree about a name, suspect the hosts file before anything else.

---

## The Claude Prompt That Would Have Saved 90 Minutes

```
An application cannot reach a host by name after that host's IP changed.
nslookup returns the NEW, correct IP. But the application is opening
connections to the OLD IP (confirmed with netstat). DNS on the server is
correct and other machines resolve the new IP fine.

What resolution paths on a host can override or bypass DNS and cause this
exact split between what nslookup returns and what the application connects
to? Give me the command to check each one, most likely first.
```

The framing that does the work is "the split between what nslookup returns and what the application connects to." That gap is the actual symptom, and it points straight at the hosts file and `nsswitch.conf`. Claude names both in the first response. Describe it as "DNS isn't working" and you'll get cache-flush advice — the same dead end we walked down by hand.

---

## The One-Line Takeaway

**`nslookup` queries DNS; your application queries the OS resolver — and the hosts file beats DNS to the answer. When `ping` and `nslookup` disagree about a name, the hosts file is lying to one of them, and `dig` can't see it.**

---

## Next in the Failure Library

Failure #03 — a building-wide authentication meltdown that looked like a dead domain controller. Logins failing, services throwing 401s, the identity team in a war room. The network was fine. The domain was fine. The *clock* was not.

— **Subscribe to Packet Drop** (newsletter form below) to get the next post-mortem the moment it ships.

— **Want the diagnostic prompts ready-to-paste?** [Get the Prompt Pack](/prompt-pack?utm_source=packetpilotai&utm_medium=blog&utm_campaign=failure-02-forgotten-hosts-file) — 60 production prompts for network admins, $29, lifetime updates.
