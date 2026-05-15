---
title: '3D Printer Filament Comparison: PLA vs PETG vs ABS vs TPU vs ASA vs Nylon vs PC'
description: 'A no-fluff comparison of the 7 most-used 3D printing filaments — strength, temp resistance, flex, food safety, UV stability, print difficulty, and the exact use case each is best for. Plus print settings cheat sheet.'
pubDate: '2026-05-14'
heroAscii: |
  ┌─ FILAMENT DECISION TREE ────────────────────────────────┐
  │                                                          │
  │   Outdoor + UV?         → ASA  or  PETG                  │
  │   Food contact?         → PLA  or  PETG (food-safe)      │
  │   Flexible parts?       → TPU (95A or 85A)               │
  │   Hot car / engine bay? → ABS / ASA / Nylon / PC         │
  │   Beginner / detail?    → PLA                            │
  │   Strength + outdoor?   → PETG                           │
  │   Real engineering?     → Nylon  or  PC                  │
  │                                                          │
  │   [!] No "best" filament. Best fit for the job.          │
  └──────────────────────────────────────────────────────────┘
---

The fastest way to pick a 3D printer filament: **PLA** for easy detailed prints that stay indoors, **PETG** for outdoor parts or anything that gets handled, **ABS or ASA** for parts that see heat (car interiors, engine bays, outdoors with UV), **TPU** for anything that needs to flex or grip, **Nylon** for mechanical parts under load, and **Polycarbonate (PC)** for the hardest engineering jobs. The match between filament and job is what determines success — not price, not brand. This guide compares all seven by the properties that actually matter: temp resistance, strength, UV stability, flex, food safety, print difficulty, and exact use cases.

---

## Quick Comparison: All 7 Filaments at a Glance

| Filament | Print Temp | Bed Temp | Heat Resistance | Strength | Flex | UV Stable | Food Safe | Difficulty |
|---|---|---|---|---|---|---|---|---|
| **PLA** | 190-220 °C | 50-60 °C | Poor (~60 °C) | Medium | Brittle | No | Some* | Easy |
| **PETG** | 220-250 °C | 70-90 °C | Fair (~75 °C) | High | Slight | Fair | Some* | Easy-Medium |
| **ABS** | 230-260 °C | 90-110 °C | Good (~100 °C) | High | Slight | Poor | No | Hard |
| **ASA** | 240-260 °C | 90-110 °C | Good (~100 °C) | High | Slight | Excellent | No | Hard |
| **TPU 95A** | 220-240 °C | 40-60 °C | Fair (~80 °C) | Flexible | Very high | Fair | No | Medium |
| **Nylon (PA)** | 240-270 °C | 70-90 °C | Excellent (~120 °C) | Very high | Medium | Poor | No | Hard |
| **PC** | 260-310 °C | 100-120 °C | Excellent (~130 °C) | Highest | Slight | Fair | No | Very Hard |

*Food safety depends on the specific filament's additives and whether the print is sealed. No FDM print is guaranteed food-safe out of the box because of layer-line bacterial growth — coat with food-safe epoxy if real food contact is required.

---

## What Is the Best 3D Printer Filament for Beginners?

**PLA.** It prints at low temperatures (190-220 °C), doesn't need a heated chamber, doesn't warp, doesn't smell, and forgives almost every mistake a new user makes. It captures fine detail better than any other common filament, comes in every color, and is the cheapest of the seven by far.

The trade-off: PLA softens at ~60 °C. A PLA part left in a car on a summer day will deform. A PLA bracket holding anything outdoors will fail within a season of UV exposure. It is the wrong filament for anything load-bearing, outdoor, or hot — but for prototypes, display models, indoor organizers, miniatures, and learning the craft, nothing else is as forgiving.

**Best for:** miniatures, cosplay props (indoor), prototypes, models, indoor organizers, gifts.
**Avoid for:** car interior parts, outdoor brackets, anything mechanical, anything near heat.

---

## When Should You Use PETG Instead of PLA?

