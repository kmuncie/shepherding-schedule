<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <h1>Shepherding Scheduling</h1>
    <nav>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/people">People</RouterLink>
      <RouterLink to="/meetings">Meetings</RouterLink>

    </nav>
  </header>

  <RouterView class="routerView"/>
</template>

<style scoped>

header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: baseline;
}

h1 {
  margin: 0;
}

nav {
  display: flex;
  align-items: center;
  text-align: center;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {

}
</style>
