<script setup lang="ts">
import { ref } from "vue";
import {
  clearData,
  CONFIG,
  createData,
  swapData,
  updateData,
  type DataRecord,
} from "@shared/config";

type BenchmarkState = "empty" | "created" | "updated" | "swapped" | "cleared";

const data = ref<DataRecord[]>([]);
const benchmarkState = ref<BenchmarkState>("empty");

const renderCell = (row: DataRecord, header: keyof DataRecord): string => {
  const value = row[header];
  return Array.isArray(value) ? value.join(", ") : String(value);
};

const createRows = () => {
  data.value = createData();
  benchmarkState.value = "created";
};

const updateRows = () => {
  data.value = updateData(data.value);
  benchmarkState.value = "updated";
};

const swapRows = () => {
  data.value = swapData(data.value);
  benchmarkState.value = "swapped";
};

const clearRows = () => {
  data.value = clearData();
  benchmarkState.value = "cleared";
};
</script>

<template>
  <div :data-benchmark-state="benchmarkState">
    <h1>{{ CONFIG.UI_TEXT.TITLE }} - External Benchmark</h1>

    <div data-benchmark-controls>
      <button data-benchmark-action="create" type="button" @click="createRows">
        {{ CONFIG.BUTTON_LABELS.CREATE }}
      </button>
      <button data-benchmark-action="update" type="button" @click="updateRows">
        {{ CONFIG.BUTTON_LABELS.UPDATE }}
      </button>
      <button data-benchmark-action="swap" type="button" @click="swapRows">
        {{ CONFIG.BUTTON_LABELS.SWAP }}
      </button>
      <button data-benchmark-action="clear" type="button" @click="clearRows">
        {{ CONFIG.BUTTON_LABELS.CLEAR }}
      </button>
    </div>

    <div style="overflow: auto; max-height: 40vh; margin-top: 1rem">
      <p v-if="data.length === 0">{{ CONFIG.UI_TEXT.EMPTY_TABLE }}</p>
      <table
        v-else
        border="1"
        data-benchmark-table
        style="border-collapse: collapse"
      >
        <thead>
          <tr>
            <th v-for="header in CONFIG.TABLE_HEADERS" :key="header">
              {{ header }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, rowIndex) in data"
            :key="row.uuid"
            data-benchmark-row
            :data-row-index="rowIndex"
            :data-row-id="row.uuid"
          >
            <td
              v-for="header in CONFIG.TABLE_HEADERS"
              :key="header"
              :data-column="header"
            >
              {{ renderCell(row, header) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
