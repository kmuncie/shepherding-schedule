<template>
    <div class="shepherds-list">
      <h2>Shepherds List</h2>
      <div class="shepherds-grid">
        <q-card bordered class="full-width" v-for="shepherd in shepherds" :key="shepherd.id">
          <q-card-section>
            <h3 class="q-ma-none">{{ shepherd.name }}</h3>
            <p class="text-subtitle1 q-ma-none">{{ shepherd.location }}</p>
          </q-card-section>      
          <q-separator v-if="meeting in shepherd.meetings" />
          <ul>
            <li v-for="meeting in shepherd.meetings" :key="meeting.id">
              {{ getPersonNameById(meeting.sheepId) }} - Q{{ meeting.quarter }} {{
              meeting.year }} - {{ meeting.completed ? 'Completed' : 'Not completed' }}
            </li>
          </ul>
      </q-card>
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
  