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
   const quarterBySheep = assignQuarters(assignments, quarters, lockedQuarters);

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
      if (best === null || cost < bestCost) {
         bestCost = cost;
         best = s.id;
         continue;
      }
      // Tie-break: spread work by preferring the least-loaded shepherd (the load
      // term is flat within the fair-share band, so equal-cost ties are common),
      // then by id for determinism.
      if (cost === bestCost) {
         const sLoad = ctx.assignedCounts.get(s.id) ?? 0;
         const bestLoad = ctx.assignedCounts.get(best) ?? 0;
         if (sLoad < bestLoad || (sLoad === bestLoad && s.id < best)) {
            best = s.id;
         }
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
