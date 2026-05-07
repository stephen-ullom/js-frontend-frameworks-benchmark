import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewChecked } from '@angular/core';
import {
  clearData,
  CONFIG,
  createData,
  monitor,
  swapData,
  updateData,
  type DataRecord,
} from '@shared/config';

type BenchmarkResult = { action: string; duration: number };

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styles: [
    `
      table {
        border-collapse: collapse;
      }
      .results-container {
        margin-bottom: 2rem;
        padding: 1rem;
        background-color: #f0f0f0;
      }
    `,
  ],
  imports: [CommonModule],
})
export class App implements OnInit, AfterViewChecked {
  CONFIG = CONFIG;
  data: DataRecord[] = [];
  results: BenchmarkResult[] = [];
  step = 1;

  private resultsBuffer: BenchmarkResult[] = [];
  private lastProcessedStep = 1;

  ngOnInit(): void {
    setTimeout(() => {
      monitor.start(CONFIG.ACTION_TEXTS.CREATE);
      this.data = createData();
      this.step = 2;
    }, 500);
  }

  ngAfterViewChecked(): void {
    if (this.step !== this.lastProcessedStep) {
      this.lastProcessedStep = this.step;
      this.processStep();
    }
  }

  private processStep(): void {
    const measurement = monitor.stop();
    if (measurement) {
      this.resultsBuffer.push({
        action: measurement.name,
        duration: measurement.duration,
      });
    }

    if (this.step > 1 && this.step < 5 && measurement) {
      setTimeout(() => {
        switch (this.step) {
          case 2:
            monitor.start(CONFIG.ACTION_TEXTS.UPDATE);
            this.data = updateData(this.data);
            this.step = 3;
            break;
          case 3:
            monitor.start(CONFIG.ACTION_TEXTS.SWAP);
            this.data = swapData(this.data);
            this.step = 4;
            break;
          case 4:
            monitor.start(CONFIG.ACTION_TEXTS.CLEAR);
            this.data = clearData();
            this.step = 5;
            break;
        }
      }, 500);
    }

    if (this.step === 5) {
      setTimeout(() => {
        this.results = [...this.resultsBuffer];
      }, 0);
    }
  }

  renderCell(row: DataRecord, header: keyof DataRecord): string {
    const value = row[header];
    return Array.isArray(value) ? value.join(', ') : String(value);
  }

  get isRunning(): boolean {
    return this.step > 0 && this.step <= 4;
  }

  getTotalTime(): number {
    return this.results.reduce((acc, curr) => acc + curr.duration, 0);
  }

  trackByUuid(index: number, row: DataRecord): string {
    return row.uuid;
  }
}
