<template>
  <div>
    <h1>People Management</h1>

    <h2>Add Person</h2>
    <form @submit.prevent="addNewPerson">
      <div>
        <label for="name">Name:</label>
        <input id="name" v-model="newPerson.name" type="text" placeholder="Name" required />
      </div>
      <div>
        <label for="location">Location:</label>
        <input id="location" v-model="newPerson.location" type="text" placeholder="Location" required />
      </div>
      <div>
        <input id="role" type="checkbox" v-model="newPerson.role" true-value="shepherd" false-value="sheep" />
        <label for="role">Shepherd</label>
      </div>
      <button type="submit">Add Person</button>
    </form>
  </div>
</template> 

<script lang="ts">
import { ref } from 'vue';
import { usePeopleStore } from '@/stores/people';

export default {
  setup() {
    const newPerson = ref({ name: '', location: '', role: 'shepherd' });
    const peopleStore = usePeopleStore();

    const addNewPerson = () => {
      if (newPerson.value.name && newPerson.value.location) {
        peopleStore.addPerson(newPerson.value.name, newPerson.value.location, newPerson.value.role);
        newPerson.value = { name: '', location: '', role: 'shepherd' };
      }
    };

    return {
      newPerson,
      addNewPerson,
    };
  },
};
</script>
