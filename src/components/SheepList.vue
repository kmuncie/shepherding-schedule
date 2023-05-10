<template>
   <div>
      <h2>🐑 Sheep</h2>
      <div class="sheep-grid">
         <q-card class="full-width shadow-up-2" v-for="sheep in sortedSheep" :key="sheep.id">
            <q-card-section>
               <h3 class="q-ma-none">
                  <span v-if="sheep.role === 'shepherd'">👨🏻‍🌾 </span>
                  {{ sheep.name }}
               </h3>
               <p class="text-subtitle1 q-ma-none">{{ sheep.location }}</p>
            </q-card-section>
            <ul v-if="sheep.meetings && sheep.meetings.length > 0" class="q-ma-none">
               <li v-for="meeting in getFilteredMeetings(sheep.id)" :key="meeting.id">
                  <div
                     @click="() => { meeting.completed = !meeting.completed; updateMeetingCompletion(sheep.id, meeting.id, meeting.completed); }">
                     <q-chip square :class="{ 'text-red-10': !meeting.completed }">
                        Q{{ meeting.quarter }} {{ meeting.year }} - {{ getPersonNameById(meeting.shepherdId) }}
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

      const sheepList = peopleStore.$state.people.filter((person) => person.role !== 'Overseer');

      const sortedSheep = computed(() => {
         return sheepList.slice().sort((a, b) => a.name.localeCompare(b.name));
      });

      const getFilteredMeetings = (sheepId: string) => {
         const sheep = peopleStore.$state.people.find((person) => person.id === sheepId);

         if (!sheep || !sheep.meetings) {
            return [];
         }

         return sheep.meetings.filter((meeting) => {
            const shepherdName = getPersonNameById(meeting.shepherdId);
            return shepherdName !== sheep.name;
         });
      };

      const getShepherdName = (shepherdId: string) => {
         const shepherd = peopleStore.$state.people.find((person) => person.id === shepherdId);
         return shepherd ? shepherd.name : 'Unknown';
      };

      const getPersonNameById = (id: string) => {
         const person = peopleStore.$state.people.find((person) => person.id === id);
         return person ? person.name : '';
      };

      const updateMeetingCompletion = (sheepId: string, meetingId: string, completed: boolean) => {
         peopleStore.updateMeetingCompletion(sheepId, meetingId, completed);
      };

      return {
         sheepList,
         sortedSheep,
         getShepherdName,
         getPersonNameById,
         updateMeetingCompletion,
         getFilteredMeetings,
      };
   },
});
</script>

<style lang="scss" scoped>
.sheep-grid {
   display: grid;
   grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
   grid-gap: 20px;
   margin: 20px;
}

ul {
   padding: 0;

   li {
      display: flex;
      align-items: center;
      list-style-type: none;
   }
}
</style>
