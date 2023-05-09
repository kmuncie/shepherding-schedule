<template>
   <div>
      <h3>Uncompleted Meetings</h3>
      <ul>
         <li v-for="shepherd in shepherds" :key="shepherd.id">
            <strong>{{ shepherd.name }}:</strong>
            <ul>
               <li v-for="meeting in shepherd.uncompletedMeetings" :key="meeting.id">
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

      return {
         shepherds,
      };
   },
});
</script>
