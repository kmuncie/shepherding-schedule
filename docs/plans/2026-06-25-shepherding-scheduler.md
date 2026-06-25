# Shepherding Scheduler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the crude bulk meeting generator with a deterministic, history-aware scheduler that drafts a reviewable two-quarter schedule preferring fresh pairings, and add a D3 network graph of past visits.

**Architecture:** Pure, dependency-free scheduling modules in `src/scheduling/` build an undirected "who-met-whom" graph from existing meetings, score every candidate `(shepherd → person)` assignment, and produce a `ScheduleDraft` via greedy construction + local-search improvement. `BulkMeetingGenerator.vue` becomes a draft → lock/swap → re-optimize → commit UI. A new `VisitNetworkChart.vue` renders the pairing graph in ReportsView.

**Tech Stack:** Vue 3 (Options/`defineComponent` + composition `setup`), TypeScript, Pinia, Quasar, D3 v7, Vite.

**Testing note:** Automated tests are intentionally omitted for this work per explicit user authorization ("I authorize you to skip testing for this work"). The scheduling logic is kept pure and dependency-free so Vitest can be added later with no refactor. Verification in each task uses `npm run type-check`, `npm run lint`, and manual checks in `npm run dev`.

**Spec:** `docs/specs/2026-06-25-shepherding-scheduler-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `src/scheduling/types.ts` (create) | Shared types: `ProposedVisit`, `ScheduleDraft` |
| `src/scheduling/pairingGraph.ts` (create) | Undirected pairing index built from people/meetings |
| `src/scheduling/cost.ts` (create) | Weights + `scoreAssignment` + `describeReason` |
| `src/scheduling/scheduler.ts` (create) | `generateSchedule`: greedy + local search + quarter split |
| `src/stores/people.ts` (modify) | Add `removeMeetingsForBlock` action for commit-replace |
| `src/components/BulkMeetingGenerator.vue` (rewrite) | Draft → lock/swap → re-optimize → commit UI |
| `src/components/VisitNetworkChart.vue` (create) | D3 force-directed visit network graph |
| `src/views/ReportsView.vue` (modify) | Surface `VisitNetworkChart` |

---

## Task 1: Scheduling types and pairing graph

**Files:**
- Create: `src/scheduling/types.ts`
- Create: `src/scheduling/pairingGraph.ts`

- [ ] **Step 1: Create `src/scheduling/types.ts`**

```ts
// src/scheduling/types.ts
// Shared types for the deterministic shepherding scheduler: the draft schedule
// the solver produces for review and the individual visits within it.

// A single proposed (or locked) visit in a draft schedule.
export interface ProposedVisit {
   sheepId: string;
   shepherdId: string;
   quarter: number;
   year: number;
   locked: boolean;
   cost: number;
   reason: string;
}

// The full draft for one two-quarter block, returned by the scheduler.
export interface ScheduleDraft {
   visits: ProposedVisit[];
   year: number;
   quarters: [number, number];
   // Ids of active people who could not be assigned any shepherd at all.
   unassigned: string[];
}
```

- [ ] **Step 2: Create `src/scheduling/pairingGraph.ts`**

```ts
// src/scheduling/pairingGraph.ts
// Builds an undirected "who has met whom" index from meeting history. Two people
// count as having met if either shepherded the other, in any meeting (completed
// or scheduled). Powers the scheduler's freshness cost and the visit network
// graph. Pure: depends only on the store's data types.

import type { Person, Meeting } from '@/stores/people';

export interface PairStats {
   count: number; // how many times the two people have met
   lastTimeIndex: number; // most recent meeting as year * 4 + (quarter - 1)
}

// Encode a year/quarter as a single comparable integer.
export function timeIndex(year: number, quarter: number): number {
   return year * 4 + (quarter - 1);
}

