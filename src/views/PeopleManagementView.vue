<!-- src/views/PeopleManagementView.vue -->
<template>
  <div>
    <people-management />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PeopleManagement from '@/components/PeopleManagement.vue';

export default defineComponent({
  components: {
    PeopleManagement,
  },
});
</script>

