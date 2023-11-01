<template>
<div>
   <h2>🐑 Sheep</h2>
   <div class="sheep-grid">
  <q-card class="full-width shadow-up-2" v-for="sheep in sortedPeople" :key="sheep.id">
    <q-card-section>
      <h3 class="q-ma-none">
        <span v-if="sheep.role === 'shepherd'">👨🏻‍🌾 </span>
        {{ sheep.name }}
      </h3>
      <p class="text-subtitle1 q-ma-none">{{ sheep.location }}
        <span v-if="sheep.latestCompletedMeeting">
          | Latest: Q{{ sheep.latestCompletedMeeting.quarter }} {{ sheep.latestCompletedMeeting.year }}
        </span>
      </p>
    </q-card-section>
  </q-card>
</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useSortedPeople } from '@/composables/useSortedPeople';
import { useMeetingActions } from '@/composables/useMeetingActions';
import { usePeopleById } from '@/composables/usePeopleById';

export default defineComponent({
   setup() {
      const { sortedPeople } = useSortedPeople('sheep', 'latestCompletedMeeting');
      const { personNameById } = usePeopleById();
      const { updateMeetingCompletion, removeMeeting } = useMeetingActions();

      return {
         sortedPeople,
         personNameById,
         updateMeetingCompletion,
         removeMeeting,
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
