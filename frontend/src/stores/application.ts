import { ref } from "vue";
import { defineStore } from "pinia";
import { createHttpApi } from "@/api/http";
import { createWebSocketApi } from "@/api/websocket";

export const useApplicationStore = defineStore("application", () => {
  const initialize = async () => {
    initializePassword();
    if (password.value) {
      try {
        await authenticate(password.value);
      } catch (error) {
        console.warn("Auto-login failed: ", error);
        clearPassword();
      }
    }
  };

  /* Password & Auth */
  const isAuthenticated = ref<boolean>(false);
  const isAuthenticating = ref<boolean>(false);
  const password = ref<string>("");
  const authErrorMessage = ref<string | null>(null);
  const setPassword = (newPassword: string) => {
    password.value = newPassword;
    localStorage.setItem("cloud_light_password", newPassword);
  };
  const initializePassword = () => {
    password.value = localStorage.getItem("cloud_light_password") || "";
  };
  const clearPassword = () => {
    password.value = "";
    localStorage.removeItem("cloud_light_password");
  };
  const authenticate = async (password: string) => {
    const httpApi = createHttpApi(password);
    const websocketApi = createWebSocketApi(password);
    websocketApi.onMessage((message) => {
      console.log("Message received:", message);
    });
    websocketApi.onStateChange((state) => {
      console.log("State changed:", state);
    });
    websocketApi.onError((error) => {
      console.error("Error:", error);
    });
    isAuthenticating.value = true;
    try {
      await httpApi.getDevices();
      websocketApi.connect();
      isAuthenticated.value = true;
      setPassword(password);
    } catch (error) {
      isAuthenticated.value = false;
      clearPassword();
      if (error instanceof Error) {
        authErrorMessage.value = error.message;
      } else {
        authErrorMessage.value = "Something went wrong. Please try again.";
      }
      throw error;
    } finally {
      isAuthenticating.value = false;
    }
  };

  return {
    initialize,
    isAuthenticated,
    password,
    authenticate,
    isAuthenticating,
    authErrorMessage,
  };
});
