<template>
  <div>
    <h2>People List</h2>
    <div class="card-container">
      <div v-for="person in people" :key="person.id" class="card">
        <div class="name-role">
          <h3>{{ person.name }}</h3>
          <span :class="{'shepherd': person.role === 'shepherd'}">{{ person.role }}</span>
        </div>
        <p class="location">{{ person.location }}</p>
        <button v-if="!person.confirmRemoval" @click="toggleConfirmation(person)">Remove</button>
        <button v-else @click="removePerson(person.id)">Confirm Removal</button>
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

    const removePerson = (personId: string) => {
      peopleStore.deletePerson(personId);
    };

    const toggleConfirmation = (person: any) => {
      person.confirmRemoval = !person.confirmRemoval;
    };

    return {
      people: peopleStore.$state.people,
      removePerson,
      toggleConfirmation,
    };
  },
});
</script>

<style scoped>
.card-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.card {
  background-color: #f0f0f0;
  padding: 1rem;
  border-radius: 4px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 300px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.name-role {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.location {
  font-size: 0.9rem;
  color: #777;
  margin-bottom: 1rem;
}

.shepherd {
  color: #0070f3;
  font-weight: bold;
}
</style>
