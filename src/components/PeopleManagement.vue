<template>
   <div>
      <h1>People Management</h1>

      <h2>Add Person</h2>
      <q-form @submit="addNewPerson" class="q-gutter-md">
         <q-input dense filled v-model="newPerson.name" type="text" placeholder="Name" required>
            <template v-slot:prepend>
               <q-icon name="person" />
            </template>
         </q-input>
         <q-input dense filled v-model="newPerson.location" type="text" placeholder="Location" required>
            <template v-slot:prepend>
               <q-icon name="place" />
            </template>
         </q-input>
         <q-toggle v-model="newPerson.role" label="Shepherd" true-value="shepherd" false-value="sheep" />
         <q-btn color="primary" label="Add Person" type="submit" />
      </q-form>
   </div>
</template>

<script lang="ts">
import { ref } from 'vue';
import { usePeopleStore } from '@/stores/people';

export default {
   setup() {
      const newPerson = ref({ name: '', location: '', role: 'sheep' });
      const peopleStore = usePeopleStore();

      const addNewPerson = () => {
         if (newPerson.value.name && newPerson.value.location) {
            peopleStore.addPerson(newPerson.value.name, newPerson.value.location, newPerson.value.role);
            newPerson.value = { name: '', location: '', role: 'sheep' };
         }
      };

      return {
         newPerson,
         addNewPerson,
      };
   },
};
</script>
