<template>
   <div class="unshepherded-report">
      <q-expansion-item
         :icon="unshepherdedPeople.length === 0 ? 'check_circle' : 'warning'"
         :header-class="unshepherdedPeople.length === 0 ? 'text-green' : ''"
      >
         <template v-slot:header>
            <q-item-section avatar>
               <q-icon 
                  :name="unshepherdedPeople.length === 0 ? 'check_circle' : 'warning'" 
                  :color="unshepherdedPeople.length === 0 ? 'green' : 'orange'"
               />
            </q-item-section>
            
            <q-item-section>
               <q-item-label class="text-h6">
                  People Not Shepherded in Last 6 Months
               </q-item-label>
               <q-item-label caption v-if="unshepherdedPeople.length > 0">
                  Total: {{ unshepherdedPeople.length }} {{ unshepherdedPeople.length === 1 ? 'person' : 'people' }}
               </q-item-label>
            </q-item-section>
            
            <q-item-section side v-if="unshepherdedPeople.length > 0">
               <div class="row q-gutter-sm">
                  <q-chip 
                     v-if="criticalCount > 0"
                     color="red" 
                     text-color="white" 
                     size="sm"
                     icon="priority_high"
                  >
                     {{ criticalCount }} Critical
                  </q-chip>
                  <q-chip 
                     v-if="highCount > 0"
                     color="orange" 
                     text-color="white" 
                     size="sm"
                     icon="warning"
                  >
                     {{ highCount }} High
                  </q-chip>
                  <q-chip 
                     v-if="mediumCount > 0"
                     color="yellow-8" 
                     text-color="white" 
                     size="sm"
                     icon="info"
                  >
                     {{ mediumCount }} Medium
                  </q-chip>
               </div>
            </q-item-section>
         </template>
         
         <q-card>
            <q-card-section>
               <div v-if="unshepherdedPeople.length === 0" class="text-center text-grey-6">
                  <q-icon name="check_circle" size="xl" color="green" />
                  <p class="q-mt-md">All active people have been shepherded within the last 6 months!</p>
               </div>
               
               <div v-else>
                  <q-list bordered separator class="rounded-borders">
                     <q-item v-for="person in unshepherdedPeople" :key="person.id" class="q-pa-md">
                        <q-item-section avatar>
                           <q-avatar :color="getUrgencyColor(person)" text-color="white">
                              <q-icon :name="person.role === 'shepherd' ? 'person' : 'person_outline'" />
                           </q-avatar>
                        </q-item-section>
                        
                        <q-item-section>
                           <q-item-label class="text-weight-bold">
                              {{ person.name }}
                              <q-chip 
                                 :color="person.role === 'shepherd' ? 'deep-orange-6' : 'grey'"
                                 text-color="white"
                                 size="sm"
                                 class="q-ml-sm"
                              >
                                 {{ person.role === 'shepherd' ? 'Shepherd' : 'Sheep' }}
                              </q-chip>
                           </q-item-label>
                           <q-item-label caption>
                              <q-icon name="location_on" size="xs" class="q-mr-xs" />
                              {{ person.location }}
                           </q-item-label>
                           <q-item-label caption class="q-mt-xs">
                              <span v-if="person.latestCompletedMeeting">
                                 <q-icon name="event" size="xs" class="q-mr-xs" />
                                 Last meeting: {{ formatDate(person.latestCompletedMeeting.completedDate) }}
                                 ({{ getDaysSinceLastMeeting(person.latestCompletedMeeting.completedDate) }} days ago)
                                 <br />
                                 <q-icon name="person" size="xs" class="q-mr-xs" />
                                 Last shepherd: {{ personNameById(person.latestCompletedMeeting.shepherdId) }}
                              </span>
                              <span v-else class="text-red">
                                 <q-icon name="event_busy" size="xs" class="q-mr-xs" />
                                 No completed meetings on record
                              </span>
                           </q-item-label>
                        </q-item-section>
                        
                        <q-item-section side>
                           <div class="text-center">
                              <q-chip 
                                 :color="getUrgencyColor(person)"
                                 text-color="white"
                                 icon="priority_high"
                              >
                                 {{ getUrgencyLabel(person) }}
                              </q-chip>
                           </div>
                        </q-item-section>
                     </q-item>
                  </q-list>
                  
                  <div class="q-mt-md q-pa-sm bg-grey-2 rounded-borders">
                     <p class="text-caption q-ma-none">
                        <q-icon name="info" size="xs" class="q-mr-xs" />
                        This report shows all active (non-departed) people who haven't had a completed shepherding meeting in the last 6 months.
                     </p>
                  </div>
               </div>
            </q-card-section>
         </q-card>
      </q-expansion-item>
   </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { usePeopleStore } from "@/stores/people";
