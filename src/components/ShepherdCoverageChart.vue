<template>
   <div class="coverage-chart">
      <div class="text-h6 q-mb-sm">📊 Shepherd Coverage</div>
      <div class="text-caption text-grey-7 q-mb-md">
         How much of the flock each shepherd has visited at least once — distinct
         people visited out of everyone they could visit. Sorted by coverage.
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
                  :style="{ width: row.percent + '%', backgroundColor: barColor(row.percent) }"
               ></div>
            </div>
            <div class="coverage-value">
               {{ row.count }} / {{ row.total }}
               <span class="text-weight-bold">({{ row.percent }}%)</span>
            </div>
         </div>
      </div>
   </div>
</template>

<script lang="ts">
// Horizontal bar chart of per-shepherd flock coverage: the share of visitable
// people each shepherd has visited at least once, sorted high to low.
import { defineComponent, computed } from 'vue';
import { usePeopleStore } from '@/stores/people';
import { storeToRefs } from 'pinia';

interface CoverageRow {
   id: string;
   name: string;
   count: number;
   total: number;
   percent: number;
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
         const shepherds = active.filter((p) => p.role === 'shepherd');

         // shepherdId -> set of distinct visitable people they've visited
         const visited = new Map<string, Set<string>>();
         const seen = new Set<string>();
         for (const person of people.value) {
            for (const m of person.meetings ?? []) {
               if (seen.has(m.id)) continue;
               seen.add(m.id);
               if (m.shepherdId === m.sheepId) continue;
               if (!visitableIds.has(m.sheepId)) continue;
               let set = visited.get(m.shepherdId);
               if (!set) {
                  set = new Set();
                  visited.set(m.shepherdId, set);
               }
               set.add(m.sheepId);
            }
         }

         return shepherds
            .map((s) => {
               const count = visited.get(s.id)?.size ?? 0;
               // Everyone they could visit (visitable people minus themselves).
               const total = visitable.length - (visitableIds.has(s.id) ? 1 : 0);
               const percent = total > 0 ? Math.round((count / total) * 100) : 0;
               return { id: s.id, name: s.name, count, total, percent };
            })
            .sort(
               (a, b) =>
                  b.percent - a.percent ||
                  b.count - a.count ||
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
   height: 1.1rem;
   background: #eceff1;
   border-radius: 4px;
   overflow: hidden;
}

.coverage-fill {
   height: 100%;
   border-radius: 4px;
   transition: width 0.3s ease;
   min-width: 2px;
}

.coverage-value {
   flex: 0 0 7.5rem;
   font-size: 0.85rem;
   color: #455a64;
   white-space: nowrap;
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
      flex-basis: 6rem;
   }
}
</style>
