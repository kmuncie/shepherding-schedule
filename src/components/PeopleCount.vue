<template>
   <div>
     <p>Total People (Excluding Departed): {{ totalPeopleCount }}</p>
     <p>Total Shepherds: {{ shepherdsCount }}</p>
     <p>Total Departed: {{ departedCount }}</p>
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

     // Count of departed people
     const departedCount = computed(() => {
       return peopleStore.$state.people.filter(person => person.departed).length;
     });

     return { totalPeopleCount, shepherdsCount, departedCount };
   },
 });
 </script>

 <style scoped>
 /* Add any styles for your component here */
 </style>
