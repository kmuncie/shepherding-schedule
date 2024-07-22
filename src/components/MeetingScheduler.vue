// New file: src/components/MeetingScheduler.vue
<template>
   <q-form @submit="scheduleMeeting" class="q-gutter-md">
      <q-select v-model="selectedShepherdId" :options="shepherdOptions" label="Shepherd" option-value="id"
         option-label="name" emit-value map-options :disable="person.role === 'shepherd'" />
      <q-select v-model="selectedQuarter" :options="quarterOptions" label="Quarter" emit-value map-options />
      <q-input v-model.number="selectedYear" type="number" min="2023" step="1" label="Year" />
      <q-btn type="submit" color="primary" label="Schedule Meeting" />
   </q-form>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { usePeopleStore } from '@/stores/people';

export default defineComponent({
   name: 'MeetingScheduler',
   props: {
      person: {
         type: Object,
         required: true
      }
   },
   setup(props) {
      const peopleStore = usePeopleStore();
      const selectedShepherdId = ref('');
      const selectedQuarter = ref('');
      const selectedYear = ref(new Date().getFullYear());

      const shepherdOptions = computed(() =>
         peopleStore.$state.people
            .filter(p => p.role === 'shepherd' && p.id !== props.person.id)
            .map(s => ({ id: s.id, name: s.name }))
      );

      const quarterOptions = [
         { label: "Q1", value: 1 },
         { label: "Q2", value: 2 },
         { label: "Q3", value: 3 },
         { label: "Q4", value: 4 },
      ];

      const scheduleMeeting = () => {
         if (selectedShepherdId.value && selectedQuarter.value && selectedYear.value) {
            peopleStore.addMeeting(
               selectedShepherdId.value,
               props.person.id,
               parseInt(selectedQuarter.value),
               selectedYear.value
            );
            // Reset form
            selectedShepherdId.value = '';
            selectedQuarter.value = '';
            selectedYear.value = new Date().getFullYear();
         }
      };

      return {
         selectedShepherdId,
         selectedQuarter,
         selectedYear,
         shepherdOptions,
         quarterOptions,
         scheduleMeeting
      };
   }
});
</script>
