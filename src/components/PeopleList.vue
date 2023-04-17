<template>
  <div>
    <h2>People List</h2>
    <ul>
      <li v-for="person in people" :key="person.id">
        {{ person.name }}
        <button @click="removePerson(person.id)">Remove</button>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { usePeopleStore } from '@/stores/people';

export default defineComponent({
  setup() {
    const peopleStore = usePeopleStore();

    const removePerson = (personId: string) => {
      peopleStore.removePerson(personId);
    };

    return {
      people: peopleStore.$state.people,
      removePerson,
    };
  },
});
</script>

