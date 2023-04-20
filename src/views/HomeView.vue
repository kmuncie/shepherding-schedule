<!-- src/views/Home.vue -->
<template>
  <div class="home-grid">
    <ShepherdsList />
    <SheepList />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ShepherdsList from '@/components/ShepherdsList.vue';
import SheepList from '@/components/SheepList.vue';

export default defineComponent({
  components: {
    ShepherdsList,
    SheepList,
},
});
</script>

<style scoped>
.home-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
</style>