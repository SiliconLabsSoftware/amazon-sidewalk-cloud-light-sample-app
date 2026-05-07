/***************************************************************************//**
 * @file
 * @brief Vue Router routes, lazy views, and login/auth navigation guards.
 *******************************************************************************
 * # License
 * <b>Copyright 2026 Silicon Laboratories Inc. www.silabs.com</b>
 *******************************************************************************
 *
 * SPDX-License-Identifier: LicenseRef-MSLA
 *
 * The licensor of this software is Silicon Laboratories Inc. Your use of this
 * software is governed by the terms of the Silicon Labs Master Software License
 * Agreement (MSLA) available at
 * www.silabs.com/about-us/legal/master-software-license-agreement
 * By installing, copying or otherwise using this software, you agree to the
 * terms of the MSLA.
 *
 ******************************************************************************/
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
    const query: Record<string, string> = { redirect: to.path };
    if (typeof to.query.token === "string") {
      query.token = to.query.token;
    }
    return { name: "login", query };
  }
});

export default router;
