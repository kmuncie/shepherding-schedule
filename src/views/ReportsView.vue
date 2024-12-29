<!-- src/views/PeopleManagementView.vue -->
<template>
   <div>
      <h1>Reports</h1>
      <PeopleCount/>
      <MeetingCount/>
      <CompletedMeetings />
   </div>
 </template>

 <script lang="ts">
 import { defineComponent } from 'vue';
 import PeopleCount from '@/components/PeopleCount.vue';
 import MeetingCount from '@/components/MeetingCount.vue'
 import CompletedMeetings from '@/components/CompletedMeetings.vue';

 export default defineComponent({
   components: {
      PeopleCount,
      MeetingCount,
      CompletedMeetings,
   },
 });
 </script>