// Order-independent key for an unordered pair of person ids.
export function pairKey(a: string, b: string): string {
   return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export class PairingGraph {
   private pairs = new Map<string, PairStats>();

   constructor(people: Person[]) {
      // Meetings are stored on both participants; dedupe by meeting id.
      const seen = new Set<string>();
      for (const person of people) {
         for (const meeting of person.meetings ?? []) {
            if (seen.has(meeting.id)) continue;
            seen.add(meeting.id);
            this.addMeeting(meeting);
         }
      }
   }

   private addMeeting(meeting: Meeting): void {
      this.bump(
         meeting.shepherdId,
         meeting.sheepId,
         timeIndex(meeting.year, meeting.quarter)
      );
   }

   private bump(a: string, b: string, ti: number): void {
      if (a === b) return;
      const key = pairKey(a, b);
      const existing = this.pairs.get(key);
      if (existing) {
         existing.count += 1;
         existing.lastTimeIndex = Math.max(existing.lastTimeIndex, ti);
      } else {
         this.pairs.set(key, { count: 1, lastTimeIndex: ti });
      }
   }

   // Stats for a pair, or undefined if they have never met.
   get(a: string, b: string): PairStats | undefined {
      return this.pairs.get(pairKey(a, b));
   }

   // All recorded pairs, for the visit network graph.
   entries(): Array<{ a: string; b: string; stats: PairStats }> {
      const out: Array<{ a: string; b: string; stats: PairStats }> = [];
      for (const [key, stats] of this.pairs) {
         const [a, b] = key.split('|');
         out.push({ a, b, stats });
      }
      return out;
   }
}
```

- [ ] **Step 3: Verify types compile**

Run: `npm run type-check`
Expected: PASS (no errors). The new files are not yet imported anywhere, so this only confirms they are internally valid.

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: PASS with no errors on the new files.

- [ ] **Step 5: Commit**

```bash
git add src/scheduling/types.ts src/scheduling/pairingGraph.ts
git commit --no-gpg-sign -m "feat: add scheduling types and pairing graph"
```

---

## Task 2: Cost function and weights

**Files:**
- Create: `src/scheduling/cost.ts`

- [ ] **Step 1: Create `src/scheduling/cost.ts`**

```ts
// src/scheduling/cost.ts
// Turns a candidate (shepherd -> person) assignment into a numeric cost; lower is
// better. Fresh pairings cost 0; repeats, reusing a person's other shepherd in
// the same year, and overloaded shepherds add cost. Weights live in one object
// the solver accepts as a parameter so a future tuning UI needs no refactor.

import type { PairingGraph } from './pairingGraph';

export interface Weights {
   repeatBase: number; // flat cost the first time a pair is reused
   repeatPerPrior: number; // added per prior meeting beyond the first
   recencyPerQuarter: number; // discount per quarter since they last met
   maxRecencyDiscount: number; // cap on the recency discount
   sameShepherdYear: number; // penalty for reusing this person's other shepherd this year
   loadOverFair: number; // penalty per assignment a shepherd has above fair share
}

// Starting values. Relative ordering matters more than absolute magnitudes:
// a fresh pair (0) beats any repeat; a recent repeat costs more than an old one.
export const DEFAULT_WEIGHTS: Weights = {
   repeatBase: 100,
   repeatPerPrior: 25,
   recencyPerQuarter: 8,
   maxRecencyDiscount: 50,
   sameShepherdYear: 80,
   loadOverFair: 10,
};

export interface CostContext {
   graph: PairingGraph;
   currentTimeIndex: number; // timeIndex of the block's first quarter
   // sheepId -> set of shepherd ids already visiting that person this year
   sameYearShepherds: Map<string, Set<string>>;
   // shepherdId -> visits assigned so far in this run (drives load balancing)
   assignedCounts: Map<string, number>;
   fairShare: number; // active people / shepherds
   weights: Weights;
}

export interface CostBreakdown {
   total: number;
   freshness: number;
   sameShepherd: number;
   load: number;
   priorCount: number; // times this pair met before (0 = fresh)
   lastTimeIndex: number | null;
}

export function scoreAssignment(
   shepherdId: string,
   sheepId: string,
   ctx: CostContext
): CostBreakdown {
   const w = ctx.weights;

   // Freshness, discounted the longer ago the pair last met.
   const stats = ctx.graph.get(shepherdId, sheepId);
   let freshness = 0;
   let priorCount = 0;
   let lastTimeIndex: number | null = null;
   if (stats) {
      priorCount = stats.count;
      lastTimeIndex = stats.lastTimeIndex;
      const quartersSince = Math.max(0, ctx.currentTimeIndex - stats.lastTimeIndex);
      const discount = Math.min(
         w.maxRecencyDiscount,
         w.recencyPerQuarter * quartersSince
      );
      freshness = w.repeatBase + w.repeatPerPrior * (stats.count - 1) - discount;
   }

   // Reusing a shepherd who already visits this person this year.
   const sameSet = ctx.sameYearShepherds.get(sheepId);
   const sameShepherd = sameSet && sameSet.has(shepherdId) ? w.sameShepherdYear : 0;

   // Load: grows once a shepherd exceeds the fair share.
   const assigned = ctx.assignedCounts.get(shepherdId) ?? 0;
   const load = w.loadOverFair * Math.max(0, assigned - ctx.fairShare);

   return {
      total: freshness + sameShepherd + load,
      freshness,
      sameShepherd,
      load,
      priorCount,
      lastTimeIndex,
   };
}

// Human-readable label for the review table, derived purely from the breakdown.
export function describeReason(b: CostBreakdown): string {
   if (b.priorCount === 0) return 'Fresh pair';
   const quarter = b.lastTimeIndex !== null ? (b.lastTimeIndex % 4) + 1 : 0;
   const year = b.lastTimeIndex !== null ? Math.floor(b.lastTimeIndex / 4) : 0;
   const times = b.priorCount === 1 ? 'once' : `${b.priorCount}×`;
   let reason = `Repeat ${times} (last met ${year} Q${quarter})`;
   if (b.sameShepherd > 0) reason += '; same shepherd this year';
   return reason;
}
```

- [ ] **Step 2: Verify types compile**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/scheduling/cost.ts
git commit --no-gpg-sign -m "feat: add assignment cost function and weights"
```

---

## Task 3: The scheduler

**Files:**
- Create: `src/scheduling/scheduler.ts`

**Design notes for the implementer:**
- Each active person is a "sheep" assigned exactly one shepherd for the block; shepherds are also visited as sheep by someone else.
- Load is balanced during greedy because a shepherd's marginal load cost rises as they accumulate assignments.
- Local search only swaps shepherds between two sheep. Such a swap never changes any shepherd's assignment *count*, so the load term is invariant — the swap improves the draft iff it lowers combined `freshness + sameShepherd`. That is why local search compares only those two terms.

- [ ] **Step 1: Create `src/scheduling/scheduler.ts`**

```ts
// src/scheduling/scheduler.ts
// Deterministic shepherding scheduler. Given current people/meeting history and a
// target two-quarter block, produces a draft that prefers fresh pairings,
// balances shepherd load, and avoids reusing a person's other shepherd that year.
// Pure: no Vue/Pinia/storage dependencies.

import type { Person } from '@/stores/people';
import { PairingGraph, timeIndex } from './pairingGraph';
import {
   scoreAssignment,
   describeReason,
   DEFAULT_WEIGHTS,
   type Weights,
   type CostContext,
} from './cost';
import type { ProposedVisit, ScheduleDraft } from './types';

export interface LockedVisit {
   sheepId: string;
   shepherdId: string;
   quarter: number;
}

export interface SchedulerInput {
   people: Person[];
   year: number;
   quarters: [number, number];
   locks?: LockedVisit[];
   weights?: Weights;
}

export function generateSchedule(input: SchedulerInput): ScheduleDraft {
   const { people, year } = input;
   const quarters = input.quarters;
   const weights = input.weights ?? DEFAULT_WEIGHTS;
   const locks = input.locks ?? [];

   const active = people.filter((p) => !p.departed);
   const shepherds = active.filter((p) => p.role === 'shepherd');
   const graph = new PairingGraph(people);
   const fairShare =
      shepherds.length > 0 ? active.length / shepherds.length : Infinity;
   const currentTimeIndex = timeIndex(year, quarters[0]);
   const sameYearShepherds = buildSameYearShepherds(people, year);

   const assignedCounts = new Map<string, number>();
   const ctx: CostContext = {
      graph,
      currentTimeIndex,
      sameYearShepherds,
      assignedCounts,
      fairShare,
      weights,
   };

   // sheepId -> shepherdId for the whole block, seeded with locks.
   const assignments = new Map<string, string>();
   const lockedSheep = new Set<string>();
   const lockedQuarters = new Map<string, number>();
   for (const lock of locks) {
      lockedSheep.add(lock.sheepId);
      lockedQuarters.set(lock.sheepId, lock.quarter);
      assignments.set(lock.sheepId, lock.shepherdId);
      addCount(assignedCounts, lock.shepherdId, 1);
   }

   // Most-constrained-first: assign people with the fewest fresh shepherd
   // options earliest so they are not starved by greedier picks.
   const freshOptions = (sheepId: string): number =>
      shepherds.filter(
         (s) => s.id !== sheepId && graph.get(s.id, sheepId) === undefined
      ).length;
   const toAssign = active
      .filter((p) => !lockedSheep.has(p.id))
      .sort((a, b) => {
         const diff = freshOptions(a.id) - freshOptions(b.id);
         return diff !== 0 ? diff : a.id < b.id ? -1 : 1;
      });

   // Greedy construction.
   for (const person of toAssign) {
      const shepherdId = pickShepherd(person.id, shepherds, ctx);
      if (shepherdId === null) continue;
      assignments.set(person.id, shepherdId);
      addCount(assignedCounts, shepherdId, 1);
   }

   // Local-search improvement (freshness + same-shepherd only; see design notes).
   improveBySwaps(active, lockedSheep, assignments, ctx);

   // Quarter assignment: spread each shepherd across both quarters, keep totals even.
   const quarterBySheep = assignQuarters(
      assignments,
      quarters,
      lockedQuarters
   );

   const visits: ProposedVisit[] = [];
   const unassigned: string[] = [];
   for (const person of active) {
      const shepherdId = assignments.get(person.id);
      if (!shepherdId) {
         unassigned.push(person.id);
         continue;
      }
      const breakdown = scoreAssignment(shepherdId, person.id, ctx);
      visits.push({
         sheepId: person.id,
         shepherdId,
         quarter: quarterBySheep.get(person.id) ?? quarters[0],
         year,
         locked: lockedSheep.has(person.id),
         cost: breakdown.total,
         reason: lockedSheep.has(person.id)
            ? 'Locked'
            : describeReason(breakdown),
      });
   }

   visits.sort(
      (a, b) => a.quarter - b.quarter || (a.sheepId < b.sheepId ? -1 : 1)
   );
   return { visits, year, quarters, unassigned };
}

function addCount(map: Map<string, number>, key: string, delta: number): void {
   map.set(key, (map.get(key) ?? 0) + delta);
}

// For each person, the shepherds already visiting them in the target year
// (i.e. the other block's scheduled/completed visits).
function buildSameYearShepherds(
   people: Person[],
   year: number
): Map<string, Set<string>> {
   const result = new Map<string, Set<string>>();
   const seen = new Set<string>();
   for (const person of people) {
      for (const m of person.meetings ?? []) {
         if (seen.has(m.id)) continue;
         seen.add(m.id);
         if (m.year !== year || m.shepherdId === m.sheepId) continue;
         let set = result.get(m.sheepId);
         if (!set) {
            set = new Set();
            result.set(m.sheepId, set);
         }
         set.add(m.shepherdId);
      }
   }
   return result;
}

function pickShepherd(
   sheepId: string,
   shepherds: Person[],
   ctx: CostContext
): string | null {
   let best: string | null = null;
   let bestCost = Infinity;
   for (const s of shepherds) {
      if (s.id === sheepId) continue;
      const cost = scoreAssignment(s.id, sheepId, ctx).total;
      if (best === null || cost < bestCost || (cost === bestCost && s.id < best)) {
         bestCost = cost;
         best = s.id;
      }
   }
   return best;
}

function improveBySwaps(
   active: Person[],
   lockedSheep: Set<string>,
   assignments: Map<string, string>,
   ctx: CostContext
): void {
   const movable = active
      .filter((p) => !lockedSheep.has(p.id) && assignments.has(p.id))
      .map((p) => p.id);

   const subCost = (sheepId: string): number => {
      const shepherdId = assignments.get(sheepId)!;
      const b = scoreAssignment(shepherdId, sheepId, ctx);
      return b.freshness + b.sameShepherd;
   };

   let improved = true;
   let guard = 0;
   while (improved && guard < 10000) {
      improved = false;
      guard++;
      for (let i = 0; i < movable.length; i++) {
         for (let j = i + 1; j < movable.length; j++) {
            const p1 = movable[i];
            const p2 = movable[j];
            const s1 = assignments.get(p1)!;
            const s2 = assignments.get(p2)!;
            if (s1 === s2) continue;
            if (s1 === p2 || s2 === p1) continue; // would create a self-visit
            const before = subCost(p1) + subCost(p2);
            assignments.set(p1, s2);
            assignments.set(p2, s1);
            const after = subCost(p1) + subCost(p2);
            if (after < before) {
               improved = true;
            } else {
               assignments.set(p1, s1);
               assignments.set(p2, s2);
            }
         }
      }
   }
}

// Distribute visits across the block's two quarters: even per shepherd, then
// even globally. Locked visits keep their locked quarter.
function assignQuarters(
   assignments: Map<string, string>,
   quarters: [number, number],
   lockedQuarters: Map<string, number>
): Map<string, number> {
   const [q1, q2] = quarters;
   const result = new Map<string, number>();
   const global: Record<number, number> = { [q1]: 0, [q2]: 0 };

   const byShepherd = new Map<string, string[]>();
   for (const [sheepId, shepherdId] of assignments) {
      if (!byShepherd.has(shepherdId)) byShepherd.set(shepherdId, []);
      byShepherd.get(shepherdId)!.push(sheepId);
   }

   // Honor locked quarters first so the balancing accounts for them.
   for (const [sheepId, quarter] of lockedQuarters) {
      if (!assignments.has(sheepId)) continue;
      result.set(sheepId, quarter);
      if (quarter === q1 || quarter === q2) global[quarter] += 1;
   }

   const shepherdIds = [...byShepherd.keys()].sort();
   for (const shepherdId of shepherdIds) {
      const sheep = byShepherd.get(shepherdId)!.slice().sort();
      const local: Record<number, number> = { [q1]: 0, [q2]: 0 };
      for (const sheepId of sheep) {
         if (result.has(sheepId)) {
            // Locked: count toward this shepherd's local balance.
            const locked = result.get(sheepId)!;
            if (locked === q1 || locked === q2) local[locked] += 1;
         }
      }
      for (const sheepId of sheep) {
         if (result.has(sheepId)) continue; // already placed by lock
         let pick: number;
         if (local[q1] !== local[q2]) {
            pick = local[q1] < local[q2] ? q1 : q2;
         } else {
            pick = global[q1] <= global[q2] ? q1 : q2;
         }
         result.set(sheepId, pick);
         local[pick] += 1;
         global[pick] += 1;
      }
   }
   return result;
}
```

- [ ] **Step 2: Verify types compile**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/scheduling/scheduler.ts
git commit --no-gpg-sign -m "feat: add deterministic schedule generator"
```

---

## Task 4: Draft → review → commit UI

**Files:**
- Modify: `src/stores/people.ts` (add `removeMeetingsForBlock`)
- Rewrite: `src/components/BulkMeetingGenerator.vue`

- [ ] **Step 1: Add `removeMeetingsForBlock` to the store**

In `src/stores/people.ts`, add this action immediately after the `addMeeting` action (after its closing `},` near line 179). It removes every meeting in the given year whose quarter is in `quarters`, from both participants, so commit-replace can clear a block before regenerating.

```ts
      removeMeetingsForBlock(year: number, quarters: number[]) {
         this.people.forEach((person) => {
            person.meetings = person.meetings.filter(
               (m) => !(m.year === year && quarters.includes(m.quarter))
            );
         });
         localStorage.setItem(
            PEOPLE_STORAGE_KEY,
            JSON.stringify(markRaw(this.people))
         );
      },
