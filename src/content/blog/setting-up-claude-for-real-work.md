---
title: 'Setting Up Claude for Real Work'
description: 'You are using 10% of Claude. The other 90% is setup, not talent — six operator moves (context files, real-file grounding, plan-first, skeptic review, guardrails) that turn Claude from a chatbot into a teammate.'
pubDate: '2026-06-03'
stream: 'loadout'
streamNum: 1
heroAscii: |
  $ claude            # 90% of users stop here
  > "summarize this"    ← the tutorial level

  $ claude --project ./CONTEXT.md
  [+] context: stack · conventions · guardrails
  [+] plan-first: on    skeptic-review: on
  [✓] tutorial level cleared
---

Most people use Claude like a vending machine: type a sentence, take whatever falls out, move on. It writes their emails and summarizes their articles, and they assume that is the ceiling. It is not the ceiling — it is the tutorial level. The people getting real work out of Claude are not smarter than you, and they are not using a different model. They set it up differently. Here are the six moves that close the gap, plus a 10-minute setup you can run right now.

---

## Claude Isn't a Chatbot. It's a Junior Teammate.

One reframe makes the rest obvious: you do not *query* a sharp junior — you give them context, delegate real work, and review what comes back. Set Claude up the same way and the output stops looking like autocomplete and starts looking like a colleague's.

---

## 1. Give It Context Once — Stop Starting Cold

**Amateur:** re-explains who they are and what they are working on, every single chat.
**Operator:** writes it down once — a Claude **Project**, or a **`CLAUDE.md`** in the repo: role, stack, conventions, what "good" looks like, what to never do.

Most bad output is Claude guessing about things you never told it. Kill the guessing and you have already passed most self-described power users. This single move is the highest-leverage line in this entire guide.

---

## 2. Connect It to Your Actual World

**Amateur:** copy-pastes snippets into a chat box.
**Operator:** lets it *see* the real files, repo, and tools — through the IDE, Projects, or MCP connectors.

Claude reasoning about your actual codebase or spreadsheet is a different animal than Claude guessing from a paragraph. Grounded beats hypothetical every time.

---

## 3. Make It Plan Before It Charges In

**Amateur:** "do X," then takes the first thing that comes out.
**Operator:** *"Before you write anything, lay out your plan and your assumptions. Wait for my go."*

Five seconds of planning kills the twenty-minute detour. You catch the wrong assumption while it is still a sentence, not a finished deliverable.

---

## 4. Never Accept the First Answer

**Amateur:** first draft = final draft.
**Operator:** *"Now critique that as a skeptical senior [engineer / editor / analyst]. What's weak, what did you assume, what's the riskiest part?"*

Claude judging its own work in a named role is consistently sharper than its first pass. Amateurs ship draft one; you ship draft three.

---

## 5. Set Guardrails You Can Trust

**Amateur:** babysits every keystroke, or YOLOs and gets burned.
**Operator:** sets the rules up front — *"read-only unless I say so; propose changes, don't apply them; never send, delete, or touch production without asking."*

Trust comes from boundaries, not hope. Define what it cannot do and you can hand it real work without holding your breath.

---

## 6. Build a System, Not a Pile of Chats

**Amateur:** every task starts from a blank box; good prompts vanish when the tab closes.
**Operator:** keeps the best prompts and context files where they are reusable.

The compounding is the whole point. Week ten is effortless because weeks one through nine left you a system instead of 400 disposable conversations.

---

## How Do You Set Up Claude in 10 Minutes?

1. Open a context file — a **Project**, or a `CLAUDE.md`. Write five lines: who you are, what you are building, your stack, your conventions, your hard "never do" rules.
2. Point Claude at one real thing you are working on.
3. Give it a real task — and end with *"plan first, then I'll say go."*
4. When it answers, say *"now review that like a skeptic."*

That is it. You just left the tutorial level.

---

None of this is about talent — the operator and the amateur have the same Claude open. One configured it; one didn't.

Want the kit that makes these six moves automatic? **[The Operator's Claude Starter Kit](/starter-kit/)** is free — the context-file template plus all six moves as copy-paste prompts. Set Claude up once and stop starting cold.

And if you run a network or infrastructure for a living, the **PacketPilot AI prompt pack** goes deeper — 50+ field-tested prompts for audits, migrations, and the 3am comms. [$29, one file](https://packetpilotai.gumroad.com/l/vepip).

*Operator-built. We use this stuff harder than we talk about it.*
