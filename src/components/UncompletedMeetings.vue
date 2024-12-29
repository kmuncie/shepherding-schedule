<template>
   <div>
      <h3>Uncompleted Meetings</h3>

      <q-btn-toggle
         v-model="currentView"
         :options="[
            { label: 'By Quarter', value: 'quarter' },
            { label: 'By Shepherd', value: 'shepherd' }
         ]"
         class="q-mb-md"
      />

      <!-- View by Quarter -->
      <div v-if="currentView === 'quarter'">
         <div v-for="(meetingGroup, quarterYear) in groupedByQuarter" :key="quarterYear">
            <h4 class="q-pa-sm q-mb-md bg-primary text-white rounded-borders">{{ quarterYear }}</h4>
            <ul>
               <li v-for="shepherd in meetingGroup" :key="shepherd.id">
                  <strong>{{ shepherd.name }}:</strong>
                  <ul>
                     <li v-for="meeting in shepherd.uncompletedMeetings" :key="meeting.id">
                        <q-chip>
                           {{ meeting.partnerName }} ({{ meeting.partnerLocation }})
                        </q-chip>
                     </li>
                  </ul>
               </li>
            </ul>
         </div>
      </div>

      <!-- View by Shepherd -->
      <div v-else>
         <div v-for="shepherd in groupedByShepherd" :key="shepherd.id">
            <h4 class="q-pa-sm q-mb-md bg-primary text-white rounded-borders">{{ shepherd.name }}</h4>
            <ul>
               <li v-for="(meetings, quarterYear) in shepherd.meetingsByQuarter" :key="quarterYear">
                  <strong>{{ quarterYear }}:</strong>
                  <ul>
                     <li v-for="meeting in meetings" :key="meeting.id">
                        <q-chip>
                           {{ meeting.partnerName }} ({{ meeting.partnerLocation }})
                        </q-chip>
                     </li>
                  </ul>
               </li>
            </ul>
         </div>
      </div>
   </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { usePeopleStore } from '@/stores/people';

interface Meeting {
   id: string;
   quarter: number;
   year: number;
   partnerName?: string;
   partnerLocation?: string;
}

interface Shepherd {
   id: string;
   name: string;
   uncompletedMeetings: Meeting[];
}

interface ShepherdWithQuarters extends Shepherd {
   meetingsByQuarter: {
      [key: string]: Meeting[];
   };
}

export default defineComponent({
   setup() {
      const peopleStore = usePeopleStore();
      const currentView = ref('quarter');

      const shepherds = computed(() => {
         return peopleStore.people
            .filter((person) => person.role === 'shepherd')
            .map((shepherd) => {
               const uncompletedMeetings = shepherd.meetings
                  .filter((meeting) => !meeting.completed && meeting.shepherdId === shepherd.id)
                  .map((meeting) => {
                     const partner = peopleStore.people.find((person) => person.id === meeting.sheepId);
                     return {
                        ...meeting,
                        partnerName: partner?.name,
                        partnerLocation: partner?.location,
                     };
                  });

               return {
                  ...shepherd,
                  uncompletedMeetings,
               };
            });
      });

      const groupedByQuarter = computed(() => {
         const grouped: { [key: string]: Shepherd[] } = {};

         shepherds.value.forEach((shepherd) => {
            shepherd.uncompletedMeetings.forEach((meeting) => {
               const quarterYear = `Q${meeting.quarter} ${meeting.year}`;
               if (!grouped[quarterYear]) {
                  grouped[quarterYear] = [];
               }
               let existingShepherd = grouped[quarterYear].find(s => s.id === shepherd.id);
               if (!existingShepherd) {
                  existingShepherd = { ...shepherd, uncompletedMeetings: [] };
                  grouped[quarterYear].push(existingShepherd);
               }
               existingShepherd.uncompletedMeetings.push(meeting);
            });
         });

         // Sort by year and quarter
         const sortedKeys = Object.keys(grouped).sort((a, b) => {
            const [aQ, aY] = a.split(' ');
            const [bQ, bY] = b.split(' ');
            return aY === bY ? aQ.localeCompare(bQ) : Number(aY) - Number(bY);
         });

         const sortedGrouped: { [key: string]: Shepherd[] } = {};
         sortedKeys.forEach((key) => {
            sortedGrouped[key] = grouped[key];
         });

         return sortedGrouped;
      });

      const groupedByShepherd = computed(() => {
         return shepherds.value.map(shepherd => {
            const meetingsByQuarter: { [key: string]: Meeting[] } = {};

            shepherd.uncompletedMeetings.forEach(meeting => {
               const quarterYear = `Q${meeting.quarter} ${meeting.year}`;
               if (!meetingsByQuarter[quarterYear]) {
                  meetingsByQuarter[quarterYear] = [];
               }
               meetingsByQuarter[quarterYear].push(meeting);
            });

            // Sort quarters within each shepherd
            const sortedQuarters = Object.keys(meetingsByQuarter).sort((a, b) => {
               const [aQ, aY] = a.split(' ');
               const [bQ, bY] = b.split(' ');
               return aY === bY ? aQ.localeCompare(bQ) : Number(aY) - Number(bY);
            });

            const sortedMeetingsByQuarter: { [key: string]: Meeting[] } = {};
            sortedQuarters.forEach(quarter => {
               sortedMeetingsByQuarter[quarter] = meetingsByQuarter[quarter];
            });

            return {
               ...shepherd,
               meetingsByQuarter: sortedMeetingsByQuarter
            };
         }).filter(shepherd => Object.keys(shepherd.meetingsByQuarter).length > 0);
      });

      return {
         currentView,
         groupedByQuarter,
         groupedByShepherd
      };
   },
});
</script>

<style scoped>
ul {
   list-style-type: none;
   padding-left: 1rem;
}

.q-btn-toggle {
   margin-bottom: 1rem;
}
</style>
