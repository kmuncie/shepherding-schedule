<template>
   <div class="shepherds-list">
      <h2>👨🏻‍🌾 Shepherds</h2>
      <div class="shepherds-grid">
         <q-card class="full-width shadow-up-2" v-for="shepherd in sortedPeople" :key="shepherd.id">
            <q-card-section>
               <h3 class="q-ma-none">{{ shepherd.name }}</h3>
               <p class="text-subtitle1 q-ma-none">{{ shepherd.location }}
                  <span v-if="shepherd.latestCompletedMeeting">
                     | Latest: Q{{ shepherd.latestCompletedMeeting.quarter }} {{ shepherd.latestCompletedMeeting.year }}
                  </span>
               </p>
            </q-card-section>
            <ul v-if="shepherd.meetings && shepherd.meetings.length > 0" class="q-ma-none">
               <li v-for="meeting in getUncompletedMeetings(shepherd.id)" :key="meeting.id">
                  <div
                     @click="() => { meeting.completed = !meeting.completed; updateMeetingCompletion(meeting.id, meeting.completed); }">
                     <q-chip square :class="[meeting.completed ? 'bg-green-2' : 'text-red-10']"
                        :removable="meeting.shepherdId === shepherd.id" @remove="removeMeeting(shepherd.id, meeting.id)">
                        Q{{ meeting.quarter }} {{ meeting.year }} - {{ personNameById(meeting.sheepId) }}
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
import { defineComponent } from 'vue';
import { useSortedPeople } from '@/composables/useSortedPeople';
import { useMeetingActions } from '@/composables/useMeetingActions';
import { usePeopleById } from '@/composables/usePeopleById';

export default defineComponent({
   setup() {
      const { sortedPeople } = useSortedPeople('shepherd');
      const { personNameById } = usePeopleById();
      const { updateMeetingCompletion, removeMeeting } = useMeetingActions();

      function getUncompletedMeetings(shepherdId: string) {
         const shepherd = sortedPeople.value.find(person => person.id === shepherdId);
         return shepherd ?
            shepherd.meetings.filter(meeting =>
               !meeting.completed && meeting.sheepId !== shepherdId
            ) : [];
      }

      return {
         sortedPeople,
         getUncompletedMeetings,
         personNameById,
         updateMeetingCompletion,
         removeMeeting,
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
