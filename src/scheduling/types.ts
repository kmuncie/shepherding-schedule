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
