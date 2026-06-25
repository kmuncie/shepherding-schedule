<template>
   <div>
      <h2>People List</h2>
      <div class="card-container">
         <q-card bordered class="full-width shadow-up-2" v-for="person in sortedPeople" :key="person.id">
            <q-card-section :class="{
               'q-card-section-flex': true,
            }">
               <div class="q-card-section-content" :class="{
                  'text-deep-orange-6': person.role === 'shepherd',
                  'text-grey-5': person.departed,
                  'q-card-section-content': true,
               }">
                  <h3 class="q-ma-none">{{ person.name }}</h3>
                  <p class="text-subtitle1 q-ma-none">
                     {{ person.location }}
                     <q-chip
                        clickable
                        @click="toggleRole(person.id)"
                        :color="person.role === 'shepherd' ? 'deep-orange-6' : 'grey'"
                        text-color="white"
                        size="sm"
                        icon="person"
                     >
                        {{ person.role === 'shepherd' ? 'Shepherd' : 'Sheep' }}
                     </q-chip>
                     <q-chip
  :outline="!person.departed"
  :color="person.departed ? 'red' : 'grey-6'"
  :text-color="person.departed ? 'white' : 'grey-9'"
  size="xs"
  :icon="person.departed ? 'cancel' : 'directions_run'"
  clickable
  @click="toggleDepartedStatus(person.id)"
  :label="person.departed ? 'Departed' : 'Mark as Departed'"
  :title="person.departed ? 'This person is marked as departed. Click to mark as active.' : 'Mark this person as departed.'"
/>
                     <q-chip
  :outline="!person.excludeAsSheep"
  :color="person.excludeAsSheep ? 'blue-grey-7' : 'grey-6'"
  :text-color="person.excludeAsSheep ? 'white' : 'grey-9'"
  size="xs"
  :icon="person.excludeAsSheep ? 'block' : 'event_available'"
  clickable
  @click="toggleExcludeAsSheep(person.id)"
  :label="person.excludeAsSheep ? 'No visits needed' : 'Receives visits'"
  :title="person.excludeAsSheep ? 'This person is never scheduled to receive a visit. Click to include them.' : 'This person is scheduled to receive visits. Click to exclude them.'"
/>

                  </p>
                  <div v-if="person.role === 'shepherd'" class="row items-center q-gutter-sm q-mb-xs">
                     <span class="text-caption text-grey-7">Shepherd weight</span>
                     <q-input
                        :model-value="person.shepherdWeight ?? 1"
                        @update:model-value="(val) => setShepherdWeight(person.id, val)"
                        type="number"
                        dense
                        outlined
                        min="0"
                        step="0.5"
                        style="width: 90px"
                        title="How much of the visit load this shepherd carries. 1 is a normal share; higher takes proportionally more, 0 takes none."
                     />
                  </div>
                  <!-- Display last meeting information -->
                  <div v-if="person.latestCompletedMeeting" class="text-caption q-mt-sm">
                     <q-icon name="event" size="xs" class="q-mr-xs" />
                     Last meeting: {{ formatDate(person.latestCompletedMeeting.completedDate) }}
                     <br />
                     <q-icon name="person" size="xs" class="q-mr-xs" />
                     Shepherd: {{ personNameById(person.latestCompletedMeeting.shepherdId) }}
                  </div>
                  <div v-else class="text-caption text-grey-6 q-mt-sm">
                     <q-icon name="event_busy" size="xs" class="q-mr-xs" />
                     No completed meetings
                  </div>
               </div>
               <div class="q-card-section-actions">
                  <q-btn flat round color="gray" icon="delete" v-if="!person.confirmRemoval"
                     @click="toggleConfirmation(person)"></q-btn>
                  <q-btn flat round color="red" icon="delete_forever" v-else @click="removePerson(person.id)"></q-btn>
               </div>
            </q-card-section>
            <q-separator />

            <q-card-section horizontal>
               <q-card-section>
                  <MeetingScheduler :person="person" />
               </q-card-section>
               <q-separator vertical />
               <q-card-section>
                  <q-chip v-for="meeting in getSortedMeetings(person.meetings, person.id)" :key="meeting.id"
                     :class="[isPendingDelete(meeting.id) ? 'pending-delete' : '']"
                     :style="getChipStyle(meeting.completed)"
                     :removable="meeting.shepherdId === meeting.shepherdId"
                     @click="() => {
                        if (!isPendingDelete(meeting.id)) {
                           meeting.completed = !meeting.completed;
                           updateMeetingCompletion(meeting.id, meeting.completed);
                        }
                     }"
                     @remove="confirmDeleteMeeting(meeting.shepherdId, meeting.id)"
                     clickable
                  >
                     <template v-if="isPendingDelete(meeting.id)">
                        <q-icon name="warning" class="q-mr-xs text-red" />
                        Click again to delete
                     </template>
                     <template v-else>
                        <span :style="{ color: getQuarterColor(meeting.quarter) }">Q{{ meeting.quarter }}</span>
                        <span :style="{ color: getYearColor(meeting.year) }" class="q-ml-xs">{{ meeting.year }}</span>
                        <span class="q-ml-xs">- {{ personNameById(meeting.shepherdId) }}</span>
                     </template>
                  </q-chip>
               </q-card-section>
            </q-card-section>
         </q-card>
      </div>
   </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { usePeopleStore } from "@/stores/people";
