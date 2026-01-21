<template>
   <div class="meeting-count-container">
      <!-- Meeting Statistics Overview -->
      <q-card class="q-mb-md">
         <q-card-section>
            <div class="row items-center q-mb-md">
               <q-icon name="event" size="sm" color="primary" class="q-mr-sm" />
               <span class="text-h6">Meeting Statistics</span>
            </div>

            <div class="stats-row">
               <div class="stat-item">
                  <div class="stat-number text-h3 text-weight-bold text-primary">{{ totalMeetingsCount.total }}</div>
                  <div class="stat-label text-subtitle2 text-grey-7">Total Meetings</div>
               </div>
               <q-separator vertical inset />
               <div class="stat-item">
                  <div class="stat-number text-h4 text-weight-bold text-orange">{{ totalMeetingsCount.active }}</div>
                  <div class="stat-label text-subtitle2 text-grey-7">Active</div>
               </div>
               <q-separator vertical inset />
               <div class="stat-item">
                  <div class="stat-number text-h4 text-weight-bold text-green">{{ totalMeetingsCount.completed }}</div>
                  <div class="stat-label text-subtitle2 text-grey-7">Completed</div>
               </div>
            </div>

            <q-banner class="bg-blue-1 q-mt-md" dense>
               <template v-slot:avatar>
                  <q-icon name="info" color="blue" />
               </template>
               <span class="text-caption">Includes 53 meetings completed in 2022 Q4 - 2023 Q1</span>
            </q-banner>
         </q-card-section>
      </q-card>

      <!-- Meetings by Year Accordion -->
      <q-expansion-item
         icon="calendar_month"
         label="Meetings by Quarter"
         header-class="text-subtitle1"
         class="q-mb-md"
      >
         <q-card>
            <q-card-section>
               <q-tabs
                  v-model="selectedYear"
                  dense
                  class="text-grey"
                  active-color="primary"
                  indicator-color="primary"
                  align="justify"
               >
                  <q-tab v-for="year in Object.keys(meetingsByYear)" :key="year" :name="year" :label="year" />
               </q-tabs>

               <q-separator />

               <q-tab-panels v-model="selectedYear" animated>
                  <q-tab-panel v-for="(yearData, year) in meetingsByYear" :key="year" :name="year">
                     <div class="quarters-grid">
                        <q-card v-for="(counts, quarter) in yearData" :key="quarter" flat bordered>
                           <q-card-section class="text-center">
                              <div class="text-subtitle2 text-weight-bold q-mb-sm">{{ quarterLabel(quarter) }}</div>
                              <div class="row justify-center q-gutter-sm">
                                 <q-chip color="orange" text-color="white" icon="schedule">
                                    {{ counts.active }} Active
                                 </q-chip>
                                 <q-chip color="green" text-color="white" icon="check_circle">
                                    {{ counts.completed }} Done
                                 </q-chip>
                              </div>
                           </q-card-section>
                        </q-card>
                     </div>
                  </q-tab-panel>
               </q-tab-panels>
            </q-card-section>
         </q-card>
      </q-expansion-item>

      <!-- Shepherd Performance Accordion -->
      <q-expansion-item
         icon="person"
         label="Shepherd Performance"
         header-class="text-subtitle1"
      >
         <q-card>
            <q-card-section>
               <q-tabs
                  v-model="performanceYear"
                  dense
                  class="text-grey q-mb-md"
                  active-color="primary"
                  indicator-color="primary"
                  align="justify"
               >
                  <q-tab v-for="year in availableYears" :key="year" :name="year" :label="String(year)" />
               </q-tabs>

               <div class="shepherds-performance-grid">
                  <div v-for="shepherd in shepherdsQuarterlyData" :key="shepherd.name" class="shepherd-card">
                     <div class="shepherd-header">
                        <q-avatar color="deep-orange-6" text-color="white" size="sm" icon="person" />
                        <span class="text-weight-bold q-ml-sm">{{ shepherd.name }}</span>
                        <q-chip color="green" text-color="white" size="xs" class="q-ml-auto">
                           {{ shepherd.yearTotal }} total
                        </q-chip>
                     </div>
                     <div class="quarters-bar-chart">
                        <div v-for="q in [1, 2, 3, 4]" :key="q" class="quarter-bar-container">
                           <div class="quarter-label">Q{{ q }}</div>
                           <div class="bar-track">
                              <div
                                 class="bar-fill"
                                 :style="{ width: getBarWidth(shepherd.quarters[q]) }"
                              ></div>
                           </div>
                           <div class="bar-value">{{ shepherd.quarters[q] }}</div>
                        </div>
                     </div>
                  </div>
               </div>

               <div v-if="shepherdsQuarterlyData.length === 0" class="text-center text-grey-6 q-pa-md">
                  No shepherd data available
               </div>
            </q-card-section>
         </q-card>
      </q-expansion-item>
   </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import { usePeopleStore } from '@/stores/people';
import { storeToRefs } from 'pinia';

interface QuarterCounts {
   active: number;
   completed: number;
}

type YearData = {
   [key: string]: QuarterCounts;
};