```

- [ ] **Step 2: Verify the store change compiles**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 3: Rewrite `src/components/BulkMeetingGenerator.vue`**

Replace the entire file contents with:

```vue
<template>
  <q-card class="q-mb-md">
    <q-card-section>
      <div class="text-h6 q-mb-md">📅 Bulk Meeting Generator</div>

      <div class="row q-gutter-md items-end">
        <div class="col-auto">
          <q-option-group
            v-model="quarterPair"
            :options="quarterPairOptions"
            color="primary"
            inline
          />
        </div>

        <div class="col-auto">
          <q-input
            v-model.number="selectedYear"
            type="number"
            :min="new Date().getFullYear()"
            step="1"
            label="Year"
            style="width: 100px"
          />
        </div>

        <div class="col-auto">
          <q-btn
            @click="generate"
            color="primary"
            size="lg"
            :disable="!canGenerate"
            icon="auto_fix_high"
            label="Generate Draft"
          />
        </div>

        <div class="col-auto" v-if="draft">
          <q-btn
            @click="reoptimize"
            color="secondary"
            size="lg"
            icon="refresh"
            label="Re-optimize"
          />
        </div>
      </div>

      <div v-if="!canGenerate" class="q-mt-sm text-caption text-grey-7">
        {{ blockedReason }}
      </div>

      <!-- Draft summary -->
      <div v-if="draft" class="q-mt-md">
        <q-banner dense class="bg-grey-2">
          <span class="text-weight-medium">{{ draft.visits.length }}</span> visits ·
          <span :class="repeatCount > 0 ? 'text-orange-9' : 'text-green-9'">
            {{ repeatCount }} repeat{{ repeatCount === 1 ? '' : 's' }}
          </span>
          · load {{ loadSummary }}
          <span v-if="draft.unassigned.length" class="text-negative">
            · {{ draft.unassigned.length }} unassigned
          </span>
        </q-banner>

        <q-markup-table flat dense class="q-mt-sm">
          <thead>
            <tr>
              <th class="text-left">Person</th>
              <th class="text-left">Shepherd</th>
              <th class="text-left">Quarter</th>
              <th class="text-left">Status</th>
              <th class="text-center">Lock</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="visit in draft.visits" :key="visit.sheepId">
              <td class="text-left">{{ personNameById(visit.sheepId) }}</td>
              <td class="text-left" style="min-width: 160px">
                <q-select
                  dense
                  options-dense
                  emit-value
                  map-options
                  :model-value="visit.shepherdId"
                  :options="shepherdOptions"
                  @update:model-value="(id) => swapShepherd(visit, id)"
                />
              </td>
              <td class="text-left">Q{{ visit.quarter }}</td>
              <td class="text-left">
                <span :class="visit.reason.startsWith('Fresh') ? 'text-green-9' : 'text-orange-9'">
                  {{ visit.reason }}
                </span>
              </td>
              <td class="text-center">
                <q-btn
                  flat
                  round
                  dense
                  :icon="visit.locked ? 'lock' : 'lock_open'"
                  :color="visit.locked ? 'primary' : 'grey-5'"
                  @click="toggleLock(visit)"
                />
              </td>
            </tr>
          </tbody>
        </q-markup-table>

        <div class="q-mt-md">
          <q-btn
            @click="onCommit"
            color="positive"
            icon="event_available"
            label="Commit Schedule"
            :loading="isCommitting"
          />
          <q-btn
            flat
            class="q-ml-sm"
            color="grey"
            label="Discard Draft"
            @click="draft = null"
          />
        </div>
      </div>

      <div v-if="lastResult" class="q-mt-md">
        <q-banner :class="lastResult.success ? 'bg-positive text-white' : 'bg-negative text-white'">
          <template v-slot:avatar>
            <q-icon :name="lastResult.success ? 'check_circle' : 'error'" />
          </template>
          {{ lastResult.message }}
        </q-banner>
      </div>
    </q-card-section>
  </q-card>

  <!-- Replace-or-augment dialog when the block already has meetings -->
  <q-dialog v-model="showCommitDialog">
    <q-card style="min-width: 360px">
      <q-card-section>
        <div class="text-h6">Block already has meetings</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        {{ existingCount }} meeting{{ existingCount === 1 ? '' : 's' }} already exist for
        {{ quarterPair === 'q1-q2' ? 'Q1 & Q2' : 'Q3 & Q4' }} {{ selectedYear }}.
        Replace them with this draft, or add the draft alongside them?
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="grey" v-close-popup />
        <q-btn flat label="Add alongside" color="primary" @click="commit(false)" v-close-popup />
        <q-btn label="Replace" color="negative" @click="commit(true)" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { usePeopleStore } from '@/stores/people';
