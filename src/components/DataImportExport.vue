<template>
  <div class="q-pa-md q-gutter-sm">
    <h2>Data Import/Export</h2>
    <q-uploader label="Import Data" accept=".json" @added="importData" :clearable="false" :max-files="1" :multiple="false"
      hide-upload-btn />
    <q-btn label="Export Data" color="secondary" @click="exportData" />
    <q-btn :label="clearLocalStorageLabel" color="negative" @click="clearLocalStorage" />
  </div>
</template>
  
<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { usePeopleStore } from '@/stores/people';
import { QUploader } from 'quasar';

export default defineComponent({
  components: {
    QUploader,
  },
  setup() {
    const peopleStore = usePeopleStore();
    const clearLocalStorageConfirmed = ref(false);

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

    const clearLocalStorage = () => {
      if (clearLocalStorageConfirmed.value) {
        peopleStore.clearPeopleData();
        clearLocalStorageConfirmed.value = false;
      } else {
        clearLocalStorageConfirmed.value = true;
      }
    };

    const clearLocalStorageLabel = computed(() => {
      return clearLocalStorageConfirmed.value
        ? "Are you sure? Click again to confirm"
        : "Clear Local Storage";
    });

    return {
      exportData,
      importData,
      clearLocalStorage,
      clearLocalStorageLabel,
    };
  },
});
</script>  