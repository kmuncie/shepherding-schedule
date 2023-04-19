<template>
    <div class="shepherds-list">
      <h2>Shepherds List</h2>
      <div class="shepherds-grid">
        <div class="shepherd-card" v-for="shepherd in shepherds" :key="shepherd.id">
          <h3>{{ shepherd.name }}</h3>
          <p class="location">{{ shepherd.location }}</p>
          <ul>
            <li v-for="meeting in shepherd.meetings" :key="meeting.id">
              {{ getPersonNameById(meeting.sheepId) }} - Q{{ meeting.quarter }} {{
              meeting.year }} - {{ meeting.completed ? 'Completed' : 'Not completed' }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  import { usePeopleStore } from '@/stores/people';
  
  export default defineComponent({
    setup() {
      const peopleStore = usePeopleStore();
  
      const shepherds = peopleStore.$state.people.filter((person) => person.role === 'shepherd');
  
      const getPersonNameById = (id: string) => {
        const person = peopleStore.$state.people.find((person) => person.id === id);
        return person ? person.name : '';
      };
  
      return {
        shepherds,
        getPersonNameById,
      };
    },
  });
  </script>
  
  <style scoped>
  .shepherds-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    grid-gap: 20px;
    margin: 20px;
  }
  
  .shepherd-card {
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 20px;
    background-color: #fff;
  }
  
  .location {
    font-size: 14px;
    color: #888;
    margin-bottom: 10px;
  }
  </style>
  