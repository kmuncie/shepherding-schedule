<!-- src/views/Home.vue -->
<template>
  <div>
    <h1>People</h1>
    <PeopleList />
    <AddPerson />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PeopleList from '@/components/PeopleList.vue';
import AddPerson from '@/components/AddPerson.vue';

export default defineComponent({
  name: 'Home',
  components: {
    PeopleList,
    AddPerson,
  },
});
</script>
