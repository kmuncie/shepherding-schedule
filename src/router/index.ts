import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/people",
      name: "PeopleManagement",
      component: () => import("../views/PeopleManagementView.vue"),
    },
    {
      path: "/reports",
      name: "Reports",
      component: () => import("../views/ReportsView.vue"),
    },
    // {
    //   path: '/meetings',
    //   name: 'MeetingManagement',
    //   component: () => import('../views/MeetingManagementView.vue')
    // },
  ],
});

export default router;
