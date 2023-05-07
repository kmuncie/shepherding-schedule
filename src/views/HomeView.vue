<!-- src/views/Home.vue -->
<template>
   <div class="q-pa-md">
    <q-expansion-item icon="edit" label="Add a Meeting" class="shadow-up-2">
      <meeting-management />
    </q-expansion-item>
    </div>
  <div class="home-grid">
    <ShepherdsList />
    <SheepList />
  </div>
  <div class="reports">
    <UncompletedMeetings />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ShepherdsList from '@/components/ShepherdsList.vue';
import SheepList from '@/components/SheepList.vue';
import UncompletedMeetings from '@/components/UncompletedMeetings.vue';
import MeetingManagement from '@/components/MeetingManagement.vue';

export default defineComponent({
  components: {
    ShepherdsList,
    MeetingManagement,
    UncompletedMeetings,
    SheepList,
  },
});
</script>

<style scoped>
.home-grid {
  display: grid;
  grid-template-columns: 1fr;
  width: 100%;
}

@media (min-width: 1024px) {
  .home-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>