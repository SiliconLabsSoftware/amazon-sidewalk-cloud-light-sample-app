import { ref } from "vue";
import { defineStore } from "pinia";
import { createHttpApi, HttpApi } from "@/api/http";
import { createWebSocketApi, WebSocketApi } from "@/api/websocket";
import type { WsMessage } from "@/api/apiTypes";
import { useDeviceStore } from "./device";

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

  /* APIs */
  const httpApi = ref<HttpApi | null>(null);
  const websocketApi = ref<WebSocketApi | null>(null);

  const deviceStore = useDeviceStore();
  const handleMessage = (message: WsMessage) => {
    console.log("Message received:", message);
    switch (message.type) {
      case "device_update":
        deviceStore.handleDeviceUpdate(message);
        break;
      case "tonk":
        deviceStore.handleTonk(message);
        break;
      case "error":
        console.error("Error:", message);
        break;
      default:
        console.warn("Unknown message type:", message.type);
        break;
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
    const newHttpApi = createHttpApi(password);
    const newWebsocketApi = createWebSocketApi(password);
    newWebsocketApi.onMessage(handleMessage);
    newWebsocketApi.onStateChange((state) => {
      console.log("State changed:", state);
    });
    newWebsocketApi.onError((error) => {
      console.error("Error:", error);
    });
    isAuthenticating.value = true;
    try {
      await newHttpApi.getDevices();
      newWebsocketApi.connect();
      isAuthenticated.value = true;
      httpApi.value = newHttpApi;
      websocketApi.value = newWebsocketApi;
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
    httpApi,
    websocketApi,
  };
});
