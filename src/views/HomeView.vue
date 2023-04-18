<!-- src/views/Home.vue -->
<template>
  <div>
    <h1>People</h1>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PeopleList from '@/components/PeopleList.vue';

export default defineComponent({
  name: 'Home',
  components: {
    PeopleList,
  },
});
</script>
