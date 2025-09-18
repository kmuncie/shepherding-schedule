<template>
   <div class="completed-meetings-container">
      <q-expansion-item
         icon="check_circle"
         label="Completed Meetings Details"
         header-class="text-subtitle1"
      >
         <template v-slot:header>
            <q-item-section avatar>
               <q-icon name="check_circle" color="green" />
            </q-item-section>
            
            <q-item-section>
               <q-item-label class="text-h6">
                  Completed Meetings Details
               </q-item-label>
               <q-item-label caption>
                  Total Shepherded: {{ completedMeetingsCount }} meetings
               </q-item-label>
            </q-item-section>
            
            <q-item-section side>
               <q-chip color="green" text-color="white" icon="groups">
                  {{ shepherdsWithMeetings }} Active Shepherds
               </q-chip>
            </q-item-section>
         </template>
         
         <q-card>
            <q-card-section>
               <div v-if="shepherds.length === 0" class="text-center text-grey-6 q-pa-md">
                  <q-icon name="event_busy" size="xl" />
                  <p class="q-mt-md">No completed meetings yet</p>
               </div>
               
               <q-list v-else separator>
                  <q-expansion-item
                     v-for="shepherd in shepherds"
                     :key="shepherd.id"
                     :label="shepherd.name"
                     :caption="`${shepherd.completedMeetings.length} completed meetings`"
                     header-class="text-weight-bold"
                     expand-separator
                     group="shepherds"
                  >
                     <q-card>
                        <q-card-section>
                           <div v-if="shepherd.completedMeetings.length === 0" class="text-grey-6 text-center q-pa-sm">
                              No completed meetings
                           </div>
                           <div v-else class="meetings-grid">
                              <q-chip
                                 v-for="meeting in shepherd.completedMeetings"
                                 :key="meeting.id"
                                 color="green-2"
                                 text-color="green-9"
                                 icon="person"
                                 class="meeting-chip"
                              >
                                 <div>
                                    <strong>{{ meeting.partnerName }}</strong>
                                    <br />
                                    <span class="text-caption">
                                       <q-icon name="location_on" size="xs" /> {{ meeting.partnerLocation }}
                                    </span>
                                    <br />
                                    <span class="text-caption">
                                       <q-icon name="event" size="xs" /> Q{{ meeting.quarter }} {{ meeting.year }}
                                    </span>
                                 </div>
                              </q-chip>
                           </div>
                        </q-card-section>
                     </q-card>
                  </q-expansion-item>
               </q-list>
            </q-card-section>
         </q-card>
      </q-expansion-item>
   </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { usePeopleStore } from '@/stores/people';

export default defineComponent({
   setup() {
      const peopleStore = usePeopleStore();

      const shepherds = computed(() => {
         const shepherdsWithCompletedMeetings = peopleStore.people
            .filter((person) => person.role === 'shepherd')
            .map((shepherd) => {
               const completedMeetings = shepherd.meetings.filter(
                  (meeting) => meeting.completed && meeting.shepherdId === shepherd.id
               );
               const mappedMeetings = completedMeetings.map((meeting) => {
                  const partner = peopleStore.people.find((person) => person.id === meeting.sheepId);
                  return {
                     ...meeting,
                     partnerName: partner?.name,
                     partnerLocation: partner?.location,
                  };
               });

               return {
                  ...shepherd,
                  completedMeetings: mappedMeetings,
               };
            });

         return shepherdsWithCompletedMeetings;
      });

      const completedMeetingsCount = computed(() => {
         let count = 0;
         for (let shepherd of shepherds.value) {
            count += shepherd.completedMeetings.length;
         }
         return count;
      });

      const shepherdsWithMeetings = computed(() => {
         return shepherds.value.filter(s => s.completedMeetings.length > 0).length;
      });

      return {
         shepherds,
         completedMeetingsCount,
         shepherdsWithMeetings
      };
   },
});
</script>

<style scoped>
.completed-meetings-container {
   margin-bottom: 2rem;
}

.meetings-grid {
   display: flex;
   flex-wrap: wrap;
   gap: 0.5rem;
}

.meeting-chip {
   height: auto;
   padding: 0.5rem;
   white-space: normal;
}

.meeting-chip > div {
   text-align: left;
   line-height: 1.3;
}
</style>
