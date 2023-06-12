<template>
   <div class="shepherds-list">
      <h2>👨🏻‍🌾 Shepherds</h2>
      <div class="shepherds-grid">
         <q-card class="full-width shadow-up-2" v-for="shepherd in sortedShepherds" :key="shepherd.id">
            <q-card-section>
               <h3 class="q-ma-none">{{ shepherd.name }}</h3>
               <p class="text-subtitle1 q-ma-none">{{ shepherd.location }}</p>
            </q-card-section>
            <ul v-if="shepherd.meetings && shepherd.meetings.length > 0" class="q-ma-none">
               <li v-for="meeting in shepherd.meetings" :key="meeting.id">
                  <div
                     @click="() => { meeting.completed = !meeting.completed; updateMeetingCompletion(shepherd.id, meeting.id, meeting.completed); }">
                     <q-chip square :class="[ meeting.completed ? 'bg-green-2' : 'text-red-10' ]"
                        :removable="meeting.shepherdId === shepherd.id" @remove="removeMeeting(shepherd.id, meeting.id)">
                        Q{{ meeting.quarter }} {{ meeting.year }} - {{ getPersonNameById(meeting.sheepId) }}
                        <q-icon v-if="meeting.completed" name="check_circle" class="q-ml-xs" />
                     </q-chip>
                  </div>
               </li>
            </ul>
         </q-card>
      </div>
   </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { usePeopleStore } from '@/stores/people';

export default defineComponent({
   setup() {
      const peopleStore = usePeopleStore();

      const shepherds = peopleStore.$state.people.filter((person) => person.role === 'shepherd');

      const sortedShepherds = computed(() => {
         return shepherds.slice().sort((a, b) => a.name.localeCompare(b.name));
      });

      const getPersonNameById = (id: string) => {
         const person = peopleStore.$state.people.find((person) => person.id === id);
         return person ? person.name : '';
      };

      const updateMeetingCompletion = (personId: string, meetingId: string, completed: boolean) => {
         peopleStore.updateMeetingCompletion(personId, meetingId, completed);
      };

      const removeMeeting = (shepherdId: string, meetingId: string) => {
         peopleStore.removeMeeting(shepherdId, meetingId);
      };

      return {
         shepherds,
         sortedShepherds,
         updateMeetingCompletion,
         removeMeeting,
         getPersonNameById,
      };
   },
});
</script>

<style lang="scss" scoped>
.shepherds-grid {
   display: grid;
   grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
   grid-gap: 20px;
   margin: 20px;
}

ul {
   padding: 0;

   li {
      list-style-type: none;
   }
}
</style>
