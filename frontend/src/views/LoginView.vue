<script setup lang="ts">
import { onBeforeMount, computed, ref, useTemplateRef } from "vue";
import { useRouter, useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { useApplicationStore } from "@/stores/application";
import BusySpinner from "@/components/BusySpinner.vue";

const applicationStore = useApplicationStore();

const { authErrorMessage } = storeToRefs(applicationStore);
onBeforeMount(() => {
  authErrorMessage.value = null;
  autoLoginFromToken();
});

const router = useRouter();
const route = useRoute();
const loading = ref(false);

async function autoLoginFromToken() {
  const token = route.query.token as string | undefined;
  if (!token) return;
  password.value = token;
  await submit();
}

async function submit() {
  loading.value = true;
  try {
    await applicationStore.authenticate(password.value);
  } catch {
    // do nothing
  } finally {
    loading.value = false;
    if (applicationStore.isAuthenticated) {
      router.push((route.query.redirect as string) || "/devices");
    }
  }
}

const password = ref("");

function clearInput() {
  password.value = "";
  focusInput();
}
const passwordInput = useTemplateRef("password-input");
function focusInput() {
  passwordInput.value?.focus();
}

const copyright = computed(() => {
  return `Copyright © ${new Date().getFullYear()} Silicon Laboratories. All rights reserved.`;
});
</script>

<template>
  <div class="h-screen w-full overflow-x-clip py-24 text-center">
    <div class="mb-12">
      <img
        src="/images/silicon-labs-white-logo.svg"
        alt="Silicon Labs logo"
        class="mx-auto mb-12 flex w-[320px]"
      />

      <div class="mx-auto w-[360px] rounded-2xl bg-white px-12 py-8 text-center shadow-lg">
        <h1>
          <img src="/images/amazon-sidewalk.svg" alt="Amazon Sidewalk logo" class="mb-4" />
        </h1>
        <p class="mb-6 text-sl-gray-900">Enter application password to continue</p>

        <div v-if="loading || applicationStore.isAuthenticating">
          <BusySpinner class="mx-auto my-16 w-full" />
          <p class="mx-auto w-[200px] text-sl-gray-800">Logging in</p>
        </div>
        <form v-else @submit.prevent="submit">
          <label for="password" class="sr-only">Enter application password</label>
          <div class="relative text-right">
            <input
              type="password"
              v-model="password"
              name="password"
              ref="password-input"
              required
              class="w-full rounded border border-sl-gray-300 px-3 py-3 text-center text-[14px] placeholder-sl-gray-400 focus:border-sl-blue-500 focus:ring-sl-blue-500 sm:max-w-xs"
              placeholder="Password"
              autofocus
            />
            <a
              aria-label="clear password input"
              @click="clearInput()"
              class="cursor-pointer text-sm text-sl-gray-500 hover:text-sl-blue-500"
              >clear password</a
            >
          </div>
          <p v-if="authErrorMessage" class="mt-4 text-red-500">
            {{ authErrorMessage }}
          </p>
          <button
            type="submit"
            :disabled="loading"
            class="mt-8 flex w-full items-center justify-center rounded border border-transparent bg-sl-blue-500 p-2 text-base font-medium text-white uppercase hover:bg-sl-blue-700 focus:ring-2 focus:ring-sl-blue-500 focus:ring-offset-2 focus:outline-none"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
    <div class="w-full text-[10px] text-white">
      {{ copyright }}
    </div>
  </div>
</template>
