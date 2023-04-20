<template>
    <div>
      <h2>Meetings Management</h2>

      <form @submit.prevent="addNewMeeting">
      <div>
        <label for="shepherd">Shepherd:</label>
        <select id="shepherd" v-model="selectedShepherdId">
          <option value="">Select a shepherd</option>
          <option v-for="person in shepherds" :key="person.id" :value="person.id">{{ person.name }}</option>
        </select>
      </div>

      <div>
        <label for="sheep">Sheep:</label>
        <select id="sheep" v-model="selectedSheepId">
          <option value="">Select a sheep</option>
          <option v-for="person in people" :key="person.id" :value="person.id">{{ person.name }}</option>
        </select>
      </div>

      <div>
        <label for="quarter">Quarter:</label>
        <select id="quarter" v-model="selectedQuarter">
          <option value="1">Q1</option>
          <option value="2">Q2</option>
          <option value="3">Q3</option>
          <option value="4">Q4</option>
        </select>
      </div>

      <div>
        <label for="year">Year:</label>
        <input id="year" type="number" min="2023" step="1" v-model.number="selectedYear" />
      </div>

      <button type="submit">Add Meeting</button>
    </form>
  
      <h3>Meetings</h3>
      <ul>
        <li v-for="person in people" :key="person.id">
          <strong>{{ person.name }}'s Meetings:</strong>
          <ul>
            <li v-for="meeting in person.meetings" :key="meeting.id">
              {{ getPartnerName(meeting.sheepId) }} - Q{{ meeting.quarter }} {{ meeting.year }}
              <q-checkbox 
              v-model="meeting.completed"
              @change="updateMeetingCompletion(person.id, meeting.id, meeting.completed)"
              />
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
        selectedYear.value = '';
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
        addNewMeeting,
        getPartnerName,
        updateMeetingCompletion,
      };
    },
  });
  </script>
  