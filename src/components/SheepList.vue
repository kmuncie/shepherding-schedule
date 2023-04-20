<template>
  <div>
    <h2>Sheep List</h2>
    <div class="sheep-grid">
      <q-card bordered class="full-width" v-for="sheep in sheepList" :key="sheep.id">
          <q-card-section>
            <h3 class="q-ma-none">{{ sheep.name }}</h3>
            <p class="text-subtitle1 q-ma-none">{{ sheep.location }}</p>
          </q-card-section>      
          <ul v-if="sheep.meetings && sheep.meetings.length > 0" class="q-ma-none">
            <li v-for="meeting in sheep.meetings" :key="meeting.id" 
            class="text-xs" :class="{ 'text-orange-10': !meeting.completed }">
              Q{{ meeting.quarter }} {{
              meeting.year }} -
              {{ getPersonNameById(meeting.sheepId) }}
            </li>
        </ul>
      </q-card>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { usePeopleStore } from '@/stores/people';

export default defineComponent({
  setup() {
    const peopleStore = usePeopleStore();

    const sheepList = peopleStore.$state.people.filter((person) => person.role !== 'shepherd');

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
      getShepherdName,
      getPersonNameById,
      updateMeetingCompletion,
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
        font-size: 14px;
        padding: 4px;
        border-top: 1px dotted #777;
      }
    }
</style>
