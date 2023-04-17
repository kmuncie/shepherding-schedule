<!-- src/components/AddPerson.vue -->
<template>
  <div>
    <h3>Add Person</h3>
    <form @submit.prevent="submitForm">
      <label for="name">Name:</label>
      <input type="text" id="name" v-model="name" required />

      <label for="role">Role:</label>
      <select id="role" v-model="role" required>
        <option value="shepherd">Shepherd</option>
        <option value="sheep">Sheep</option>
      </select>

      <button type="submit">Add Person</button>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { usePeopleStore } from '@/stores/people';

export default defineComponent({
  name: 'AddPerson',
  setup() {
    const peopleStore = usePeopleStore();
    const name = ref('');
    const role = ref('shepherd');

    const submitForm = () => {
      const person = {
        id: Date.now(),
        name: name.value,
        role: role.value,
      };

      peopleStore.addPerson(person);
      name.value = '';
      role.value = 'shepherd';
    };

    return { name, role, submitForm };
  },
});
</script>

