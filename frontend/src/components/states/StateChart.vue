<script setup lang="ts">
import { computed, ref, reactive, watch } from "vue";

const el = ref();

const props = defineProps({
  low: Number,
  high: Number,
  thekey: String,
  value: Number,
  values: {
    type: Array,
  },
});

interface IValues {
  at: number;
  value: string;
}

const values = reactive(props.values || []);

interface IPlotMetrics {
  axesXStart: number;
  axesYStart: number;
  elapsedTime: number;
  min: number;
  minTime: number;
  max: number;
  maxTime?: number;
  width: number;
  height: number;
}

const plotMetrics: IPlotMetrics = {
  axesXStart: 30,
  axesYStart: 5,
  elapsedTime: 0,
  min: -Infinity,
  minTime: 0,
  max: Infinity,
  maxTime: 0,
  width: 250,
  height: 130,
};

function drawAxes(ctx: any) {
  ctx.beginPath();
  ctx.moveTo(plotMetrics.axesXStart, plotMetrics.axesYStart);
  ctx.lineTo(plotMetrics.axesXStart, plotMetrics.axesYStart + plotMetrics.height);
  ctx.lineTo(
    plotMetrics.axesXStart + plotMetrics.width,
    plotMetrics.axesYStart + plotMetrics.height,
  );
  ctx.strokeWidth = 2;
  ctx.strokeStyle = "#7C7C7C";
  ctx.stroke();
}

function drawMeasureMarkers(ctx: any) {
  // Determine min and max values from our values
  let temps: number[] = [];
  let times: number[] = [];
  if (values) {
    temps = values?.map((v: any) => parseInt(v.value));
    times = values?.map((v: any) => parseInt(v.at));

    // Truncate to a second per pixel
    if (times.length > plotMetrics.width) {
      times.splice(0, times.length - plotMetrics.width);
    }

    plotMetrics.minTime = times[0];
    plotMetrics.maxTime = times[times.length - 1];
    plotMetrics.elapsedTime = (plotMetrics.maxTime - plotMetrics.minTime) / 1000;
  }

  const min: number = Math.min(...temps);
  const max: number = Math.max(...temps);

  plotMetrics.min = min % 10 > 0 ? min - (min % 10) : min;
  plotMetrics.max = max % 10 > 0 ? max + (10 - (max % 10)) : max;
  const labelCenterOffset = 4;

  const steps = (plotMetrics.max - plotMetrics.min) / 10;
  const stepAmount = Math.floor((plotMetrics.height - plotMetrics.axesYStart) / steps);
  ctx.font = "12px Inter,Helvetica,Arial,sans-serif";
  ctx.fillStyle = "#7C7C7C";
  ctx.textAlign = "end";
  ctx.fillText(plotMetrics.min, 25, plotMetrics.height + labelCenterOffset);
  for (let i = 1; i <= steps; i++) {
    ctx.fillText(
      plotMetrics.min + i * 10,
      25,
      plotMetrics.height + labelCenterOffset - stepAmount * i,
    );
  }

  drawAlarmMarkers(ctx, plotMetrics.min, plotMetrics.max);
}

function drawAlarmMarkers(ctx: any, min: number, max: number) {
  // How many points are on the vertical marker
  const vHeight = plotMetrics.height;
  const vStep = vHeight / (max - min);
  const alarmInset = 5;

  // Determine low alarm if one is present
  if (props.low) {
    const low = props.low - min;
    const alarmY = vHeight + plotMetrics.axesYStart - low * vStep;

    ctx.beginPath();
    ctx.strokeStyle = "#C2C2C2";
    ctx.setLineDash([2]);
    ctx.moveTo(plotMetrics.axesXStart + alarmInset, alarmY);
    ctx.lineTo(plotMetrics.axesXStart + plotMetrics.width - alarmInset, alarmY);
    ctx.stroke();
  }

  // Determine high alarm if one is present
  if (props.high) {
    const high = props.high - min;
    const alarmY = vHeight + plotMetrics.axesYStart - high * vStep;

    ctx.beginPath();
    ctx.strokeStyle = "#C2C2C2";
    ctx.setLineDash([2]);
    ctx.moveTo(plotMetrics.axesXStart + alarmInset, alarmY);
    ctx.lineTo(plotMetrics.axesXStart + plotMetrics.width - alarmInset, alarmY);
    ctx.stroke();
  }
}

function plot(ctx: any) {
  ctx.setLineDash([]);
  ctx.strokeStyle = "#7C7C7C";

  const min = plotMetrics.min;
  const max = plotMetrics.max;

  let atmin = Infinity;
  let atmax = plotMetrics.axesXStart + plotMetrics.width;
  const yStep = (plotMetrics.height + plotMetrics.axesYStart) / (max - min);

  let truncatedValues;
  const totalInputs = 50;
  if (values.length <= totalInputs) {
    truncatedValues = values;
  } else {
    truncatedValues = values.splice(0, 1);
  }
  if (truncatedValues) {
    truncatedValues.forEach((a: any) => {
      if (a.at > atmax) {
        atmax = a.at;
      }
      if (a.at < atmin) {
        atmin = a.at;
      }
    });
    const xf = plotMetrics.width / (atmax - atmin);

    let first = true;
    ctx.beginPath();
    values.forEach((a: any) => {
      if (first) {
        ctx.moveTo(plotMetrics.axesXStart + 1, plotMetrics.axesYStart);
        first = false;
      }

      const x = (a.at - atmin) * xf;
      const y = (max - a.value) * yStep;

      ctx.lineTo(plotMetrics.axesXStart + x, y);
      renderDot(ctx, plotMetrics.axesXStart + x, y);
    });
    ctx.stroke();
  }
}

function renderDot(ctx: any, x: number, y: number) {
  ctx.arc(x, y, 3, 0, 2 * Math.PI, false);
  ctx.stroke();
}

function render() {
  const width = el.value?.offsetWidth;
  const height = el.value?.offsetHeight;
  const paper = document.createElement("canvas");
  paper.setAttribute("width", width);
  paper.setAttribute("height", height);
  el.value?.replaceChildren(paper);
  const ctx = paper.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, width, height);
    drawAxes(ctx);
    drawMeasureMarkers(ctx);
    plot(ctx);
  }
}

const alarmTrigger = computed(() => {
  if (props.value && props.low) {
    if (props.value <= props.low) {
      return true;
    }
  }
  if (props.value && props.high) {
    if (props.value >= props.high) {
      return true;
    }
  }
  return false;
});

const alarmStyle = computed(() => {
  return alarmTrigger.value ? "bg-sl-red-500" : "bg-sl-blue-500";
});

watch(values, () => {
  render();
});
</script>

<template>
  <div class="relative">
    <div ref="el" style="width: 295px; height: 160px"></div>
    <div
      class="absolute top-[-40px] left-[-44px] h-[28px] w-[28px] rounded-full border-2 border-white shadow-md"
      :class="alarmStyle"
    >
      <img
        v-show="alarmTrigger"
        src="/images/exclamation-icon.svg"
        alt="Exclamation"
        class="h=[20px] relative top-[2px] left-[2px] w-[20px]"
      />
      <img v-show="!alarmTrigger" src="/images/checkmark-icon.svg" alt="Checkmark" />
    </div>
  </div>
</template>
