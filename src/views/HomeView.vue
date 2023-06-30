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
    <CompletedMeetings />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ShepherdsList from '@/components/ShepherdsList.vue';
import SheepList from '@/components/SheepList.vue';
import UncompletedMeetings from '@/components/UncompletedMeetings.vue';
import CompletedMeetings from '@/components/CompletedMeetings.vue';
import MeetingManagement from '@/components/MeetingManagement.vue';

export default defineComponent({
  components: {
    ShepherdsList,
    MeetingManagement,
    UncompletedMeetings,
    CompletedMeetings,
    SheepList,
  },
});
</script>

<style scoped>
.home-grid,
.reports {
  display: grid;
  grid-template-columns: 1fr;
  width: 100%;
}

@media (min-width: 1024px) {
  .home-grid,
  .reports {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
