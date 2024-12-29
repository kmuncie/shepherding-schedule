<template>
   <div>
      <h2>Total Meetings: {{ totalMeetingsCount.total }}</h2>
      <p>
         Active: {{ totalMeetingsCount.active }},
         Completed: {{ totalMeetingsCount.completed }}
         <small>(Includes 53 meetings completed in 2022 Q4 - 2023 Q1)</small>
      </p>
      <div v-for="(yearData, year) in meetingsByYear" :key="year">
         <h3>{{ year }}</h3>
         <div v-for="(counts, quarter) in yearData" :key="quarter">
            <p>{{ quarterLabel(quarter) }}: {{ counts.active }} active, {{ counts.completed }} completed</p>
         </div>
      </div>
      <h2>Shepherd Meetings Count</h2>
      <ul>
         <li v-for="shepherd in shepherdsMeetingsCount" :key="shepherd.name">
            {{ shepherd.name }}: {{ shepherd.activeMeetings }} active, {{ shepherd.completedMeetings }} completed
         </li>
      </ul>
   </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
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

      return {
         totalMeetingsCount,
         meetingsByYear,
         quarterLabel,
         shepherdsMeetingsCount
      };
   },
});
</script>

<style scoped>
h2 {
   margin-bottom: 0;
}
</style>