export default defineComponent({
   setup() {
      const peopleStore = usePeopleStore();
      const { people } = storeToRefs(peopleStore);

      const totalMeetingsCount = computed(() => {
         const oldMeetings = 53; // Meetings completed in 2022 Q4 - 2023 Q1

         // Track counts directly instead of storing IDs
         let totalCount = 0;
         let completedCount = 0;
         let activeCount = 0;
         const countedMeetings = new Set<string>(); // Still need this to avoid double-counting

         people.value.forEach(person => {
            if (person.role === 'shepherd') {
               person.meetings.forEach(meeting => {
                  if (meeting.shepherdId !== meeting.sheepId && !countedMeetings.has(meeting.id)) {
                     countedMeetings.add(meeting.id);
                     totalCount++;
                     if (meeting.completed) {
                        completedCount++;
                     } else {
                        activeCount++;
                     }
                  }
               });
            }
         });

         return {
            total: totalCount + oldMeetings,
            active: activeCount,
            completed: completedCount + oldMeetings
         };
      });

      const meetingsByYear = computed(() => {
         const years = [2023, 2024, 2025, 2026];
         const yearData: Record<number, YearData> = {};
         const countedMeetings = new Set<string>();

         // Initialize the data structure
         years.forEach(year => {
            yearData[year] = {
               Q1: { active: 0, completed: 0 },
               Q2: { active: 0, completed: 0 },
               Q3: { active: 0, completed: 0 },
               Q4: { active: 0, completed: 0 }
            };
         });

         people.value.forEach(person => {
            if (person.role === 'shepherd') {
               person.meetings.forEach(meeting => {
                  if (!countedMeetings.has(meeting.id) && meeting.shepherdId !== meeting.sheepId) {
                     const year = meeting.year;
                     const quarter = `Q${meeting.quarter}`;

                     if (yearData[year]) {
                        if (meeting.completed) {
                           yearData[year][quarter].completed++;
                        } else {
                           yearData[year][quarter].active++;
                        }
                        countedMeetings.add(meeting.id);
                     }
                  }
               });
            }
         });

         return yearData;
      });

      const quarterLabel = (quarter: string | number) => {
         const quarterStr = quarter.toString();
         return `Quarter ${quarterStr.slice(1)}`;
      };

      const availableYears = [2023, 2024, 2025, 2026];
      const currentYear = new Date().getFullYear();
      const selectedYear = ref(currentYear.toString());
      const performanceYear = ref(currentYear);

      const shepherdsQuarterlyData = computed(() => {
         const shepherds = people.value.filter(person => person.role === 'shepherd');
         const year = performanceYear.value;

         return shepherds.map(shepherd => {
            const quarters: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

            shepherd.meetings.forEach(meeting => {
               if (
                  meeting.shepherdId !== meeting.sheepId &&
                  meeting.completed &&
                  meeting.year === year
               ) {
                  quarters[meeting.quarter]++;
               }
            });

            const yearTotal = quarters[1] + quarters[2] + quarters[3] + quarters[4];

            return {
               name: shepherd.name,
               quarters,
               yearTotal
            };
         }).sort((a, b) => b.yearTotal - a.yearTotal);
      });

      const maxMeetingsInQuarter = computed(() => {
         let max = 1;
         shepherdsQuarterlyData.value.forEach(shepherd => {
            for (let q = 1; q <= 4; q++) {
               if (shepherd.quarters[q] > max) {
                  max = shepherd.quarters[q];
               }
            }
         });
         return max;
      });

      const getBarWidth = (count: number) => {
         if (count === 0) return '0%';
         const percentage = (count / maxMeetingsInQuarter.value) * 100;
         return `${Math.max(percentage, 5)}%`;
      };

      return {
         totalMeetingsCount,
         meetingsByYear,
         quarterLabel,
         shepherdsQuarterlyData,
         selectedYear,
         performanceYear,
         availableYears,
         getBarWidth
      };
   },
});
</script>

<style scoped>
.meeting-count-container {
   margin-bottom: 2rem;
}

.stats-row {
   display: flex;
   justify-content: space-around;
   align-items: center;
   padding: 1rem 0;
}

.stat-item {
   text-align: center;
   flex: 1;
}

.stat-number {
   margin-bottom: 0.25rem;
}

.quarters-grid {
   display: grid;
   grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
   gap: 1rem;
   margin-top: 1rem;
}

.shepherds-performance-grid {
   display: grid;
   grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
   gap: 1rem;
}

.shepherd-card {
   background: #f8f9fa;
   border-radius: 8px;
   padding: 1rem;
}

.shepherd-header {
   display: flex;
   align-items: center;
   margin-bottom: 0.75rem;
}

.quarters-bar-chart {
   display: flex;
   flex-direction: column;
   gap: 0.5rem;
}

.quarter-bar-container {
   display: flex;
   align-items: center;
   gap: 0.5rem;
}

.quarter-label {
   width: 24px;
   font-size: 0.75rem;
   font-weight: 600;
   color: #666;
}

.bar-track {
   flex: 1;
   height: 16px;
   background: #e0e0e0;
   border-radius: 4px;
   overflow: hidden;
}

.bar-fill {
   height: 100%;
   background: linear-gradient(90deg, #4caf50, #81c784);
   border-radius: 4px;
   transition: width 0.3s ease;
}

.bar-value {
   width: 20px;
   font-size: 0.75rem;
   font-weight: 600;
   text-align: right;
   color: #333;
}
</style>
