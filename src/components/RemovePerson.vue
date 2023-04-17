<!-- src/components/RemovePerson.vue -->
<template>
  <div>
    <h3>Remove Person</h3>
    <ul>
      <li v-for="person in people" :key="person.id">
        {{ person.name }} - {{ person.role }}
        <button @click="removePerson(person.id)">Remove</button>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { usePeopleStore } from '@/stores/people';

export default defineComponent({
  name: 'RemovePerson',
  setup() {
    const peopleStore = usePeopleStore();
    const people = peopleStore.$state.people;

    const removePerson = (personId: number) => {
      peopleStore.deletePerson(personId);
    };

    return { people, removePerson };
  },
});
</script>

