# Shepherding Scheduler — Design Spec

- **Date:** 2026-06-25
- **Status:** Approved for planning
- **Author:** Kevin Muncie

## Context & problem

The app schedules shepherding visits two quarters at a time, aiming for every
active person to receive two visits per year (one per scheduled block). Each
visit pairs a *shepherd* with a *person being visited*.

The current `BulkMeetingGenerator` is crude:

1. It only considers **completed** meetings when avoiding repeats, so pairings
   scheduled-but-not-yet-completed (including ones created moments earlier in the
   same run) are invisible and can be re-booked.
2. It is **directional and sheep-only** — it avoids "this shepherd already
   shepherded this person," not "these two people have already been paired."
3. It is **greedy and per-person** with no global view, so early picks can starve
   later people of fresh options, and it does not balance a shepherd's existing
   future bookings.
4. It **commits immediately** with no review/adjust step.

Data scale (from the 2026-06-25 backup): 60 active people, 19 active shepherds,
41 non-shepherds, 355 meetings (341 completed) spanning 2023 Q2 → 2026 Q2.

## Goals

- Prefer pairing people who have **not met before**, as a *soft* preference
  (repeats allowed when necessary, ranked by recency/frequency).
- Treat "met before" as **undirected** — A having shepherded B counts as the
  pair (A, B) having met, regardless of who visited whom.
- Count **all** prior meetings (completed and scheduled), including those created
  during the current generation run.
- **Balance shepherd workload** across the ~19 shepherds.
- Give each person a **different shepherd** for their two visits within a year.
- Produce a **draft** the user can review, **lock**, **swap**, and
  **re-optimize**, then **commit** — not an immediate write.
- Add a **visual network graph** of visits between people.

## Non-goals (YAGNI)

- No AI / LLM layer of any kind. The app stays fully local and offline.
- No geography/location/timezone logic in scheduling.
- No `Person`/`Meeting` schema changes.
- No heavy optimization library (min-cost-flow / ILP). Greedy + local search is
  more than sufficient at this scale.

## Decisions (from brainstorming)

| Question | Decision |
|---|---|
| Freshness rule | **Soft preference**, undirected, ranked by recency & frequency |
| Other factors | Even shepherd workload; different shepherd each visit; recency/frequency of repeats. **Location excluded.** |
| Workflow | **Draft → lock/swap → re-optimize → commit** |
| Architecture | **Local deterministic optimizer only.** No AI, ever. |
| Visualization | **Yes** — D3 force-directed network graph of past visits |
| Weight tuning | **Constants now, passed as a parameter** (default = the constants). No in-app tuning UI this round; the parameter seam makes one a future zero-refactor add. Defaults calibrated against the real backup during implementation. |
| Storage | **Unchanged** — localStorage + JSON export. No SQLite/backend; data size (≈194 KB) makes format a non-issue. Any future durability/multi-device need is a separate effort. |
| Testing | **Skipped for this work** (user explicitly authorized). Logic kept pure for easy future testing. |

## Data model & the pairing graph

No schema change. Everything is derived from the existing store at run time.

`pairingGraph.ts` builds an in-memory undirected index from all people's
meetings:

- Key: `pairKey(a, b) = [a, b].sort().join("|")` (order-independent).
- Value per pair: `{ count: number, lastTimeIndex: number }` where
  `timeIndex = year * 4 + (quarter - 1)`.
- Counts **all** meetings — completed and scheduled.
- Deduplicate meetings by `id` (each meeting is stored on both participants).

Exposes:

- `getPair(a, b): { count, lastTimeIndex } | undefined`
- helpers to list a person's existing visits within a target year (for the
  "different shepherd each visit" rule).

This index is also the data source for the visual network graph.

## Cost function (`cost.ts`)

For a candidate assignment **shepherd `S` → person `P`** in a target block, the
cost is the sum of the terms below. Weights are **named, exported constants**
collected in a single `Weights` object that the cost/solver functions accept as
an optional parameter (defaulting to those constants), so a future tuning UI
needs no refactor. Starting values are suggestions to be tuned against the real
data.

- **Self-pairing:** `S === P` → infeasible, excluded entirely.
- **Freshness:** fresh pair → `0`. Otherwise
  `REPEAT_BASE + REPEAT_PER_PRIOR * (count - 1) - recencyDiscount`, where
  `recencyDiscount = min(REPEAT_BASE * 0.5, RECENCY_PER_QUARTER * quartersSince)`
  and `quartersSince = currentTimeIndex - lastTimeIndex`. Older repeats are
  cheaper; more-frequent repeats are dearer. (`REPEAT_BASE ≈ 100`,
  `REPEAT_PER_PRIOR ≈ 25`, `RECENCY_PER_QUARTER ≈ 8`.)
