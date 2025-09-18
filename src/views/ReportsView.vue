<!-- src/views/ReportsView.vue -->
<template>
   <div class="reports-container">
      <div class="page-header">
         <h1 class="page-title">
            <q-icon name="analytics" size="md" class="q-mr-sm" />
            Reports & Analytics
         </h1>
         <p class="page-subtitle text-grey-7">
            Monitor shepherding activities and track progress
         </p>
      </div>
      
      <q-separator class="q-mb-lg" />
      
      <!-- Priority Alert Section -->
      <div class="report-section">
         <UnshepherdedReport />
      </div>
      
      <!-- Overview Statistics -->
      <div class="report-section">
         <PeopleCount />
      </div>
      
      <!-- Meeting Analytics -->
      <div class="report-section">
         <MeetingCount />
      </div>
      
      <!-- Completed Meetings Details -->
      <div class="report-section">
         <CompletedMeetings />
      </div>
   </div>
 </template>

 <script lang="ts">
 import { defineComponent } from 'vue';
 import PeopleCount from '@/components/PeopleCount.vue';
 import MeetingCount from '@/components/MeetingCount.vue'
 import CompletedMeetings from '@/components/CompletedMeetings.vue';
 import UnshepherdedReport from '@/components/UnshepherdedReport.vue';

 export default defineComponent({
   components: {
      PeopleCount,
      MeetingCount,
      CompletedMeetings,
      UnshepherdedReport,
   },
 });
 </script>

 <style scoped>
 .reports-container {
    padding: 1rem;
    max-width: 1400px;
    margin: 0 auto;
 }

 .page-header {
    margin-bottom: 1.5rem;
 }

 .page-title {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
    color: #333;
 }

 .page-subtitle {
    margin: 0;
    font-size: 1rem;
 }

 .report-section {
    margin-bottom: 1rem;
 }

 @media (max-width: 768px) {
    .reports-container {
       padding: 0.5rem;
    }
 }
 </style>

