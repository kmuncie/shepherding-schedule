<template>
  <div>
    <q-form @submit.prevent="addNewMeeting" class="q-gutter-md q-pa-md">
      <div>
        <q-select dense filled id="shepherd" v-model="selectedShepherdId" :options="shepherdOptions" label="Shepherd"
          option-value="id" option-label="name" emit-value map-options />
      </div>

      <div>
        <q-select dense filled id="sheep" v-model="selectedSheepId" :options="peopleOptions" label="Sheep"
          option-value="id" option-label="name" emit-value map-options />
      </div>

      <div>
        <q-select dense filled id="quarter" v-model="selectedQuarter" :options="quarterOptions" label="Quarter" emit-value
          map-options />
      </div>

      <div>
        <q-input dense filled id="year" type="number" min="2023" step="1" v-model.number="selectedYear" label="Year" />
      </div>

      <q-btn dense color="primary" type="submit" label="Add Meeting" />
    </q-form>

  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { usePeopleStore } from '@/stores/people';

export default defineComponent({
  setup() {
    const peopleStore = usePeopleStore();

    const selectedShepherdId = ref('');
    const selectedSheepId = ref('');
    const selectedQuarter = ref('');
    const selectedYear = ref('2024');

    // Filter out departed shepherds
    const shepherds = computed(() => {
      return peopleStore.$state.people.filter(person => person.role === 'shepherd' && !person.departed);
    });

    // Filter out departed people
    const availablePartners = computed(() => {
      return peopleStore.$state.people.filter(person => !person.departed && person.id !== selectedShepherdId.value);
    });

    const shepherdOptions = computed(() => shepherds.value.map(s => ({ id: s.id, name: s.name })));
    const peopleOptions = computed(() => availablePartners.value.map(p => ({ id: p.id, name: p.name })));

    const quarterOptions = [
      { label: "Q1", value: 1 },
      { label: "Q2", value: 2 },
      { label: "Q3", value: 3 },
      { label: "Q4", value: 4 },
    ];

    const addNewMeeting = () => {
      if (selectedShepherdId.value && selectedSheepId.value && selectedQuarter.value && selectedYear.value) {
        peopleStore.addMeeting(
          selectedShepherdId.value,
          selectedSheepId.value,
          parseInt(selectedQuarter.value),
          parseInt(selectedYear.value)
        );
        resetForm();
      }
    };

    const resetForm = () => {
      selectedShepherdId.value = '';
      selectedSheepId.value = '';
      selectedQuarter.value = '';
      selectedYear.value = '2023';
    };

    return {
      people: peopleStore.$state.people,
      availablePartners,
      shepherds,
      selectedShepherdId,
      selectedSheepId,
      selectedQuarter,
      selectedYear,
      shepherdOptions,
      peopleOptions,
      quarterOptions,
      addNewMeeting,
    };
  },
});
</script>
