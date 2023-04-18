<template>
  <div>
    <h2>Add a new person</h2>
    <input v-model="newPersonName" placeholder="Enter name" />
    <button @click="addNewPerson">Add Person</button>
    <h2>People List</h2>
    <ul>
      <li v-for="person in people" :key="person.id">
        {{ person.name }}
        <button @click="confirmRemovePerson(person)">
          {{ person.confirmRemoval ? 'Confirm Removal' : 'Remove' }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue';
import { usePeopleStore } from '@/stores/people';

export default {
  setup() {
    const peopleStore = usePeopleStore();
    const newPersonName = ref('');

    const addNewPerson = () => {
      if (newPersonName.value.trim()) {
        peopleStore.addPerson(newPersonName.value.trim());
        newPersonName.value = '';
      }
    };

    const confirmRemovePerson = (person) => {
      if (person.confirmRemoval) {
        peopleStore.deletePerson(person.id);
      } else {
        person.confirmRemoval = true;
      }
    };

    return {
      people: peopleStore.people,
      newPersonName,
      addNewPerson,
      confirmRemovePerson,
    };
  },
};
</script>

