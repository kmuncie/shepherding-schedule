<!-- src/views/Home.vue -->
<template>
  <div>
    <meeting-management />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MeetingManagement from '@/components/MeetingManagement.vue';


export default defineComponent({
  name: 'Home',
  components: {
    MeetingManagement,
  },
});
</script>
