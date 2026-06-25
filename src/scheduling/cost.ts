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
