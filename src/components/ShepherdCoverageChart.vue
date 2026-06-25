<template>
   <div class="coverage-chart">
      <div class="text-h6 q-mb-sm">📊 Shepherd Coverage</div>
      <div class="text-caption text-grey-7 q-mb-md">
         How much of the flock each shepherd has visited at least once — distinct
         active people visited out of everyone they could visit (colored), plus a
         gray segment for people they visited who have since departed. Sorted by
         active coverage.
      </div>

      <div v-if="coverage.length === 0" class="no-data text-center text-grey-6 q-pa-lg">
         <q-icon name="bar_chart" size="xl" />
         <p class="q-mt-md">No shepherd data available</p>
      </div>

      <div v-else class="coverage-rows">
         <div v-for="row in coverage" :key="row.id" class="coverage-row">
            <div class="coverage-name" :title="row.name">{{ row.name }}</div>
            <div class="coverage-track">
               <div
                  class="coverage-fill"
                  :style="{ width: row.activePercent + '%', backgroundColor: barColor(row.activePercent) }"
               ></div>
               <div
                  v-if="row.departedPercent > 0"
                  class="coverage-fill coverage-fill--departed"
                  :style="{ width: row.departedPercent + '%' }"
                  :title="`${row.departedCount} departed`"
               ></div>
            </div>
            <div class="coverage-value">
               {{ row.activeCount }} / {{ row.total }}
               <span class="text-weight-bold">({{ Math.round(row.activePercent) }}%)</span>
               <span v-if="row.departedCount > 0" class="coverage-departed-note">
                  +{{ row.departedCount }} departed
               </span>
            </div>
         </div>
      </div>
   </div>
</template>

<script lang="ts">
// Horizontal bar chart of per-shepherd flock coverage: the share of visitable
// people each shepherd has visited at least once (colored), with an extra gray
// segment for people they visited who have since departed. Sorted high to low.
import { defineComponent, computed } from 'vue';
import { usePeopleStore } from '@/stores/people';
import { storeToRefs } from 'pinia';

interface CoverageRow {
   id: string;
   name: string;
   activeCount: number;
   departedCount: number;
   total: number;
   activePercent: number;
   departedPercent: number;
}

export default defineComponent({
   name: 'ShepherdCoverageChart',
   setup() {
      const peopleStore = usePeopleStore();
      const { people } = storeToRefs(peopleStore);

      const coverage = computed<CoverageRow[]>(() => {
         const active = people.value.filter((p) => !p.departed);
         const visitable = active.filter((p) => !p.excludeAsSheep);
         const visitableIds = new Set(visitable.map((p) => p.id));
         const departedIds = new Set(
            people.value.filter((p) => p.departed).map((p) => p.id)
         );
         const shepherds = active.filter((p) => p.role === 'shepherd');

         // shepherdId -> sets of distinct active and departed people visited
         const activeVisited = new Map<string, Set<string>>();
         const departedVisited = new Map<string, Set<string>>();
         const add = (map: Map<string, Set<string>>, key: string, value: string) => {
            let set = map.get(key);
            if (!set) {
               set = new Set();
               map.set(key, set);
            }
            set.add(value);
         };

         const seen = new Set<string>();
         for (const person of people.value) {
            for (const m of person.meetings ?? []) {
               if (seen.has(m.id)) continue;
               seen.add(m.id);
               if (m.shepherdId === m.sheepId) continue;
               if (visitableIds.has(m.sheepId)) {
                  add(activeVisited, m.shepherdId, m.sheepId);
               } else if (departedIds.has(m.sheepId)) {
                  add(departedVisited, m.shepherdId, m.sheepId);
               }
            }
         }

         return shepherds
            .map((s) => {
               const activeCount = activeVisited.get(s.id)?.size ?? 0;
               const departedCount = departedVisited.get(s.id)?.size ?? 0;
               // Everyone they could currently visit (visitable people minus self).
               const total = visitable.length - (visitableIds.has(s.id) ? 1 : 0);
               // Both segments share the same per-person scale so they're comparable.
               const activePercent = total > 0 ? (activeCount / total) * 100 : 0;
               const departedPercent = total > 0 ? (departedCount / total) * 100 : 0;
               return {
                  id: s.id,
                  name: s.name,
                  activeCount,
                  departedCount,
                  total,
                  activePercent,
                  departedPercent,
               };
            })
            .sort(
               (a, b) =>
                  b.activePercent - a.activePercent ||
                  b.activeCount - a.activeCount ||
                  a.name.localeCompare(b.name)
            );
      });

      // Low coverage leans red, high leans green, to make gaps stand out.
      const barColor = (percent: number) => {
         const hue = Math.round((percent / 100) * 120); // 0=red -> 120=green
         return `hsl(${hue}, 65%, 45%)`;
      };

      return { coverage, barColor };
   },
});
</script>

<style scoped>
.coverage-chart {
   width: 100%;
}

.coverage-rows {
   display: flex;
   flex-direction: column;
   gap: 0.4rem;
}

.coverage-row {
   display: flex;
   align-items: center;
   gap: 0.75rem;
}

.coverage-name {
   flex: 0 0 11rem;
   max-width: 11rem;
   overflow: hidden;
   text-overflow: ellipsis;
   white-space: nowrap;
   font-weight: 600;
   text-align: right;
}

.coverage-track {
   flex: 1 1 auto;
   display: flex;
   height: 1.1rem;
   background: #eceff1;
   border-radius: 4px;
   overflow: hidden;
}

.coverage-fill {
   height: 100%;
   transition: width 0.3s ease;
}

.coverage-fill--departed {
   background-color: #b0bec5;
}

.coverage-value {
   flex: 0 0 10rem;
   font-size: 0.85rem;
   color: #455a64;
   white-space: nowrap;
}

.coverage-departed-note {
   color: #90a4ae;
}

.no-data {
   min-height: 160px;
   display: flex;
   flex-direction: column;
   justify-content: center;
   align-items: center;
}

@media (max-width: 600px) {
   .coverage-name {
      flex-basis: 6rem;
      max-width: 6rem;
   }
   .coverage-value {
      flex-basis: 8rem;
   }
}
</style>
