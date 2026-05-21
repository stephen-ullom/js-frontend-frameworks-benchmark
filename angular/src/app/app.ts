import { Component, computed, signal } from '@angular/core';
import {
  clearData,
  CONFIG,
  createData,
  swapData,
  updateData,
  type DataRecord,
} from '@shared/config';

type BenchmarkState = 'empty' | 'created' | 'updated' | 'swapped' | 'cleared';

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
  CONFIG = CONFIG;
  data = signal<DataRecord[]>([]);
  benchmarkState = signal<BenchmarkState>('empty');
  isEmpty = computed(() => this.data().length === 0);

  createRows(): void {
    this.data.set(createData());
    this.benchmarkState.set('created');
  }

  updateRows(): void {
    this.data.update((data) => updateData(data));
    this.benchmarkState.set('updated');
  }

  swapRows(): void {
    this.data.update((data) => swapData(data));
    this.benchmarkState.set('swapped');
  }

  clearRows(): void {
    this.data.set(clearData());
    this.benchmarkState.set('cleared');
  }

  renderCell(row: DataRecord, header: keyof DataRecord): string {
    const value = row[header];
    return Array.isArray(value) ? value.join(', ') : String(value);
  }
}
