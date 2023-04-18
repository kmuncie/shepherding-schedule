import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PeopleManagementView from '@/views/PeopleManagementView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/people-management',
      name: 'PeopleManagement',
      component: () => import('../views/PeopleManagementView.vue')
    },
  ]
})

export default router
