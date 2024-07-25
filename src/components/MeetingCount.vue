<template>
   <div>
      <h2>Total Meetings: {{ totalMeetingsCount }}</h2>
      <small>(Includes 53 meetings completed in 2022 Q4 - 2023 Q1)</small>
      <div v-for="(yearData, year) in meetingsByYear" :key="year">
         <h3>{{ year }}</h3>
         <div v-for="(count, quarter) in yearData" :key="quarter">
            <p>{{ quarterLabel(quarter) }}: {{ count }}</p>
         </div>
      </div>
      <h2>Shepherd Meetings Count</h2>
      <ul>
         <li v-for="shepherd in shepherdsMeetingsCount" :key="shepherd.name">
            {{ shepherd.name }}: {{ shepherd.meetingsCount }} meetings
         </li>
      </ul>
   </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { usePeopleStore } from '@/stores/people'; // Adjust the import path as necessary

 // Define the YearData type
 type YearData = {
   [key: string]: number;
 };

export default defineComponent({
   setup() {
      const peopleStore = usePeopleStore();

      const totalMeetingsCount = computed(() => {
         const oldMeetings = 53; // Meetings completed in 2022 Q4 - 2023 Q1
         let currentMeetings = 0;

         // Use the same counting logic as in meetingsByYear
         const countedMeetings = new Set<string>();

         peopleStore.people.forEach(person => {
            if (person.role === 'shepherd') {
               person.meetings.forEach(meeting => {
                  if (!countedMeetings.has(meeting.id) && meeting.shepherdId !== meeting.sheepId) {
                     currentMeetings++;
                     countedMeetings.add(meeting.id);
                  }
               });
            }
         });

         return currentMeetings + oldMeetings;
      });

      const meetingsByYear = computed(() => {
         const years = [2023, 2024];
         const yearData: Record<number, YearData> = {};

         years.forEach(year => {
            yearData[year] = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
         });

         // Use a Set to keep track of counted meeting IDs
         const countedMeetings = new Set<string>();

         peopleStore.people.forEach(person => {
            if (person.role === 'shepherd') {
               person.meetings.forEach(meeting => {
                  // Only count the meeting if it hasn't been counted before
                  if (!countedMeetings.has(meeting.id) && meeting.shepherdId !== meeting.sheepId) {
                     const year = meeting.year;
                     if (yearData[year]) {
                        yearData[year][`Q${meeting.quarter}`]++;
                        countedMeetings.add(meeting.id);
                     }
                  }
               });
            }
         });

         return yearData;
      });

      const quarterLabel = (quarter: any) => {
         return `Quarter ${quarter.slice(1)}`;
      };

      const shepherdsMeetingsCount = computed(() => {
         const shepherds = peopleStore.people.filter(person => person.role === 'shepherd');

         return shepherds.map(shepherd => {
            const validMeetingsCount = shepherd.meetings.filter(meeting => meeting.shepherdId !== meeting.sheepId).length;
            return {
               name: shepherd.name,
               meetingsCount: validMeetingsCount
            };
         });
      });

      return { totalMeetingsCount, meetingsByYear, quarterLabel, shepherdsMeetingsCount };
   },
});
</script>

<style scoped>
h2 {
   margin-bottom: 0;
}

/* Add any necessary styles here */
</style>
