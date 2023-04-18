<template>
    <div>
      <h2>Meetings Management</h2>
      <form @submit.prevent="addNewMeeting">
        <label for="personId">Select Person:</label>
        <select v-model="selectedPersonId" id="personId" required>
          <option disabled value="">Choose a person</option>
          <option v-for="person in people" :key="person.id" :value="person.id">
            {{ person.name }}
          </option>
        </select>
  
        <label for="partnerId">Select Meeting Partner:</label>
        <select v-model="selectedPartnerId" id="partnerId" required>
          <option disabled value="">Choose a partner</option>
          <option
            v-for="person in people"
            :key="person.id"
            :value="person.id"
            :disabled="person.id === selectedPersonId"
          >
            {{ person.name }}
          </option>
        </select>
  
        <label for="quarter">Select Quarter:</label>
        <select v-model="selectedQuarter" id="quarter" required>
          <option disabled value="">Choose a quarter</option>
          <option v-for="quarter in 4" :key="quarter" :value="quarter">
            {{ quarter }}
          </option>
        </select>
  
        <label for="year">Enter Year:</label>
        <input v-model="selectedYear" id="year" type="number" required />
  
        <button type="submit">Add Meeting</button>
      </form>
  
      <h3>Meetings</h3>
      <ul>
        <li v-for="person in people" :key="person.id">
          <strong>{{ person.name }}'s Meetings:</strong>
          <ul>
            <li v-for="meeting in person.meetings" :key="meeting.id">
              {{ getPartnerName(meeting.partnerId) }} - Q{{ meeting.quarter }} {{ meeting.year }}
              <input
                type="checkbox"
                v-model="meeting.completed"
                @change="updateMeetingCompletion(person.id, meeting.id, meeting.completed)"
                /> Completed
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref } from 'vue';
  import { usePeopleStore } from '@/stores/people';
  
  export default defineComponent({
    setup() {
      const peopleStore = usePeopleStore();
  
      const selectedPersonId = ref('');
      const selectedPartnerId = ref('');
      const selectedQuarter = ref('');
      const selectedYear = ref('');
  
        const addNewMeeting = () => {
        if (selectedPersonId.value && selectedPartnerId.value && selectedQuarter.value && selectedYear.value) {
            peopleStore.addMeeting(
            selectedPersonId.value,
            selectedPartnerId.value,
            Number(selectedQuarter.value),
            Number(selectedYear.value)
            );
            resetForm();
        }
        };
  
      const resetForm = () => {
        selectedPersonId.value = '';
        selectedPartnerId.value = '';
        selectedQuarter.value = '';
        selectedYear.value = '';
      };
  
      const getPartnerName = (partnerId: string) => {
        const partner = peopleStore.$state.people.find((person) => person.id === partnerId);
        return partner ? partner.name : '';
      };
  
      const updateMeetingCompletion = (personId: string, meetingId: string, completed: boolean) => {
        peopleStore.updateMeetingCompletion(personId, meetingId, completed);
      };
  
      return {
        people: peopleStore.$state.people,
        selectedPersonId,
        selectedPartnerId,
        selectedQuarter,
        selectedYear,
        addNewMeeting,
        getPartnerName,
        updateMeetingCompletion,
      };
    },
  });
  </script>
  