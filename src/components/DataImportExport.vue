<template>
    <div>
      <h2>Data Import/Export</h2>
      <button @click="exportData">Export People Data</button>
      <input type="file" @change="importData" />
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  import { usePeopleStore } from '@/stores/people';
  
  export default defineComponent({
    setup() {
      const peopleStore = usePeopleStore();
  
      const exportData = () => {
        const url = peopleStore.exportPeopleData();
        const link = document.createElement('a');
        link.href = url;
        link.download = 'people-data.json';
        link.click();
        URL.revokeObjectURL(url);
      };
  
      const importData = (event: Event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          peopleStore.importPeopleData(file);
        }
      };
  
      return {
        exportData,
        importData,
      };
    },
  });
  </script>  