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
                    <q-chip square
                      :class="[isPendingDelete(meeting.id) ? 'pending-delete' : '']"
                      :style="getChipStyle(meeting.completed)"
                      :removable="meeting.shepherdId === shepherd.id"
                      @remove="confirmDeleteMeeting(shepherd.id, meeting.id)"
                    >
                      <template v-if="isPendingDelete(meeting.id)">
                        <q-icon name="warning" class="q-mr-xs text-red" />
                        Click again to delete
                      </template>
                      <template v-else>
                        <span :style="{ color: getQuarterColor(meeting.quarter) }">Q{{ meeting.quarter }}</span>
                        <span :style="{ color: getYearColor(meeting.year) }" class="q-ml-xs">{{ meeting.year }}</span>
                        <span class="q-ml-xs">-</span>
                        <MiddleTruncate class="q-ml-xs" :text="personNameById(meeting.sheepId)" />
                        <q-icon v-if="meeting.completed" name="check_circle" class="q-ml-xs text-green" />
                      </template>
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
import { useMeetingColors } from '@/composables/useMeetingColors';
import MiddleTruncate from '@/components/MiddleTruncate.vue';

export default defineComponent({
   components: { MiddleTruncate },
   setup() {
      const dragOverShepherdId = ref<string | null>(null);
      const draggedMeeting = ref<any>(null);
      const { sortedPeople } = useSortedPeople('shepherd');
      const { personNameById } = usePeopleById();
      const { updateMeetingCompletion, confirmDeleteMeeting, reassignMeetingShepherd, isPendingDelete } = useMeetingActions();
      const { getChipStyle, getYearColor, getQuarterColor } = useMeetingColors();

      function getUncompletedMeetings(shepherdId: string) {
         const shepherd = sortedPeople.value.find(person => person.id === shepherdId);
         if (!shepherd) return [];

         return shepherd.meetings
            .filter(meeting => !meeting.completed && meeting.sheepId !== shepherdId)
            .sort((a, b) => {
               if (a.year !== b.year) return a.year - b.year;
               return a.quarter - b.quarter;
            });
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
         confirmDeleteMeeting,
         isPendingDelete,
         reassignMeetingShepherd,
         onChipDragStart,
         onChipDragEnd,
         onCardDrop,
         onDragOver,
         onDragLeave,
         dragOverShepherdId,
         getChipStyle,
         getYearColor,
         getQuarterColor,
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
   width: 100%;
}

/* Let the chip's content area shrink so the sheep name can middle-truncate
   instead of overflowing the full-width chip. */
.q-chip :deep(.q-chip__content) {
   justify-content: flex-start;
   min-width: 0;
}

.pending-delete {
   background-color: #ffebee !important;
   border: 2px solid #ef5350 !important;
   animation: pulse-delete 0.5s ease-in-out infinite alternate;
}

@keyframes pulse-delete {
   from { opacity: 1; }
   to { opacity: 0.7; }
}
</style>
