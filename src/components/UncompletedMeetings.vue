<template>
   <div>
      <h3>Uncompleted Meetings</h3>
      <div v-for="(meetingGroup, quarterYear) in groupedMeetings" :key="quarterYear">
         <h4 class="q-pa-sm q-mb-md bg-primary text-white rounded-borders">{{ quarterYear }}</h4>
         <ul>
            <li v-for="shepherd in meetingGroup" :key="shepherd.id">
               <strong>{{ shepherd.name }}:</strong>
               <ul>
                  <li v-for="meeting in shepherd.uncompletedMeetings" :key="meeting.id">
                     <q-chip>
                        {{ meeting.partnerName }} ({{ meeting.partnerLocation }})
                     </q-chip>
                  </li>
               </ul>
            </li>
         </ul>
      </div>
   </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { usePeopleStore } from '@/stores/people';

export default defineComponent({
   setup() {
      const peopleStore = usePeopleStore();

      const shepherds = computed(() => {
         const shepherdsWithUncompletedMeetings = peopleStore.people
            .filter((person) => person.role === 'shepherd')
            .map((shepherd) => {
               const uncompletedMeetings = shepherd.meetings.filter(
                  (meeting) => !meeting.completed && meeting.shepherdId === shepherd.id
               );
               const mappedMeetings = uncompletedMeetings.map((meeting) => {
                  const partner = peopleStore.people.find((person) => person.id === meeting.sheepId);
                  return {
                     ...meeting,
                     partnerName: partner?.name,
                     partnerLocation: partner?.location,
                  };
               });
               return {
                  ...shepherd,
                  uncompletedMeetings: mappedMeetings,
               };
            });
         return shepherdsWithUncompletedMeetings;
      });

      const groupedMeetings = computed(() => {
         const grouped: { [key: string]: any[] } = {};

         shepherds.value.forEach((shepherd) => {
            shepherd.uncompletedMeetings.forEach((meeting) => {
               const quarterYear = `Q${meeting.quarter} ${meeting.year}`;
               if (!grouped[quarterYear]) {
                  grouped[quarterYear] = [];
               }
               let existingShepherd = grouped[quarterYear].find(s => s.id === shepherd.id);
               if (!existingShepherd) {
                  existingShepherd = { ...shepherd, uncompletedMeetings: [] };
                  grouped[quarterYear].push(existingShepherd);
               }
               existingShepherd.uncompletedMeetings.push(meeting);
            });
         });

         // Sort the quarter-year keys in ascending order
         const sortedKeys = Object.keys(grouped).sort((a, b) => {
            const [aQ, aY] = a.split(' ');
            const [bQ, bY] = b.split(' ');
            return aY === bY ? aQ.localeCompare(bQ) : Number(aY) - Number(bY);
         });

         // Create a new object with sorted keys
         const sortedGrouped: { [key: string]: any[] } = {};
         sortedKeys.forEach((key) => {
            sortedGrouped[key] = grouped[key];
         });

         return sortedGrouped;
      });

      return {
         groupedMeetings,
      };
   },
});
</script>

<style scoped></style>
