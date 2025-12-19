import { useApplicationStore } from "@/stores/application";

export default async function initializeStores() {
  await useApplicationStore().initialize();
}
