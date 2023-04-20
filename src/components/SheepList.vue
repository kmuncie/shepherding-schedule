<template>
  <div>
    <h2>Sheep List</h2>
    <div class="sheep-grid">
      <q-card bordered class="full-width" v-for="sheep in sheepList" :key="sheep.id">
          <q-card-section>
            <h3 class="q-ma-none">{{ sheep.name }}</h3>
            <p class="text-subtitle1 q-ma-none">{{ sheep.location }}</p>
          </q-card-section>      
          <q-separator v-if="meeting in sheep.meetings" />
          <ul>
          <li v-for="meeting in sheep.meetings" :key="meeting.id">
            {{ getShepherdName(meeting.shepherdId) }} - Q{{ meeting.quarter }} {{ meeting.year }}
            <input
              type="checkbox"
              v-model="meeting.completed"
              @change="updateMeetingCompletion(sheep.id, meeting.id, meeting.completed)"
            /> Completed
          </li>
        </ul>
      </q-card>
      <!-- <div class="sheep-card" v-for="sheep in sheepList" :key="sheep.id">
        <h3>{{ sheep.name }}</h3>
        <p class="location">{{ sheep.location }}</p>
        <ul>
          <li v-for="meeting in sheep.meetings" :key="meeting.id">
            {{ getShepherdName(meeting.shepherdId) }} - Q{{ meeting.quarter }} {{ meeting.year }}
            <input
              type="checkbox"
              v-model="meeting.completed"
              @change="updateMeetingCompletion(sheep.id, meeting.id, meeting.completed)"
            /> Completed
          </li>
        </ul>
      </div> -->
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

    const updateMeetingCompletion = (sheepId: string, meetingId: string, completed: boolean) => {
      peopleStore.updateMeetingCompletion(sheepId, meetingId, completed);
    };

    return {
      sheepList,
      getShepherdName,
      updateMeetingCompletion,
    };
  },
});
</script>

<style scoped>
.sheep-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  grid-gap: 20px;
  margin: 20px;
}

.sheep-card {
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 20px;
  background-color: #fff;
}

.location {
  font-size: 14px;
  color: #888;
  margin-bottom: 10px;
}
</style>
