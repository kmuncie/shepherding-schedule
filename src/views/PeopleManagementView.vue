<!-- src/views/PeopleManagementView.vue -->
<template>
  <div>
    <bulk-meeting-generator />
    <people-management />
    <people-list />
    <DataImportExport />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import BulkMeetingGenerator from '@/components/BulkMeetingGenerator.vue';
import PeopleManagement from '@/components/PeopleManagement.vue';
import PeopleList from '@/components/PeopleList.vue';
import DataImportExport from '@/components/DataImportExport.vue';

export default defineComponent({
  components: {
    BulkMeetingGenerator,
    PeopleManagement,
    PeopleList,
    DataImportExport,
  },
});
</script>

