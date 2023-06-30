<template>
<div>
   <h3>Completed Meetings</h3>
   <p>Shepherded: {{ completedMeetingsCount }}</p>
   <ul>
      <li v-for="shepherd in shepherds" :key="shepherd.id">
         <strong>{{ shepherd.name }}:</strong>
         <ul>
            <li v-for="meeting in shepherd.completedMeetings" :key="meeting.id">
               <q-chip>
                  {{ meeting.partnerName }} ({{ meeting.partnerLocation }}) - Q{{ meeting.quarter }} {{ meeting.year }}
               </q-chip>
            </li>
         </ul>
      </li>
   </ul>
</div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { usePeopleStore } from '@/stores/people';

export default defineComponent({
   setup() {
      const peopleStore = usePeopleStore();

      const shepherds = computed(() => {
         const shepherdsWithCompletedMeetings = peopleStore.people
            .filter((person) => person.role === 'shepherd')
            .map((shepherd) => {
               const completedMeetings = shepherd.meetings.filter(
                  (meeting) => meeting.completed && meeting.shepherdId === shepherd.id
               );
               const mappedMeetings = completedMeetings.map((meeting) => {
                  const partner = peopleStore.people.find((person) => person.id === meeting.sheepId);
                  return {
                     ...meeting,
                     partnerName: partner?.name,
                     partnerLocation: partner?.location,
                  };
               });

               return {
                  ...shepherd,
                  completedMeetings: mappedMeetings,
               };
            });

         return shepherdsWithCompletedMeetings;
      });

      const completedMeetingsCount = computed(() => {
         let count = 0;
         for (let shepherd of shepherds.value) {
            count += shepherd.completedMeetings.length;
         }
         return count;
      });

      return {
         shepherds,
         completedMeetingsCount
      };
   },
});
</script>
