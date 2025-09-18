<template>
   <div class="people-count-container">
      <h3 class="section-title">
         <q-icon name="groups" size="sm" class="q-mr-sm" />
         People Overview
      </h3>
      <div class="stats-grid">
         <q-card class="stat-card">
            <q-card-section class="text-center">
               <q-icon name="people" size="xl" color="primary" />
               <div class="stat-value text-h4 text-weight-bold q-mt-sm">{{ totalPeopleCount }}</div>
               <div class="stat-label text-subtitle2 text-grey-7">Active People</div>
            </q-card-section>
         </q-card>
         
         <q-card class="stat-card">
            <q-card-section class="text-center">
               <q-icon name="person" size="xl" color="deep-orange-6" />
               <div class="stat-value text-h4 text-weight-bold q-mt-sm">{{ shepherdsCount }}</div>
               <div class="stat-label text-subtitle2 text-grey-7">Shepherds</div>
            </q-card-section>
         </q-card>
         
         <q-card class="stat-card">
            <q-card-section class="text-center">
               <q-icon name="person_outline" size="xl" color="blue-6" />
               <div class="stat-value text-h4 text-weight-bold q-mt-sm">{{ sheepCount }}</div>
               <div class="stat-label text-subtitle2 text-grey-7">Sheep</div>
            </q-card-section>
         </q-card>
         
         <q-card class="stat-card">
            <q-card-section class="text-center">
               <q-icon name="directions_run" size="xl" color="grey-6" />
               <div class="stat-value text-h4 text-weight-bold q-mt-sm">{{ departedCount }}</div>
               <div class="stat-label text-subtitle2 text-grey-7">Departed</div>
            </q-card-section>
         </q-card>
      </div>
   </div>
 </template>

 <script lang="ts">
 import { defineComponent, computed } from 'vue';
 import { usePeopleStore } from '@/stores/people';

 export default defineComponent({
   setup() {
     const peopleStore = usePeopleStore();

     // Total people count excluding those departed
     const totalPeopleCount = computed(() => {
       return peopleStore.$state.people.filter(person => !person.departed).length;
     });

     // Count of shepherds
     const shepherdsCount = computed(() => {
       return peopleStore.$state.people.filter(person => person.role === 'shepherd' && !person.departed).length;
     });

     // Count of sheep (non-shepherd active people)
     const sheepCount = computed(() => {
       return peopleStore.$state.people.filter(person => person.role !== 'shepherd' && !person.departed).length;
     });

     // Count of departed people
     const departedCount = computed(() => {
       return peopleStore.$state.people.filter(person => person.departed).length;
     });

     return { totalPeopleCount, shepherdsCount, sheepCount, departedCount };
   },
 });
 </script>

 <style scoped>
 .people-count-container {
    margin-bottom: 2rem;
 }

 .section-title {
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
 }

 .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
 }

 .stat-card {
    transition: transform 0.2s, box-shadow 0.2s;
 }

 .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
 }
 </style>