PETG is the upgrade most printers make after their first spool of PLA breaks under real-world use. It is nearly as easy to print as PLA but tougher, slightly flexible (won't snap brittle), UV-tolerant enough for outdoor use, and rated for around 75 °C — survives a hot car most of the year.

**Use PETG when:**
- The part will go outside
- The part will be handled, dropped, or stressed
- The part needs slight flex without being rubber
- You need a transparent or translucent finish (PETG is the clearest common filament)
- You want food-adjacent prints — water bottles, planters (with food-safe sealant)

**Trade-offs:** PETG strings more than PLA, prefers a slower print speed, and can be sticky on the print bed — too much adhesion can rip glass beds. Use a release agent or PEI sheet.

**Best for:** outdoor brackets, plant pots, mechanical prototypes, transparent enclosures, tool holders, water-resistant parts.

---

## When Do You Actually Need ABS?

ABS (Acrylonitrile Butadiene Styrene) is what Lego is made of. It's tough, heat-resistant to ~100 °C, machinable, paintable, glue-able with acetone, and the cheap workhorse of injection molding.

But FDM printing ABS is hard. It warps aggressively, requires a heated chamber for anything larger than a phone case, produces styrene fumes that need ventilation, and stinks. **For most makers, ASA (next section) is a strictly better alternative.**

**Use ABS when:**
- You need to acetone-smooth or vapor-polish the surface (ABS does this; ASA doesn't as well)
- You need acetone welding for bonded assemblies
- You're matching an existing ABS production part
- Cost matters and you can vent the area

**Best for:** car interior parts (not direct sun), tool housings, electronics enclosures, parts that will be vapor-smoothed.

**Avoid for:** outdoor exposure (UV destroys ABS — yellows, cracks, fails within ~12 months direct sun), beginners, anyone without ventilation.

---

## ASA: The Outdoor Filament Nobody Talks About

ASA (Acrylonitrile Styrene Acrylate) is chemically similar to ABS but with one critical difference: **it does not degrade in UV light**. It is the filament for outdoor parts that need to last. Mailbox flags, garden hose adapters, exterior signage, license plate frames, drone parts, RC car body panels — all jobs where ABS would yellow and crack in a season, ASA holds up for years.

It prints similarly to ABS — warps, needs enclosure, similar temps — but the result lasts outdoors. The cost is ~30% more than ABS, which is nothing if you'd otherwise reprint every year.

**Best for:** outdoor brackets, signage, automotive exterior accessories, drone parts, anything in direct sun.

**Trade-offs:** Hard to print well without an enclosure. Similar fumes to ABS — ventilate. ~30% more expensive than ABS.

---

## When Should You Use TPU (Flexible Filament)?

TPU (Thermoplastic Polyurethane) is rubber you can print. It comes in different hardness grades — most common is **TPU 95A** (stiff-flexible, similar to a shoe sole) and **TPU 85A** (softer, more rubber-like, harder to print).

Use TPU when a part needs to:
- Bend without breaking
- Compress and rebound (gaskets, grips, dampers)
- Grip another part (phone cases, tool grips)
- Absorb vibration

**Print tips:**
- Slow it down — 20-30 mm/s for TPU 95A, 15-20 mm/s for TPU 85A
- Use a direct-drive extruder if you have one (Bowden tubes make flexibles miserable)
- Dry the filament first — TPU absorbs moisture aggressively, and wet TPU prints look terrible
- Disable retraction or reduce it significantly

**Best for:** phone cases, tool grips, gaskets, vibration dampeners, watch bands, drone bumpers, rubber feet.

**Avoid for:** anything that needs to hold a precise shape under load — TPU compresses.

---

## When Should You Use Nylon (PA)?

Nylon is the engineering filament. It is **the strongest common filament**, with excellent abrasion resistance, fatigue resistance, and impact tolerance. Nylon parts can flex thousands of times without failing — gears, hinges, living springs, and load-bearing brackets all work well.

It's also the most demanding filament on this list to print. Nylon absorbs moisture from the air within hours of opening the spool. Wet nylon prints look like Swiss cheese — bubbles, stringing, poor layer adhesion. **You must dry it before printing and keep it dry during printing** (filament dryer or dry box).

**Best for:** gears, hinges, mechanical parts under load, snap-fit assemblies, parts that flex repeatedly, tool replacement parts.

**Trade-offs:** absorbs moisture, requires high print temps (240-270 °C), warps slightly, expensive (~2-3× the price of PLA).

---

## When Is Polycarbonate (PC) Worth the Trouble?

PC is the strongest common FDM filament and has the highest heat resistance (~130 °C continuous, higher short-term). It's bulletproof glass material — literally; PC is what riot shields are made of. Optically clear in pure form, takes heat better than any of the others, and is impact-resistant beyond anything PLA/PETG can offer.

The catch: print temps are extreme (260-310 °C). Most consumer printers need an all-metal hotend upgrade to print PC at all. It also wants a heated chamber and warps as much as ABS without one.

**Best for:** high-temp electronic enclosures, parts near engines, ballistic prototyping, optically clear functional parts, hot environment tools.

**Avoid for:** beginners, printers without an all-metal hotend, anything cosmetic where finish matters more than strength.

---

## Which Filament Should You Use for Each Use Case?

| Use Case | First Choice | Backup | Avoid |
|---|---|---|---|
| Miniatures / display models | PLA | PLA+ | PETG (too matte) |
| Phone case | TPU 95A | PETG | PLA (brittle) |
| Outdoor bracket (sun exposure) | ASA | PETG | PLA, ABS |
| Outdoor bracket (shaded) | PETG | ASA | PLA |
| Car interior part | ABS | ASA | PLA, PETG |
| Car engine bay part | Nylon | PC | Everything else |
| Drone frame | PC | Nylon | PLA |
| Drone body panels | ASA | PETG | PLA |
| Gear / hinge | Nylon | PETG (light load) | PLA, TPU |
| Tool holder / shop organizer | PETG | PLA+ | TPU |
| Cosplay armor (rigid) | PLA | PETG | TPU |
| Cosplay (flexible joints) | TPU 95A | PETG | PLA |
| Plant pot | PETG | PLA | TPU |
| Water bottle / cup (sealed) | PETG | PLA (food-safe brand) | ABS |
| Garden hose connector | PETG | ASA | PLA |
| Tool replacement gear | Nylon | PC | PLA |
| Engine intake manifold | PC | Nylon | Everything else |
| Living hinge | Nylon | PP | PLA |
| Vibration damper | TPU 85A | TPU 95A | All rigid |
| Robot wheel / tire | TPU 95A | TPU 85A | Rigid |
| RC car body | ASA | ABS | PLA |
| RC car structural part | Nylon | PC | PLA |
| Indoor sign | PLA | PETG | TPU |
| Outdoor sign | ASA | PETG | PLA |
| Battery tray | Nylon | PC | PLA (heat) |
| Action figure | PLA | PETG | TPU |
| Cookie cutter | PLA (food-safe) | PETG (food-safe) | ABS |
| Drone propeller | PC | Nylon | PLA |
| Watch strap | TPU 95A | TPU 85A | Rigid |
| Camera mount (indoor) | PLA+ | PETG | TPU |
| Camera mount (car) | ABS / ASA | PETG | PLA |
| Wall hook (indoor) | PLA | PETG | TPU |
| Wall hook (garage / shed) | PETG | ASA | PLA |
| Functional prototype | PETG | PLA | TPU |
| Snap-fit enclosure | PETG | Nylon | PLA |

---

## Print Settings Cheat Sheet

Starting points — every printer and brand varies. Calibrate from here.

```
┌──────────┬─────────┬────────┬────────┬──────────┬─────────────┐
│ Material │ Nozzle  │ Bed    │ Speed  │ Cooling  │ Notes       │
├──────────┼─────────┼────────┼────────┼──────────┼─────────────┤
│ PLA      │ 200-215 │ 55-60  │ 50-80  │ 100%     │ Easy mode   │
│ PETG     │ 230-245 │ 75-85  │ 40-60  │ 30-50%   │ Less fan    │
│ ABS      │ 240-255 │ 95-105 │ 40-60  │ 0-20%    │ Enclosure   │
│ ASA      │ 245-260 │ 95-110 │ 40-60  │ 0-20%    │ Enclosure   │
│ TPU 95A  │ 220-235 │ 50-60  │ 20-30  │ 30-50%   │ Direct ext. │
│ Nylon    │ 250-265 │ 70-90  │ 30-50  │ 0%       │ Dry first   │
│ PC       │ 270-300 │ 110-120│ 30-50  │ 0%       │ All-metal   │
└──────────┴─────────┴────────┴────────┴──────────┴─────────────┘
```

**Universal tips:**
- Dry every filament before printing if it's been open more than a week (especially Nylon, TPU, PC)
- Higher temp materials need an all-metal hotend (Nylon, PC mandatory)
- Anything that warps (ABS, ASA, Nylon, PC) needs an enclosure for parts bigger than ~10 cm
- First-layer adhesion is 80% of print success — clean the bed, use the right surface

---

## What About Specialty Filaments? (PLA+, PETG-CF, Wood, etc.)

The seven above are the families. Specialty variants exist within each:

| Variant | What it is | When to use |
|---|---|---|
| **PLA+** | PLA blended with toughness additives | Same use cases as PLA, more impact resistance |
| **Silk PLA** | PLA with optical brighteners | Display models — looks like polished plastic |
| **Wood PLA** | PLA with wood fiber | Decorative wood-look prints, sands well |
| **Carbon fiber (CF)** | Any base resin + chopped carbon | Stiffness boost; needs hardened nozzle; PETG-CF, Nylon-CF most common |
| **Glass fiber (GF)** | Like CF but cheaper, less stiff | Stiffness boost on a budget |
| **Conductive PLA** | PLA with carbon black | Low-current circuits, capacitive touch |
| **Magnetic PLA** | PLA with iron particles | Magnet-stickable parts |
| **PLA-HT / Tough PLA** | Heat-treated PLA, ~110 °C resistance | When you wanted PLA but need heat |

Composite filaments (anything with CF, GF, or metal powder) **wear out brass nozzles fast** — switch to a hardened steel or ruby nozzle before printing them, or you'll be replacing nozzles every spool.

---

## How Do You Store 3D Printer Filament?

All filaments absorb moisture from the air. Wet filament prints poorly — stringing, popping, bubbles, weak layer adhesion. Some absorb faster than others:

| Filament | Moisture sensitivity | Storage |
|---|---|---|
| PLA | Low | Sealed bag, desiccant — weeks OK |
| PETG | Medium | Sealed bag, desiccant — change desiccant monthly |
| ABS / ASA | Low-medium | Sealed bag, desiccant |
| TPU | High | Dry box mandatory; dry before every print if humid |
| Nylon | Extreme | Dry box always; ~4 hours open air = wet |
| PC | High | Dry box mandatory |

A filament dryer (like the SUNLU FilaDryer) pays for itself within the first few spools you would have otherwise wasted. Dry boxes — sealed plastic containers with desiccant — are the cheap version and work fine for everything except Nylon.

---

## Filament Decision Workflow

```
What does the part need to do?
│
├─ Hold a precise shape under no load → PLA
│
├─ Survive outdoors                    
│   ├─ UV exposure        → ASA
│   └─ Shaded outdoor     → PETG
│
├─ Bend or grip           → TPU (95A stiff, 85A softer)
│
├─ Survive heat (car / engine / sun)
│   ├─ Below ~100 °C      → ABS / ASA
│   └─ Above ~100 °C      → Nylon / PC
│
├─ Take repeated load (gears / hinges) → Nylon
│
├─ Maximum strength + heat             → PC
│
└─ Display / aesthetics                → PLA / Silk PLA
```

---

## Frequently Asked Questions

**What is the strongest 3D printer filament?**
Polycarbonate (PC) is the strongest common FDM filament by tensile strength, followed closely by Nylon (PA) and carbon-fiber-reinforced variants of either. For most practical jobs, Nylon is the strongest filament that can be printed on a typical consumer printer without major upgrades — PC requires an all-metal hotend rated to 300 °C+.

**What's the difference between PLA and PETG?**
PLA is easier to print, captures more detail, and prints at lower temperatures, but is brittle, has poor heat resistance (~60 °C), and isn't UV-stable. PETG is slightly harder to print but tougher, more flexible (won't snap), heat-resistant to ~75 °C, and tolerates outdoor exposure. Use PLA for detail and indoor display. Use PETG for anything that gets used or goes outside.

**Which filament is best for outdoor 3D prints?**
ASA is the best filament for outdoor 3D prints because it is UV-resistant — it does not yellow or become brittle in sunlight. PETG is the second-best choice for outdoor parts that are not in constant direct sun. Avoid PLA and ABS outdoors: PLA softens and degrades in heat and UV; ABS yellows and cracks within a year of UV exposure.

**Is PLA biodegradable?**
PLA is industrially compostable but not backyard-compostable. Under industrial composting conditions (60+ °C, controlled humidity, microbial inoculation), PLA breaks down in 3-6 months. In a normal garden compost bin or landfill, PLA persists for decades. Calling PLA "biodegradable" without context is misleading.

**Can you print PLA on an unheated bed?**
PLA can print on an unheated bed with sufficient surface prep — glue stick, painter's tape, or a textured PEI sheet. A heated bed at 50-60 °C makes first-layer adhesion much more reliable and reduces warping on larger parts. For prints under ~5 cm, no heated bed is necessary with good surface prep.

**What filament should I use for car interior parts?**
ABS or ASA. Car interiors regularly exceed 70 °C in summer, which deforms PLA and stresses PETG. ABS handles up to ~100 °C and is easy to glue and paint. ASA is the same temperature range but UV-resistant, so it works on dashboards or anywhere with direct sunlight exposure. Both require an enclosed printer for parts larger than a phone mount.

**Is PETG food safe?**
PETG itself is FDA-approved as a food-contact material in many applications, but FDM-printed PETG parts have microscopic layer lines and gaps where bacteria can grow, and the brass nozzles in most printers contain lead. For real food contact, either use a stainless-steel nozzle, seal the part with food-safe epoxy, or use the part for dry/cool/single-use food contact only. No FDM print is unconditionally food-safe out of the box.

**How long does 3D printer filament last?**
Unopened in a sealed bag with desiccant, most filaments last 2+ years without degradation. Opened and exposed to humid air, PLA is fine for 6-12 months, PETG for 3-6 months, TPU for 1-2 months, and Nylon for as little as a few hours before moisture causes print quality issues. Store everything sealed with desiccant — or in a dry box for moisture-sensitive types.

**Do I need a heated chamber to print ABS?**
For ABS parts under ~5 cm in any dimension, a heated bed and an enclosure (even a cardboard box over the printer) is usually enough. For larger parts or anything with thin walls, a heated chamber held at 50-60 °C is the only reliable way to prevent warping and layer separation. ASA has identical chamber requirements.

**What's the easiest flexible filament to print?**
TPU 95A is the easiest flexible filament — stiff enough to feed through most extruders without jamming, prints at moderate temperatures (220-240 °C), and produces consistent results. TPU 85A and softer grades are significantly harder to print and usually require a direct-drive extruder. Start with 95A.

**Can I mix filaments mid-print?**
Yes — multi-material printers (Prusa MMU, Bambu AMS, Mosaic Palette) swap between filaments mid-print, but the filaments must be compatible in print temperature and bed temperature. PLA + PETG works at the overlap range (~230 °C). ABS + PLA does not work — different bed temps, warping behavior, and adhesion characteristics make the combination unreliable. Check temperature overlap before planning a multi-material print.

**Why is my filament making popping or hissing sounds during printing?**
Wet filament. The sound is water boiling out of the strand as it hits the nozzle. The print will be stringy, weak, and rough. Dry the filament in a filament dryer or a food dehydrator at the recommended temperature (PLA: 45 °C / PETG: 65 °C / Nylon: 80 °C) for 4-6 hours, then store with fresh desiccant.

---

Most filament failures are filament-job mismatch — printing PLA for a part that lives in a hot car, or ASA for a beginner without an enclosure. Pick the filament that matches the job's environment first, then optimize for cost and print difficulty. The seven filaments above cover essentially every consumer FDM use case.
