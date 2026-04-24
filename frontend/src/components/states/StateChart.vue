<script setup lang="ts">
import { ref, watch, onMounted } from "vue";

const props = defineProps<{
  values: string[];
}>();

const canvasContainer = ref<HTMLElement>();

const CHART_W = 280;
const CHART_H = 140;
const PAD_LEFT = 36;
const PAD_TOP = 8;
const PAD_BOTTOM = 4;
const PLOT_W = CHART_W - PAD_LEFT;
const PLOT_H = CHART_H - PAD_TOP - PAD_BOTTOM;

function niceRange(min: number, max: number): { lo: number; hi: number; step: number } {
  if (min === max) {
    const margin = Math.max(Math.abs(min) * 0.1, 1);
    min -= margin;
    max += margin;
  }
  const range = max - min;
  const rough = range / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const candidates = [1, 2, 5, 10];
  const step = mag * (candidates.find((c) => c * mag >= rough) ?? 10);
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  return { lo, hi, step };
}

function render() {
  if (!canvasContainer.value) return;

  const canvas = document.createElement("canvas");
  canvas.width = CHART_W;
  canvas.height = CHART_H;
  canvasContainer.value.replaceChildren(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const nums = props.values.map((v) => parseFloat(v)).filter((n) => !isNaN(n));
  if (nums.length === 0) return;

  const dataMin = Math.min(...nums);
  const dataMax = Math.max(...nums);
  const { lo, hi, step } = niceRange(dataMin, dataMax);
  const yRange = hi - lo;

  ctx.clearRect(0, 0, CHART_W, CHART_H);

  // Y axis + grid lines
  ctx.font = "11px Inter,Helvetica,Arial,sans-serif";
  ctx.textAlign = "end";
  ctx.textBaseline = "middle";
  for (let v = lo; v <= hi + step * 0.01; v += step) {
    const y = PAD_TOP + PLOT_H - ((v - lo) / yRange) * PLOT_H;
    ctx.fillStyle = "#7C7C7C";
    ctx.fillText(Number.isInteger(v) ? String(v) : v.toFixed(1), PAD_LEFT - 4, y);
    ctx.beginPath();
    ctx.strokeStyle = "#E5E5E5";
    ctx.lineWidth = 1;
    ctx.moveTo(PAD_LEFT, y);
    ctx.lineTo(PAD_LEFT + PLOT_W, y);
    ctx.stroke();
  }

  // Axes
  ctx.beginPath();
  ctx.strokeStyle = "#7C7C7C";
  ctx.lineWidth = 2;
  ctx.moveTo(PAD_LEFT, PAD_TOP);
  ctx.lineTo(PAD_LEFT, PAD_TOP + PLOT_H);
  ctx.lineTo(PAD_LEFT + PLOT_W, PAD_TOP + PLOT_H);
  ctx.stroke();

  // Plot line
  if (nums.length < 2) {
    const y = PAD_TOP + PLOT_H - ((nums[0]! - lo) / yRange) * PLOT_H;
    ctx.beginPath();
    ctx.arc(PAD_LEFT + PLOT_W / 2, y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = "#0f766e";
    ctx.fill();
    return;
  }

  const xStep = PLOT_W / (nums.length - 1);

  ctx.beginPath();
  ctx.strokeStyle = "#0f766e";
  ctx.lineWidth = 2;
  nums.forEach((v, i) => {
    const x = PAD_LEFT + i * xStep;
    const y = PAD_TOP + PLOT_H - ((v - lo) / yRange) * PLOT_H;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Dots
  ctx.fillStyle = "#0f766e";
  nums.forEach((v, i) => {
    const x = PAD_LEFT + i * xStep;
    const y = PAD_TOP + PLOT_H - ((v - lo) / yRange) * PLOT_H;
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, 2 * Math.PI);
    ctx.fill();
  });
}

onMounted(render);
watch(() => props.values.length, render);
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <div ref="canvasContainer" :style="{ width: CHART_W + 'px', height: CHART_H + 'px' }"></div>
    <div v-if="props.values.length > 0" class="text-sm text-sl-gray-700">
      <span class="pr-2">Current:</span>
      <span class="font-bold">{{ props.values[props.values.length - 1] }}</span>
    </div>
  </div>
</template>