import { usePeopleById } from "@/composables/usePeopleById";
import type { Person } from "@/stores/people";

export default defineComponent({
   name: "UnshepherdedReport",
   setup() {
      const peopleStore = usePeopleStore();
      const { personNameById } = usePeopleById();
      
      const unshepherdedPeople = computed(() => {
         const sixMonthsAgo = new Date();
         sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
         
         return peopleStore.people.filter((person: Person) => {
            // Skip departed people
            if (person.departed) return false;
            
            // If no completed meeting, include in the list
            if (!person.latestCompletedMeeting || !person.latestCompletedMeeting.completedDate) {
               return true;
            }
            
            // Check if last meeting was more than 6 months ago
            const lastMeetingDate = new Date(person.latestCompletedMeeting.completedDate);
            return lastMeetingDate < sixMonthsAgo;
         }).sort((a, b) => {
            // Sort by urgency: no meetings first, then by oldest meeting date
            if (!a.latestCompletedMeeting && !b.latestCompletedMeeting) return 0;
            if (!a.latestCompletedMeeting) return -1;
            if (!b.latestCompletedMeeting) return 1;
            
            const dateA = new Date(a.latestCompletedMeeting.completedDate!);
            const dateB = new Date(b.latestCompletedMeeting.completedDate!);
            return dateA.getTime() - dateB.getTime();
         });
      });
      
      const formatDate = (dateString: string | undefined) => {
         if (!dateString) return 'N/A';
         const date = new Date(dateString);
         return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
         });
      };
      
      const getDaysSinceLastMeeting = (dateString: string | undefined) => {
         if (!dateString) return 0;
         const lastMeetingDate = new Date(dateString);
         const today = new Date();
         const diffTime = Math.abs(today.getTime() - lastMeetingDate.getTime());
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
         return diffDays;
      };
      
      const getUrgencyColor = (person: Person) => {
         if (!person.latestCompletedMeeting || !person.latestCompletedMeeting.completedDate) {
            return 'red';
         }
         const days = getDaysSinceLastMeeting(person.latestCompletedMeeting.completedDate);
         if (days > 365) return 'red';
         if (days > 270) return 'orange';
         return 'yellow-8';
      };
      
      const getUrgencyLabel = (person: Person) => {
         if (!person.latestCompletedMeeting || !person.latestCompletedMeeting.completedDate) {
            return 'Critical';
         }
         const days = getDaysSinceLastMeeting(person.latestCompletedMeeting.completedDate);
         if (days > 365) return 'Critical';
         if (days > 270) return 'High';
         return 'Medium';
      };
      
      const criticalCount = computed(() => {
         return unshepherdedPeople.value.filter(person => 
            getUrgencyLabel(person) === 'Critical'
         ).length;
      });
      
      const highCount = computed(() => {
         return unshepherdedPeople.value.filter(person => 
            getUrgencyLabel(person) === 'High'
         ).length;
      });
      
      const mediumCount = computed(() => {
         return unshepherdedPeople.value.filter(person => 
            getUrgencyLabel(person) === 'Medium'
         ).length;
      });
      
      return {
         unshepherdedPeople,
         personNameById,
         formatDate,
         getDaysSinceLastMeeting,
         getUrgencyColor,
         getUrgencyLabel,
         criticalCount,
         highCount,
         mediumCount,
      };
   },
});
</script>

<style scoped>
.unshepherded-report {
   margin-bottom: 2rem;
}

.rounded-borders {
   border-radius: 8px;
}
</style>
