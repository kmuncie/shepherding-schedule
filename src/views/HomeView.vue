<template>
   <div class="home-grid">
      <ShepherdsList />
      <!-- <SheepList /> -->
   </div>
   <div class="reports">
      <UncompletedMeetings />
      <CompletedMeetings />
   </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ShepherdsList from '@/components/ShepherdsList.vue';
// import SheepList from '@/components/SheepList.vue';
import UncompletedMeetings from '@/components/UncompletedMeetings.vue';
import CompletedMeetings from '@/components/CompletedMeetings.vue';

export default defineComponent({
   components: {
      ShepherdsList,
      UncompletedMeetings,
      CompletedMeetings,
      // SheepList,
   },
});
</script>

<style scoped>
/* .home-grid, */
.reports {
   display: grid;
   grid-template-columns: 1fr;
   width: 100%;
}

@media (min-width: 1024px) {
   /* .home-grid, */
   .reports {
      grid-template-columns: 1fr 1fr;
   }
}
</style>
