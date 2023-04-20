<template>
  <div>
    <h2>Data Import/Export</h2>
    <q-btn color="secondary" label="Export People Data" @click="exportData" class="q-mb-lg" />
    <q-uploader label="Upload a JSON file" @added="importData" :max-files="1" :no-thumbnails="true"></q-uploader>
  </div>
</template>
  
<script lang="ts">
import { defineComponent } from 'vue';
import { usePeopleStore } from '@/stores/people';
import { QUploader } from 'quasar';

export default defineComponent({
  components: {
    QUploader,
  },
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

    const importData = (files: readonly any[]) => {
      const fileArray = files as File[];
      if (fileArray && fileArray.length > 0) {
        const file = fileArray[0];
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