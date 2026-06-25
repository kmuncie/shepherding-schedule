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
