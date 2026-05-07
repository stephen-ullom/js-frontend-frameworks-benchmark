<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue";
import {
  clearData,
  CONFIG,
  createData,
  monitor,
  swapData,
  updateData,
  type DataRecord,
} from "@shared/config";

type BenchmarkResult = { action: string; duration: number };

const data = ref<DataRecord[]>([]);
const results = ref<BenchmarkResult[]>([]);
const step = ref<number>(1);

const resultsBuffer: BenchmarkResult[] = [];

onMounted(() => {
  setTimeout(() => {
    monitor.start(CONFIG.ACTION_TEXTS.CREATE);
    data.value = createData();
    step.value = 2;
  }, 500);
});

watch(
  step,
  (newStep, _oldStep, onCleanup) => {
    const measurement = monitor.stop();
    if (measurement) {
      resultsBuffer.push({
        action: measurement.name,
        duration: measurement.duration,
      });
    }

    if (newStep > 1 && newStep < 5 && measurement) {
      const timer = setTimeout(() => {
        if (newStep === 2) {
          monitor.start(CONFIG.ACTION_TEXTS.UPDATE);
          data.value = updateData(data.value);
          step.value = 3;
        } else if (newStep === 3) {
          monitor.start(CONFIG.ACTION_TEXTS.SWAP);
          data.value = swapData(data.value);
          step.value = 4;
        } else if (newStep === 4) {
          monitor.start(CONFIG.ACTION_TEXTS.CLEAR);
          data.value = clearData();
          step.value = 5;
        }
      }, 500);
      onCleanup(() => clearTimeout(timer));
    }

    if (newStep === 5) {
      results.value = [...resultsBuffer];
    }
  },
  { flush: "post" }
);

const renderCell = (row: DataRecord, header: keyof DataRecord): string => {
  const value = row[header];
  return Array.isArray(value) ? value.join(", ") : String(value);
};

const isRunning = computed(() => step.value > 0 && step.value <= 4);
</script>

<template>
  <div>
    <h1>{{ CONFIG.UI_TEXT.TITLE }} - Automated Benchmark</h1>

    <h3 v-if="isRunning" style="color: blue">
      Running Benchmark... (Step {{ step }} of 4)
    </h3>

    <div
      v-if="step === 5"
      style="margin-bottom: 2rem; padding: 1rem; background-color: #f0f0f0"
    >
      <h2>Benchmark Results</h2>
      <table
        border="1"
        style="border-collapse: collapse; width: 100%; background-color: white"
      >
        <thead>
          <tr>
            <th style="padding: 8px">Action</th>
            <th style="padding: 8px">Duration (ms)</th>
          </tr>
        </thead>
        <pre></pre>
        <tbody>
          <tr v-for="(res, idx) in results" :key="idx">
            <td style="padding: 8px">{{ res.action }}</td>
            <td style="padding: 8px">
              <strong>{{ res.duration.toFixed(2) }}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px"><strong>Total Time</strong></td>
            <td style="padding: 8px">
              <strong>{{
                results.reduce((acc, curr) => acc + curr.duration, 0).toFixed(2)
              }}</strong>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="overflow: auto; max-height: 40vh; margin-top: 1rem">
      <p v-if="data.length === 0">{{ CONFIG.UI_TEXT.EMPTY_TABLE }}</p>
      <table v-else border="1" style="border-collapse: collapse">
        <thead>
          <tr>
            <th v-for="header in CONFIG.TABLE_HEADERS" :key="header">
              {{ header }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in data" :key="row.uuid">
            <td v-for="header in CONFIG.TABLE_HEADERS" :key="header">
              {{ renderCell(row, header) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
