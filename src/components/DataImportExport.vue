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
  // Generate a dynamic timestamp using the current local time and offset
  const now = new Date();
  // Get timezone offset in minutes (e.g. -240 for -04:00)
  const tzOffsetMin = now.getTimezoneOffset();
  // Calculate the sign, hours, and minutes for offset
  const tzSign = tzOffsetMin > 0 ? '-' : '+';
  const absOffset = Math.abs(tzOffsetMin);
  const tzHours = String(Math.floor(absOffset / 60)).padStart(2, '0');
  const tzMinutes = String(absOffset % 60).padStart(2, '0');
  // Format timestamp as YYYY-MM-DDTHH-MM-SS-TZ
  const timestamp = now.toISOString().slice(0,19).replace(/:/g,'-') + tzSign + tzHours + '-' + tzMinutes;
  link.download = `people-data-${timestamp}.json`;
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