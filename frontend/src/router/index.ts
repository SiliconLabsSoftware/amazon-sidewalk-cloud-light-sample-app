import { createRouter, createWebHistory } from "vue-router";
import { useApplicationStore } from "@/stores/application";

const MainLayout = () => import("@/layouts/MainLayout.vue");
const AuthLayout = () => import("@/layouts/AuthLayout.vue");

const DevicesView = () => import("@/views/DevicesView.vue");
const DeviceView = () => import("@/views/DeviceView.vue");
const NotFoundView = () => import("@/views/NotFoundView.vue");
const LoginView = () => import("@/views/LoginView.vue");

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: NotFoundView,
    },
    {
      path: "/",
      component: MainLayout,
      children: [
        { path: "", name: "home", component: DevicesView },
        { path: "devices", name: "devices", component: DevicesView },
        { path: "devices/:deviceId", name: "device", component: DeviceView },
      ],
    },
    {
      path: "/",
      component: AuthLayout,
      children: [{ path: "login", name: "login", component: LoginView }],
    },
  ],
});

router.beforeEach((to) => {
  const applicationStore = useApplicationStore();

  if (applicationStore.isAuthenticating && to.name !== "login") {
    return true; // let component handle loading
  }

  if (
    !applicationStore.isAuthenticating &&
    !applicationStore.isAuthenticated &&
    to.name !== "login"
  ) {
    return { name: "login", query: { redirect: to.fullPath } };
  }
});

export default router;
