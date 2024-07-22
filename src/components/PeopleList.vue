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
                     <span v-if="person.role === 'shepherd'"> (Shepherd)</span>
                     <q-chip outline :color="person.departed ? 'red' : 'grey-6'"
                        :text-color="person.departed ? 'white' : 'grey-9'" size="xs" icon="directions_run" clickable
                        @click="toggleDepartedStatus(person.id)">
                        Departed
                     </q-chip>
                  </p>
               </div>
               <div class="q-card-section-actions">
                  <q-btn flat round color="gray" icon="delete" v-if="!person.confirmRemoval"
                     @click="toggleConfirmation(person)"></q-btn>
                  <q-btn flat round color="red" icon="delete_forever" v-else @click="removePerson(person.id)"></q-btn>
               </div>
            </q-card-section>
            <q-separator />

            <q-card-section horizontal>
            <q-card-section >

               <MeetingScheduler :person="person" />
            </q-card-section>
            <q-separator vertical />
            <q-card-section >
               <q-chip v-for="meeting in person.meetings.filter(
                  (m) => m.sheepId === person.id
               )" :key="meeting.id" :class="[meeting.completed ? 'bg-green-2' : 'text-red-10']"
                  :removable="meeting.shepherdId === meeting.shepherdId" @click="() => {
                        meeting.completed = !meeting.completed;
                        updateMeetingCompletion(meeting.id, meeting.completed);
                     }"
                  @remove="removeMeeting(meeting.shepherdId, meeting.id)" clickable>
                  Q{{ meeting.quarter }} {{ meeting.year }} -
                  {{ personNameById(meeting.shepherdId) }}
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
import MeetingScheduler from "./MeetingScheduler.vue";

export default defineComponent({
   components: {
      MeetingScheduler
   },
   setup() {
      const peopleStore = usePeopleStore();
      const { personNameById } = usePeopleById();

      const { sortedPeople } = useSortedPeople();
      const { updateMeetingCompletion, removeMeeting } = useMeetingActions();

      const removePerson = (personId: string) => {
         peopleStore.deletePerson(personId);
      };

      const toggleConfirmation = (person: any) => {
         person.confirmRemoval = !person.confirmRemoval;
      };

      const toggleDepartedStatus = (personId: string) => {
         peopleStore.toggleDeparted(personId);
      };

      return {
         sortedPeople,
         personNameById,
         removePerson,
         toggleConfirmation,
         useSortedPeople,
         updateMeetingCompletion,
         removeMeeting,
         toggleDepartedStatus,
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

.q-card-section-flex {
   display: flex;
   justify-content: space-between;
   align-items: center;
}

.q-card-section-content {
   flex-grow: 1;
}
</style>