import { usePeopleById } from '@/composables/usePeopleById';
import { generateSchedule, type LockedVisit } from '@/scheduling/scheduler';
import type { ScheduleDraft, ProposedVisit } from '@/scheduling/types';

interface GenerationResult {
  success: boolean;
  message: string;
}

export default defineComponent({
  name: 'BulkMeetingGenerator',
  setup() {
    const peopleStore = usePeopleStore();
    const { personNameById } = usePeopleById();

    const quarterPair = ref('q1-q2');
    const selectedYear = ref(new Date().getFullYear() + 1);
    const draft = ref<ScheduleDraft | null>(null);
    const lastResult = ref<GenerationResult | null>(null);
    const isCommitting = ref(false);
    const showCommitDialog = ref(false);

    const quarterPairOptions = [
      { label: 'Q1 & Q2', value: 'q1-q2' },
      { label: 'Q3 & Q4', value: 'q3-q4' },
    ];

    const activePeople = computed(() =>
      peopleStore.people.filter((p) => !p.departed)
    );
    const activeShepherds = computed(() =>
      activePeople.value.filter((p) => p.role === 'shepherd')
    );
    const shepherdOptions = computed(() =>
      activeShepherds.value
        .map((s) => ({ label: s.name, value: s.id }))
        .sort((a, b) => a.label.localeCompare(b.label))
    );

    const canGenerate = computed(
      () => activePeople.value.length >= 2 && activeShepherds.value.length >= 1
    );
    const blockedReason = computed(() => {
      if (activePeople.value.length < 2) return 'Need at least 2 active people';
      if (activeShepherds.value.length < 1) return 'Need at least 1 shepherd';
      return '';
    });

    const quartersOf = (): [number, number] =>
      quarterPair.value === 'q1-q2' ? [1, 2] : [3, 4];

    const generate = () => {
      lastResult.value = null;
      draft.value = generateSchedule({
        people: peopleStore.people,
        year: selectedYear.value,
        quarters: quartersOf(),
      });
    };

    const locksFromDraft = (): LockedVisit[] => {
      if (!draft.value) return [];
      return draft.value.visits
        .filter((v) => v.locked)
        .map((v) => ({
          sheepId: v.sheepId,
          shepherdId: v.shepherdId,
          quarter: v.quarter,
        }));
    };

    const reoptimize = () => {
      lastResult.value = null;
      draft.value = generateSchedule({
        people: peopleStore.people,
        year: selectedYear.value,
        quarters: quartersOf(),
        locks: locksFromDraft(),
      });
    };

    const toggleLock = (visit: ProposedVisit) => {
      visit.locked = !visit.locked;
    };

    // Manual swap pins the choice so re-optimize keeps it.
    const swapShepherd = (visit: ProposedVisit, shepherdId: string) => {
      visit.shepherdId = shepherdId;
      visit.locked = true;
      visit.reason = 'Manual choice';
    };

    const repeatCount = computed(
      () => draft.value?.visits.filter((v) => !v.reason.startsWith('Fresh')).length ?? 0
    );

    const loadSummary = computed(() => {
      if (!draft.value) return '';
      const counts = new Map<string, number>();
      for (const v of draft.value.visits) {
        counts.set(v.shepherdId, (counts.get(v.shepherdId) ?? 0) + 1);
      }
      const values = [...counts.values()];
      if (values.length === 0) return '';
      return `${Math.min(...values)}–${Math.max(...values)} per shepherd`;
    });

    const existingCount = computed(() => {
      const [q1, q2] = quartersOf();
      const ids = new Set<string>();
      for (const person of peopleStore.people) {
        for (const m of person.meetings) {
          if (m.year === selectedYear.value && (m.quarter === q1 || m.quarter === q2)) {
            ids.add(m.id);
          }
        }
      }
      return ids.size;
    });

    const onCommit = () => {
      if (existingCount.value > 0) {
        showCommitDialog.value = true;
      } else {
        commit(false);
      }
    };

    const commit = (replace: boolean) => {
      if (!draft.value) return;
      isCommitting.value = true;
      try {
        if (replace) {
          peopleStore.removeMeetingsForBlock(selectedYear.value, quartersOf());
        }
        let created = 0;
        for (const v of draft.value.visits) {
          peopleStore.addMeeting(v.shepherdId, v.sheepId, v.quarter, v.year);
          created++;
        }
        lastResult.value = {
          success: true,
          message: `Committed ${created} meetings for ${
            quarterPair.value === 'q1-q2' ? 'Q1 & Q2' : 'Q3 & Q4'
          } ${selectedYear.value}`,
        };
        draft.value = null;
      } catch (error) {
        lastResult.value = {
          success: false,
          message: `Error committing: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        };
      } finally {
        isCommitting.value = false;
      }
    };

    return {
      quarterPair,
      quarterPairOptions,
      selectedYear,
      draft,
      lastResult,
      isCommitting,
      showCommitDialog,
      shepherdOptions,
      canGenerate,
      blockedReason,
      repeatCount,
      loadSummary,
      existingCount,
      personNameById,
      generate,
      reoptimize,
      toggleLock,
      swapShepherd,
      onCommit,
      commit,
    };
  },
});
</script>
```

- [ ] **Step 4: Verify it compiles**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 6: Manual verification in the running app**

Run: `npm run dev`
Then in the browser (default http://localhost:5173):
1. Go to the People management page.
2. Pick a future year and a quarter pair, click **Generate Draft**.
3. Confirm: every active person appears exactly once; the summary shows a repeat count and a load range; rows flagged "Fresh pair" are green and "Repeat…" are orange.
4. Lock a couple of rows, manually swap one shepherd (it should become locked/"Manual choice"), click **Re-optimize** — locked/manual rows stay, others may change.
5. Click **Commit Schedule**. If meetings already exist for that block, confirm the replace/add dialog appears; otherwise it commits directly. Verify the new meetings show up in the people/reports views.

Expected: all of the above hold. Stop the dev server when done.

- [ ] **Step 7: Commit**

```bash
git add src/stores/people.ts src/components/BulkMeetingGenerator.vue
git commit --no-gpg-sign -m "feat: draft, review, and commit generated schedules"
```

---

## Task 5: Visit network graph

**Files:**
- Create: `src/components/VisitNetworkChart.vue`
- Modify: `src/views/ReportsView.vue`

- [ ] **Step 1: Create `src/components/VisitNetworkChart.vue`**

```vue
<template>
   <div class="visit-network">
      <div class="text-h6 q-mb-sm">🕸️ Visit Network</div>
      <div class="text-caption text-grey-7 q-mb-sm">
         Each line is a past visit between two people; thicker lines mean more
         visits. Orange nodes are shepherds.
      </div>
      <div ref="container" class="network-canvas"></div>
      <div v-if="nodes.length === 0" class="no-data text-center text-grey-6 q-pa-lg">
         <q-icon name="hub" size="xl" />
         <p class="q-mt-md">No visit data available</p>
      </div>
   </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { usePeopleStore } from '@/stores/people';
import { storeToRefs } from 'pinia';
import { PairingGraph } from '@/scheduling/pairingGraph';
import * as d3 from 'd3';

interface GraphNode extends d3.SimulationNodeDatum {
   id: string;
   name: string;
   shepherd: boolean;
   degree: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
   source: string | GraphNode;
   target: string | GraphNode;
   count: number;
}

export default defineComponent({
   name: 'VisitNetworkChart',
   setup() {
      const peopleStore = usePeopleStore();
      const { people } = storeToRefs(peopleStore);
      const container = ref<HTMLElement | null>(null);

      const activeById = computed(() => {
         const map = new Map<string, { name: string; shepherd: boolean }>();
         people.value
            .filter((p) => !p.departed)
            .forEach((p) =>
               map.set(p.id, { name: p.name, shepherd: p.role === 'shepherd' })
            );
         return map;
      });

      const links = computed<GraphLink[]>(() => {
         const graph = new PairingGraph(people.value);
         const result: GraphLink[] = [];
         for (const { a, b, stats } of graph.entries()) {
            // Only edges between two currently-active people.
            if (activeById.value.has(a) && activeById.value.has(b)) {
               result.push({ source: a, target: b, count: stats.count });
            }
         }
         return result;
      });

      const nodes = computed<GraphNode[]>(() => {
         const degree = new Map<string, number>();
         for (const link of links.value) {
            degree.set(link.source as string, (degree.get(link.source as string) ?? 0) + 1);
            degree.set(link.target as string, (degree.get(link.target as string) ?? 0) + 1);
         }
         const result: GraphNode[] = [];
         for (const [id, info] of activeById.value) {
            result.push({
               id,
               name: info.name,
               shepherd: info.shepherd,
               degree: degree.get(id) ?? 0,
            });
         }
         return result;
      });

      let simulation: d3.Simulation<GraphNode, GraphLink> | null = null;

      const draw = () => {
         const el = container.value;
         if (!el || nodes.value.length === 0) return;

         d3.select(el).selectAll('*').remove();

         const width = el.clientWidth || 800;
         const height = 520;

         const svg = d3
            .select(el)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`);

         // Copy data so the simulation can mutate x/y without touching computed refs.
         const nodeData: GraphNode[] = nodes.value.map((n) => ({ ...n }));
         const linkData: GraphLink[] = links.value.map((l) => ({ ...l }));

         const maxCount = d3.max(linkData, (d) => d.count) ?? 1;
         const strokeScale = d3.scaleLinear().domain([1, maxCount]).range([1, 6]);
         const radiusScale = d3
            .scaleSqrt()
            .domain([0, d3.max(nodeData, (d) => d.degree) ?? 1])
            .range([4, 16]);

         simulation = d3
            .forceSimulation<GraphNode>(nodeData)
            .force(
               'link',
               d3
                  .forceLink<GraphNode, GraphLink>(linkData)
                  .id((d) => d.id)
                  .distance(60)
            )
            .force('charge', d3.forceManyBody().strength(-80))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collide', d3.forceCollide<GraphNode>().radius((d) => radiusScale(d.degree) + 2));

         const link = svg
            .append('g')
            .attr('stroke', '#cbd5e1')
            .selectAll('line')
            .data(linkData)
            .enter()
            .append('line')
            .attr('stroke-width', (d) => strokeScale(d.count));

         const node = svg
            .append('g')
            .selectAll('circle')
            .data(nodeData)
            .enter()
            .append('circle')
            .attr('r', (d) => radiusScale(d.degree))
            .attr('fill', (d) => (d.shepherd ? '#ea580c' : '#2563eb'))
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5)
            .call(drag(simulation));

         node.append('title').text((d) => `${d.name} (${d.degree} connections)`);

         simulation.on('tick', () => {
            link
               .attr('x1', (d) => (d.source as GraphNode).x ?? 0)
               .attr('y1', (d) => (d.source as GraphNode).y ?? 0)
               .attr('x2', (d) => (d.target as GraphNode).x ?? 0)
               .attr('y2', (d) => (d.target as GraphNode).y ?? 0);
            node.attr('cx', (d) => d.x ?? 0).attr('cy', (d) => d.y ?? 0);
         });
      };

      const drag = (sim: d3.Simulation<GraphNode, GraphLink>) =>
         d3
            .drag<SVGCircleElement, GraphNode>()
            .on('start', (event, d) => {
               if (!event.active) sim.alphaTarget(0.3).restart();
               d.fx = d.x;
               d.fy = d.y;
            })
            .on('drag', (event, d) => {
               d.fx = event.x;
               d.fy = event.y;
            })
            .on('end', (event, d) => {
               if (!event.active) sim.alphaTarget(0);
               d.fx = null;
               d.fy = null;
            });

      const redraw = () => nextTick(draw);

      onMounted(() => nextTick(draw));
      onUnmounted(() => simulation?.stop());
      watch([nodes, links], redraw, { deep: true });

      return { container, nodes };
   },
});
</script>

<style scoped>
.visit-network {
   width: 100%;
}

.network-canvas {
   width: 100%;
   min-height: 520px;
   border: 1px solid #e0e0e0;
   border-radius: 8px;
   background: #fafafa;
}

.no-data {
   min-height: 200px;
   display: flex;
   flex-direction: column;
   justify-content: center;
   align-items: center;
}
</style>
```

- [ ] **Step 2: Surface it in `src/views/ReportsView.vue`**

Add a new report section after the Completed Meetings section. Change the template block (lines 31-35) from:

```html
      <!-- Completed Meetings Details -->
      <div class="report-section">
         <CompletedMeetings />
      </div>
   </div>
 </template>
```

to:

```html
      <!-- Completed Meetings Details -->
      <div class="report-section">
         <CompletedMeetings />
      </div>

      <!-- Visit Network Graph -->
      <div class="report-section">
         <VisitNetworkChart />
      </div>
   </div>
 </template>
```

Then update the script block. Change the import list and `components` registration to include `VisitNetworkChart`:

```ts
 import PeopleCount from '@/components/PeopleCount.vue';
 import MeetingCount from '@/components/MeetingCount.vue'
 import CompletedMeetings from '@/components/CompletedMeetings.vue';
 import UnshepherdedReport from '@/components/UnshepherdedReport.vue';
 import VisitNetworkChart from '@/components/VisitNetworkChart.vue';

 export default defineComponent({
   components: {
      PeopleCount,
      MeetingCount,
      CompletedMeetings,
      UnshepherdedReport,
      VisitNetworkChart,
   },
 });
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 5: Manual verification**

Run: `npm run dev`
Then open the Reports page and confirm: a force-directed graph renders, shepherds are orange and others blue, node size scales with connections, thicker lines connect pairs that have met more often, hovering a node shows a tooltip, and dragging a node works. Stop the dev server when done.

- [ ] **Step 6: Commit**

```bash
git add src/components/VisitNetworkChart.vue src/views/ReportsView.vue
git commit --no-gpg-sign -m "feat: add visit network graph to reports"
```

---

## Final verification

- [ ] **Step 1: Full type-check and lint**

Run: `npm run type-check && npm run lint`
Expected: both PASS with no errors.

- [ ] **Step 2: Production build sanity**

Run: `npm run build`
Expected: build completes without type or bundling errors.
