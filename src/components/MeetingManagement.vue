<template>
  <div>
    <h2>Meetings Management</h2>

    <q-form @submit.prevent="addNewMeeting" class="q-gutter-md">
      <div>
        <q-select filled id="shepherd" v-model="selectedShepherdId" :options="shepherdOptions" label="Shepherd"
          option-value="id" option-label="name" emit-value map-options />
      </div>

      <div>
        <q-select filled id="sheep" v-model="selectedSheepId" :options="peopleOptions" label="Sheep" option-value="id"
          option-label="name" emit-value map-options />
      </div>

      <div>
        <q-select filled id="quarter" v-model="selectedQuarter" :options="quarterOptions" label="Quarter" emit-value
          map-options />
      </div>

      <div>
        <q-input filled id="year" type="number" min="2023" step="1" v-model.number="selectedYear" label="Year" />
      </div>

      <q-btn color="primary" type="submit" label="Add Meeting" />
    </q-form>

    <h3>Meetings</h3>
    <ul>
      <li v-for="person in people" :key="person.id">
        <strong>{{ person.name }}'s Meetings:</strong>
        <ul>
          <li v-for="meeting in person.meetings" :key="meeting.id">
            <div
              @click="() => { meeting.completed = !meeting.completed; updateMeetingCompletion(person.id, meeting.id, meeting.completed); }">
              <q-chip :class="{ 'bg-yellow-2': !meeting.completed }">
                {{ getPartnerName(meeting.sheepId) }} - Q{{ meeting.quarter }} {{ meeting.year }}
                <q-icon v-if="meeting.completed" name="check_circle" class="q-ml-xs" />
              </q-chip>
            </div>
          </li>

        </ul>
      </li>
    </ul>
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
    const selectedYear = ref('2023');

    const shepherdOptions = computed(() => shepherds.value.map((s) => ({ id: s.id, name: s.name })));
    const peopleOptions = computed(() => availablePartners.value.map((p) => ({ id: p.id, name: p.name })));
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

    const availablePartners = computed(() => {
      return peopleStore.$state.people.filter((person) => person.id !== selectedShepherdId.value);
    });

    const shepherds = computed(() => {
      return peopleStore.$state.people.filter(person => person.role === 'shepherd');
    });

    const getPartnerName = (partnerId: string) => {
      const partner = peopleStore.$state.people.find((person) => person.id === partnerId);
      return partner ? partner.name : '';
    };

    const updateMeetingCompletion = (personId: string, meetingId: string, completed: boolean) => {
      peopleStore.updateMeetingCompletion(personId, meetingId, completed);
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
      getPartnerName,
      updateMeetingCompletion,
    };
  },
});
</script>
  