- **Same-shepherd-this-year:** if `P`'s other visit in the target year already
  uses `S` → add `SAME_SHEPHERD_YEAR ≈ 80`.
- **Load balance:** soft penalty that grows as `S`'s assignment count in this
  block exceeds the fair share (`activePeople / shepherds ≈ 3.2`):
  `LOAD_OVER_FAIR * max(0, assignedSoFar - fairShare)` (`LOAD_OVER_FAIR ≈ 10`).

Relative ordering matters more than absolute values: a fresh pair (0) should
beat any repeat; a repeat should generally beat reusing the same shepherd within
a year only when no fresh option exists.

## Solver (`scheduler.ts`)

Deterministic. Input: active people, target block (year + quarter pair), set of
locked visits, weights. Output: a `ScheduleDraft` — proposed visits each with a
cost breakdown and a human-readable reason.

Decomposed into two steps to keep each tractable:

1. **Shepherd assignment (the optimization).**
   - *Greedy construction* in **most-constrained-person-first** order (people
     with the fewest fresh shepherd options are assigned first so they are not
     starved). Each takes the lowest-cost available shepherd. The live pairing
     index updates as assignments are made, so within-block repeats are
     penalized too.
   - *Local-search improvement:* repeatedly apply the best cost-reducing **swap**
     (two people exchange shepherds, or one moves to a cheaper shepherd) until no
     improving move exists or an iteration cap is hit.
2. **Quarter split (a balancing pass).** Distribute the chosen visits across the
   block's two quarters to keep per-quarter counts even and spread each
   shepherd's visits across both quarters.

**Locks:** locked visits are fixed inputs. Their load and pairing contributions
are counted, but the solver only re-optimizes unlocked people.

**Determinism:** all tie-breaks are deterministic (by id), so re-running with no
changes yields the identical draft. This is essential for user trust in the
"re-optimize" button.

## Module layout

Pure logic, no Vue/Pinia dependencies, independently testable:

```
src/scheduling/
  types.ts          ProposedVisit, ScheduleDraft, AssignmentReason
  pairingGraph.ts   build undirected index from people/meetings
  cost.ts           cost terms + exported weight constants
  scheduler.ts      greedy + local-search solver; pure, deterministic
```

## UI changes

**`BulkMeetingGenerator.vue`** changes from *commit-immediately* to a
**draft → review** flow, keeping the existing Q1&Q2 / Q3&Q4 + year controls:

- **Generate** builds a `ScheduleDraft` and renders a **review table**:
  Person · Shepherd · Quarter · Status · Lock · Swap.
- **Status** shows the derived reason — "Fresh pair", "Repeat ×2, last met 2024
  Q3", or balance notes — and visibly flags repeats.
- **Lock** freezes a row; **Swap** lets the user pick a different shepherd
  manually.
- **Re-optimize** re-runs the solver honoring locks.
- **Commit** writes the draft to the store via `addMeeting`.
- A **summary** line reports total repeats and the load distribution across
  shepherds.
- **Guard:** if the target block already has meetings, warn and offer
  *replace* vs *augment* rather than blindly double-booking (today's behavior).

## Visual network graph

A new D3 component (e.g. `VisitNetworkChart.vue`, matching the existing
`ShepherdPerformanceChart.vue` naming), surfaced in **ReportsView** alongside the
shepherd performance chart.

- **Nodes** = active people; **edges** = pairs that have met, built from the
  pairing graph.
- Node **role** distinguished by color (shepherd vs. person-visited); node
  **size** by total visit count.
- Edge **thickness** by `count` (how many times the pair has met).
- Force-directed layout so over-connected hubs and isolated/under-visited people
  are visible at a glance.
- Read-only insight tool; it does not edit data.

## Reasons & explanations

Each `ProposedVisit` carries a `reason` derived purely from its cost components
(no AI): e.g. "Fresh pair", "Repeat ×2 (last met 2024 Q3)", "balances load".
The repeat flag in the review table is driven by this.

## Edge cases & error handling

- **No fresh option:** if every shepherd is a repeat for someone, assign the
  best (lowest-cost) and **flag it clearly**. Never silently fail or skip a
  person.
- **Self-pairing** excluded (a shepherd never visits themselves).
- **Shepherds are also visited** as people — they appear in the assignment list
  and must be visited by someone else.
- **Departed people** excluded (existing behavior).
- **Re-generating a populated block** triggers the replace/augment guard.

## Testing

Skipped for this round per explicit user authorization. The scheduling logic is
deliberately isolated as pure, dependency-free modules (`pairingGraph`, `cost`,
`scheduler`) so unit/integration tests via Vitest can be added later with no
refactor.

## Out of scope / future

- AI advisor layer (natural-language constraints, narration).
- Geography/proximity weighting.
- Persisting tuned weights or draft state.
- Vitest/Playwright test suites.
