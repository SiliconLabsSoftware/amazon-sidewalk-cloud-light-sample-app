import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";

import initializeStores from "./boot/stores";

const app = createApp(App);

app.use(createPinia());
app.use(router);

initializeStores();

app.mount("#app");
