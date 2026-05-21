import { Component, computed, signal } from '@angular/core';
import {
  BENCHMARK_ACTIONS,
  BENCHMARK_STATES,
  clearData,
  CONFIG,
  createData,
  swapData,
  updateData,
  type BenchmarkState,
  type DataRecord,
} from '@shared/config';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styles: [
    `
      table {
        border-collapse: collapse;
      }
    `,
  ],
})
export class App {
  BENCHMARK_ACTIONS = BENCHMARK_ACTIONS;
  CONFIG = CONFIG;
  data = signal<DataRecord[]>([]);
  benchmarkState = signal<BenchmarkState>(BENCHMARK_STATES.EMPTY);
  isEmpty = computed(() => this.data().length === 0);

  createRows(): void {
    this.data.set(createData());
    this.benchmarkState.set(BENCHMARK_STATES.CREATED);
  }

  updateRows(): void {
    this.data.update((data) => updateData(data));
    this.benchmarkState.set(BENCHMARK_STATES.UPDATED);
  }

  swapRows(): void {
    this.data.update((data) => swapData(data));
    this.benchmarkState.set(BENCHMARK_STATES.SWAPPED);
  }

  clearRows(): void {
    this.data.set(clearData());
    this.benchmarkState.set(BENCHMARK_STATES.CLEARED);
  }

  renderCell(row: DataRecord, header: keyof DataRecord): string {
    const value = row[header];
    return Array.isArray(value) ? value.join(', ') : String(value);
  }
}
