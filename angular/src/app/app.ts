import { Component, OnInit, afterEveryRender, computed, signal } from '@angular/core';
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
})
export class App implements OnInit {
  CONFIG = CONFIG;
  data = signal<DataRecord[]>([]);
  results = signal<BenchmarkResult[]>([]);
  step = signal(1);
  isRunning = computed(() => this.step() > 0 && this.step() <= 4);
  totalTime = computed(() => this.results().reduce((acc, curr) => acc + curr.duration, 0));

  private resultsBuffer: BenchmarkResult[] = [];
  private lastProcessedStep = 1;

  constructor() {
    afterEveryRender(() => {
      const currentStep = this.step();
      if (currentStep !== this.lastProcessedStep) {
        this.lastProcessedStep = currentStep;
        this.processStep(currentStep);
      }
    });
  }

  ngOnInit(): void {
    setTimeout(() => {
      monitor.start(CONFIG.ACTION_TEXTS.CREATE);
      this.data.set(createData());
      this.step.set(2);
    }, 500);
  }

  private processStep(currentStep: number): void {
    const measurement = monitor.stop();
    if (measurement) {
      this.resultsBuffer.push({
        action: measurement.name,
        duration: measurement.duration,
      });
    }

    if (currentStep > 1 && currentStep < 5 && measurement) {
      setTimeout(() => {
        switch (currentStep) {
          case 2:
            monitor.start(CONFIG.ACTION_TEXTS.UPDATE);
            this.data.update((data) => updateData(data));
            this.step.set(3);
            break;
          case 3:
            monitor.start(CONFIG.ACTION_TEXTS.SWAP);
            this.data.update((data) => swapData(data));
            this.step.set(4);
            break;
          case 4:
            monitor.start(CONFIG.ACTION_TEXTS.CLEAR);
            this.data.set(clearData());
            this.step.set(5);
            break;
        }
      }, 500);
    }

    if (currentStep === 5) {
      this.results.set([...this.resultsBuffer]);
    }
  }

  renderCell(row: DataRecord, header: keyof DataRecord): string {
    const value = row[header];
    return Array.isArray(value) ? value.join(', ') : String(value);
  }
}
