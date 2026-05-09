<script lang="ts">
  import { onMount, onDestroy } from "svelte";
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

  let data: DataRecord[] = $state.raw([]);

  let results: BenchmarkResult[] = $state([]);
  let step = $state(1);

  let resultsArr: BenchmarkResult[] = [];
  let timer: ReturnType<typeof setTimeout>;

  onMount(() => {
    timer = setTimeout(() => {
      monitor.start(CONFIG.ACTION_TEXTS.CREATE);
      data = createData();
      step = 2;
    }, 500);
  });

  onDestroy(() => {
    clearTimeout(timer);
  });

  $effect(() => {
    if (step > 1) {
      const result = monitor.stop();

      if (result) {
        resultsArr.push({
          action: result.name,
          duration: result.duration,
        });
      }

      if (step < 5 && result) {
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (step === 2) {
            monitor.start(CONFIG.ACTION_TEXTS.UPDATE);
            data = updateData(data);
            step = 3;
          } else if (step === 3) {
            monitor.start(CONFIG.ACTION_TEXTS.SWAP);
            data = swapData(data);
            step = 4;
          } else if (step === 4) {
            monitor.start(CONFIG.ACTION_TEXTS.CLEAR);
            data = clearData();
            step = 5;
          }
        }, 500);
      } else if (step === 5) {
        results = [...resultsArr];
      }
    }
  });

  let isRunning = $derived(step > 0 && step <= 4);
  let totalTime = $derived(
    results.reduce((acc, curr) => acc + curr.duration, 0)
  );

  function renderCell(row: DataRecord, header: keyof DataRecord) {
    const value = row[header];
    return Array.isArray(value) ? value.join(", ") : String(value);
  }
</script>

<div>
  <h1>{CONFIG.UI_TEXT.TITLE} - Automated Benchmark</h1>

  {#if isRunning}
    <h3 style="color: blue;">
      Running Benchmark... (Step {step} of 4)
    </h3>
  {/if}

  {#if step === 5}
    <div style="margin-bottom: 2rem; padding: 1rem; background-color: #f0f0f0;">
      <h2>Benchmark Results</h2>
      <table
        border="1"
        style="border-collapse: collapse; width: 100%; background-color: white;"
      >
        <thead>
          <tr>
            <th style="padding: 8px;">Action</th>
            <th style="padding: 8px;">Duration (ms)</th>
          </tr>
        </thead>
        <tbody>
          {#each results as res}
            <tr>
              <td style="padding: 8px;">{res.action}</td>
              <td style="padding: 8px;">
                <strong>{res.duration.toFixed(2)}</strong>
              </td>
            </tr>
          {/each}
          <tr>
            <td style="padding: 8px;">
              <strong>Total Time</strong>
            </td>
            <td style="padding: 8px;">
              <strong>{totalTime.toFixed(2)}</strong>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  {/if}

  <div style="overflow: auto; max-height: 40vh; margin-top: 1rem;">
    {#if data.length === 0}
      <p>{CONFIG.UI_TEXT.EMPTY_TABLE}</p>
    {:else}
      <table border="1" style="border-collapse: collapse;">
        <thead>
          <tr>
            {#each CONFIG.TABLE_HEADERS as h}
              <th>{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data as row (row.uuid)}
            <tr>
              {#each CONFIG.TABLE_HEADERS as header}
                <td>{renderCell(row, header)}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>
