import { ref } from "vue";
import { defineStore } from "pinia";

export const useApplicationStore = defineStore("application", () => {
  function initialize() {
    initializePassword();
  }

  /* Password & Auth */
  const isAuthenticated = ref<boolean>(true);
  const password = ref<string>("");
  const setPassword = (newPassword: string) => {
    password.value = newPassword;
    localStorage.setItem("password", newPassword);
  };
  function initializePassword() {
    password.value = localStorage.getItem("password") || "";
  }

  return { initialize, isAuthenticated, password, setPassword };
});
