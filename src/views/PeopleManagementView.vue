<!-- src/views/PeopleManagementView.vue -->
<template>
  <div>
    <people-management />
    <people-list />
    <DataImportExport />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PeopleManagement from '@/components/PeopleManagement.vue';
import PeopleList from '@/components/PeopleList.vue';
import DataImportExport from '@/components/DataImportExport.vue';

export default defineComponent({
  components: {
    PeopleManagement,
    PeopleList,
    DataImportExport,
  },
});
</script>