import { usePeopleById } from "@/composables/usePeopleById";
import { useSortedPeople } from "@/composables/useSortedPeople";
import { useMeetingActions } from "@/composables/useMeetingActions";
import { useMeetingColors } from "@/composables/useMeetingColors";
import MeetingScheduler from "./MeetingScheduler.vue";

export default defineComponent({
   components: {
      MeetingScheduler
   },
   setup() {
      const peopleStore = usePeopleStore();
      const { personNameById } = usePeopleById();

      const { sortedPeople } = useSortedPeople();
      const { updateMeetingCompletion, confirmDeleteMeeting, isPendingDelete } = useMeetingActions();
      const { getChipStyle, getYearColor, getQuarterColor } = useMeetingColors();

      const removePerson = (personId: string) => {
         peopleStore.deletePerson(personId);
      };

      const toggleConfirmation = (person: any) => {
         person.confirmRemoval = !person.confirmRemoval;
      };

      const toggleDepartedStatus = (personId: string) => {
         peopleStore.toggleDeparted(personId);
      };

      const toggleRole = (personId: string) => {
         peopleStore.toggleRole(personId);
      };

      const toggleExcludeAsSheep = (personId: string) => {
         peopleStore.toggleExcludeAsSheep(personId);
      };

      const setShepherdWeight = (personId: string, weight: string | number | null) => {
         const value = weight === null || weight === '' ? 1 : Number(weight);
         peopleStore.setShepherdWeight(personId, value);
      };

      const formatDate = (dateString: string | undefined) => {
         if (!dateString) return 'N/A';
         const date = new Date(dateString);
         return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
         });
      };

      const getSortedMeetings = (meetings: any[], personId: string) => {
         return meetings
            .filter(m => m.sheepId === personId)
            .sort((a, b) => {
               if (a.year !== b.year) return a.year - b.year;
               return a.quarter - b.quarter;
            });
      };

      return {
         sortedPeople,
         personNameById,
         removePerson,
         toggleConfirmation,
         useSortedPeople,
         updateMeetingCompletion,
         confirmDeleteMeeting,
         isPendingDelete,
         getChipStyle,
         getYearColor,
         getQuarterColor,
         getSortedMeetings,
         toggleDepartedStatus,
         toggleRole,
         toggleExcludeAsSheep,
         setShepherdWeight,
         formatDate,
      };
   },
});
</script>

<style scoped>
.card-container {
   display: grid;
   grid-template-columns: 1fr;
   gap: 1rem;
}

@media (min-width: 1024px) {
   .card-container {
      grid-template-columns: 1fr 1fr;
   }
}

.q-card-section-flex {
   display: flex;
   justify-content: space-between;
   align-items: center;
}

.q-card-section-content {
   flex-grow: 1;
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
