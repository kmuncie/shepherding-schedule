<template>
  <div>
    <h2>People List</h2>
    <div class="card-container">
      <q-card bordered class="full-width" v-for="person in sortedPeople" :key="person.id">
        <q-card-section :class="{'text-deep-orange-6': person.role === 'shepherd'}">
          <h3>{{ person.name }}</h3>
          <p class="text-subtitle1 q-ma-none">{{ person.location }} 
            <span v-if="person.role === 'shepherd'"> (Shepherd)</span>
          </p>
        </q-card-section>      
        <q-separator />
        <q-card-actions class="justify-around q-px-md">
            <q-btn flat round color="gray" icon="delete" v-if="!person.confirmRemoval" @click="toggleConfirmation(person)"></q-btn>
            <q-btn flat round color="red" icon="delete_forever" v-else @click="removePerson(person.id)"></q-btn>
        </q-card-actions>
    </q-card>
  </div>
</div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
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

    const sortedPeople = computed(() => {
      return peopleStore.people.slice().sort((a, b) => a.name.localeCompare(b.name));
    });

    return {
      people: peopleStore.$state.people,
      removePerson,
      toggleConfirmation,
      sortedPeople,
    };
  },
});
</script>

<style scoped>
.card-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 1024px) {
  .card-container {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

h3 {
  margin: 0;
  font-size: 1.5rem;
  line-height: 1.5;
}

</style>
