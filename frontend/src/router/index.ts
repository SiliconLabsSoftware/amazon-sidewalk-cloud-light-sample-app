/***************************************************************************//**
 * @file
 * @brief Vue Router routes, lazy views, and login/auth navigation guards.
 *******************************************************************************
 * # License
 * <b>Copyright 2026 Silicon Laboratories Inc. www.silabs.com</b>
 *******************************************************************************
 *
 * SPDX-License-Identifier: Zlib
 *
 * The licensor of this software is Silicon Laboratories Inc.
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 * 1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 * 2. Altered source versions must be plainly marked as such, and must not be
 *    misrepresented as being the original software.
 * 3. This notice may not be removed or altered from any source distribution.
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
