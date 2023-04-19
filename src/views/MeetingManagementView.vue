<!-- src/views/PeopleManagementView.vue -->
<template>
    <div>
        <meeting-management />
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  import MeetingManagement from '@/components/MeetingManagement.vue';
  
  export default defineComponent({
    components: {
      MeetingManagement,
    },
  });
  </script>
  
  