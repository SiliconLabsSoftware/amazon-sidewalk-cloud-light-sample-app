import { ref } from "vue";

export function useTemporaryEffect(timeout: number) {
  let timerHandle: number | undefined = undefined;
  const active = ref(false);

  const reset = () => {
    clearTimeout(timerHandle);
  };
  const begin = () => {
    active.value = true;
    timerHandle = setTimeout(() => (active.value = false), timeout);
  };

  return { active, begin, reset };
}
