<!-- src/views/PeopleManagementView.vue -->
<template>
  <div>
    <people-management />
    <people-list />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PeopleManagement from '@/components/PeopleManagement.vue';
import PeopleList from '@/components/PeopleList.vue';

export default defineComponent({
  components: {
    PeopleManagement,
    PeopleList,
  },
});
</script>

