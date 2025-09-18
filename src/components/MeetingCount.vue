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
               <q-list separator>
                  <q-item v-for="shepherd in shepherdsMeetingsCount" :key="shepherd.name">
                     <q-item-section avatar>
                        <q-avatar color="deep-orange-6" text-color="white" icon="person" />
                     </q-item-section>
                     
                     <q-item-section>
                        <q-item-label class="text-weight-bold">{{ shepherd.name }}</q-item-label>
                        <q-item-label caption>
                           Total: {{ shepherd.totalMeetings }} meetings
                        </q-item-label>
                     </q-item-section>
                     
                     <q-item-section side>
                        <div class="row q-gutter-xs">
                           <q-chip 
                              color="orange" 
                              text-color="white" 
                              size="sm"
                              icon="schedule"
                           >
                              {{ shepherd.activeMeetings }}
                           </q-chip>
                           <q-chip 
                              color="green" 
                              text-color="white" 
                              size="sm"
                              icon="check"
                           >
                              {{ shepherd.completedMeetings }}
                           </q-chip>
                        </div>
                     </q-item-section>
                  </q-item>
               </q-list>
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
         const years = [2023, 2024, 2025];
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

      const shepherdsMeetingsCount = computed(() => {
         const shepherds = people.value.filter(person => person.role === 'shepherd');

         return shepherds.map(shepherd => {
            const meetings = shepherd.meetings.filter(meeting =>
               meeting.shepherdId !== meeting.sheepId
            );

            return {
               name: shepherd.name,
               activeMeetings: meetings.filter(m => !m.completed).length,
               completedMeetings: meetings.filter(m => m.completed).length,
               totalMeetings: meetings.length
            };
         });
      });

      const currentYear = new Date().getFullYear();
      const selectedYear = ref(currentYear.toString());

      return {
         totalMeetingsCount,
         meetingsByYear,
         quarterLabel,
         shepherdsMeetingsCount,
         selectedYear
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
</style>
