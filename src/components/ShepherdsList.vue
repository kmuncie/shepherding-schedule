<template>
   <div class="shepherds-list">
      <h2>👨🏻‍🌾 Shepherds</h2>
      <div class="shepherds-grid">
         <q-card class="full-width shadow-up-2"
            v-for="shepherd in sortedPeople" :key="shepherd.id"
            :class="{ 'drop-target': dragOverShepherdId === shepherd.id }"
            @dragover.prevent="onDragOver(shepherd.id)"
            @dragleave="onDragLeave"
            @drop.prevent="onCardDrop(shepherd.id)"
         >
            <q-card-section>
               <h3 class="q-ma-none">{{ shepherd.name }}</h3>
               <p class="text-subtitle1 q-ma-none">{{ shepherd.location }}
                  <span v-if="shepherd.latestCompletedMeeting">
                     | Latest: Q{{ shepherd.latestCompletedMeeting.quarter }} {{ shepherd.latestCompletedMeeting.year }}
                  </span>
               </p>
            </q-card-section>
            <q-separator />
            <q-card-section>
              <ul class="q-ma-none">
                <li v-for="meeting in getUncompletedMeetings(shepherd.id)" :key="meeting.id">
                  <div
                    draggable="true"
                    @dragstart="onChipDragStart(meeting)"
                    @dragend="onChipDragEnd"
                    @click="() => { meeting.completed = !meeting.completed; updateMeetingCompletion(meeting.id, meeting.completed); }"
                  >
                    <q-chip square :class="[meeting.completed ? 'bg-green-2' : 'text-red-10']"
                      :removable="meeting.shepherdId === shepherd.id" @remove="removeMeeting(shepherd.id, meeting.id)">
                      Q{{ meeting.quarter }} {{ meeting.year }} - {{ personNameById(meeting.sheepId) }}
                      <q-icon v-if="meeting.completed" name="check_circle" class="q-ml-xs" />
                    </q-chip>
                  </div>
                </li>
              </ul>
            </q-card-section>
         </q-card>
      </div>
   </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useSortedPeople } from '@/composables/useSortedPeople';
import { useMeetingActions } from '@/composables/useMeetingActions';
import { usePeopleById } from '@/composables/usePeopleById';

export default defineComponent({
   setup() {
      const dragOverShepherdId = ref<string | null>(null);
      const draggedMeeting = ref<any>(null);
      const { sortedPeople } = useSortedPeople('shepherd');
      const { personNameById } = usePeopleById();
      const { updateMeetingCompletion, removeMeeting, reassignMeetingShepherd } = useMeetingActions();

      function getUncompletedMeetings(shepherdId: string) {
         const shepherd = sortedPeople.value.find(person => person.id === shepherdId);
         return shepherd ?
            shepherd.meetings.filter(meeting =>
               !meeting.completed && meeting.sheepId !== shepherdId
            ) : [];
      }

      function onChipDragStart(meeting: any) {
        draggedMeeting.value = meeting;
      }
      function onChipDragEnd() {
        draggedMeeting.value = null;
      }
      function onCardDrop(newShepherdId: string) {
        if (!draggedMeeting.value || !draggedMeeting.value.id || !newShepherdId) {
          dragOverShepherdId.value = null;
          return;
        }
        if (draggedMeeting.value.shepherdId !== newShepherdId) {
          reassignMeetingShepherd(draggedMeeting.value.id, newShepherdId);
        }
        dragOverShepherdId.value = null;
        draggedMeeting.value = null;
      }

      function onDragOver(shepherdId: string) {
        dragOverShepherdId.value = shepherdId;
      }
      function onDragLeave() {
        dragOverShepherdId.value = null;
      }

      return {
         sortedPeople,
         getUncompletedMeetings,
         personNameById,
         updateMeetingCompletion,
         removeMeeting,
         reassignMeetingShepherd,
         onChipDragStart,
         onChipDragEnd,
         onCardDrop,
         onDragOver,
         onDragLeave,
         dragOverShepherdId,
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

.drop-target {
   border: 2px dashed #1976d2;
   background: #e3f2fd;
}

ul {
   padding: 0;

   li {
      list-style-type: none;
      cursor: move;
   }
}

.q-chip {
   cursor: move;
}

</style>
