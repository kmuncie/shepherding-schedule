<template>
<div>
   <h2>People List</h2>
   <div class="card-container">
      <q-card bordered class="full-width shadow-up-2" v-for="person in sortedPeople" :key="person.id">
         <q-card-section :class="{ 'text-deep-orange-6': person.role === 'shepherd' }">
            <h3 class="q-ma-none">{{ person.name }}</h3>
            <p class="text-subtitle1 q-ma-none">{{ person.location }}
               <span v-if="person.role === 'shepherd'"> (Shepherd)</span>
            </p>
         </q-card-section>
         <q-separator />
         <q-expansion-item label="Meetings" icon="event_note" v-model="expanded">
            <div v-for="meeting in person.meetings.filter(m => m.sheepId === person.id)" :key="meeting.id">
               <div @click="() => { meeting.completed = !meeting.completed; updateMeetingCompletion(meeting.id, meeting.completed); }">
               <q-chip square :class="[meeting.completed ? 'bg-green-2' : 'text-red-10']"
                  :removable="meeting.shepherdId === meeting.shepherdId" @remove="removeMeeting(meeting.shepherdId, meeting.id)">
                  Q{{ meeting.quarter }} {{ meeting.year }} - {{ personNameById(meeting.shepherdId) }}
               </q-chip>
               </div>
            </div>
         </q-expansion-item>
         <q-card-actions class="justify-around q-px-md">
            <q-btn flat round color="gray" icon="delete" v-if="!person.confirmRemoval" @click="toggleConfirmation(person)"></q-btn>
            <q-btn flat round color="red" icon="delete_forever" v-else @click="removePerson(person.id)"></q-btn>
         </q-card-actions>
      </q-card>

   </div>
</div>
</template>

<script lang="ts">
import {
   defineComponent, ref
} from 'vue';
import {
   usePeopleStore
} from '@/stores/people';
import { usePeopleById } from '@/composables/usePeopleById';
import {
   useSortedPeople
} from '@/composables/useSortedPeople';
import { useMeetingActions } from '@/composables/useMeetingActions';

export default defineComponent({
   setup() {
      const peopleStore = usePeopleStore();
      const { personNameById } = usePeopleById();

      const {
         sortedPeople
      } = useSortedPeople();
      const {
         updateMeetingCompletion,
         removeMeeting
      } = useMeetingActions();

      const removePerson = (personId: string) => {
         peopleStore.deletePerson(personId);
      };

      const toggleConfirmation = (person: any) => {
         person.confirmRemoval = !person.confirmRemoval;
      };

      return {
         sortedPeople,
         personNameById,
         removePerson,
         toggleConfirmation,
         useSortedPeople,
         updateMeetingCompletion,
         removeMeeting,
         expanded: ref(true)
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
      grid-template-columns: 1fr 1fr 1fr;
   }
}
</style>
