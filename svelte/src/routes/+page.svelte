<script lang="ts">
  import {
    clearData,
    CONFIG,
    createData,
    swapData,
    updateData,
    type DataRecord,
  } from "@shared/config";

  type BenchmarkState =
    | "empty"
    | "created"
    | "updated"
    | "swapped"
    | "cleared";

  let data: DataRecord[] = $state.raw([]);
  let benchmarkState: BenchmarkState = $state("empty");

  function renderCell(row: DataRecord, header: keyof DataRecord) {
    const value = row[header];
    return Array.isArray(value) ? value.join(", ") : String(value);
  }

  function createRows() {
    data = createData();
    benchmarkState = "created";
  }

  function updateRows() {
    data = updateData(data);
    benchmarkState = "updated";
  }

  function swapRows() {
    data = swapData(data);
    benchmarkState = "swapped";
  }

  function clearRows() {
    data = clearData();
    benchmarkState = "cleared";
  }
</script>

<div data-benchmark-state={benchmarkState}>
  <h1>{CONFIG.UI_TEXT.TITLE} - External Benchmark</h1>

  <div data-benchmark-controls>
    <button data-benchmark-action="create" type="button" onclick={createRows}>
      {CONFIG.BUTTON_LABELS.CREATE}
    </button>
    <button data-benchmark-action="update" type="button" onclick={updateRows}>
      {CONFIG.BUTTON_LABELS.UPDATE}
    </button>
    <button data-benchmark-action="swap" type="button" onclick={swapRows}>
      {CONFIG.BUTTON_LABELS.SWAP}
    </button>
    <button data-benchmark-action="clear" type="button" onclick={clearRows}>
      {CONFIG.BUTTON_LABELS.CLEAR}
    </button>
  </div>

  <div style="overflow: auto; max-height: 40vh; margin-top: 1rem;">
    {#if data.length === 0}
      <p>{CONFIG.UI_TEXT.EMPTY_TABLE}</p>
    {:else}
      <table border="1" data-benchmark-table style="border-collapse: collapse;">
        <thead>
          <tr>
            {#each CONFIG.TABLE_HEADERS as h}
              <th>{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data as row, rowIndex (row.uuid)}
            <tr
              data-benchmark-row
              data-row-index={rowIndex}
              data-row-id={row.uuid}
            >
              {#each CONFIG.TABLE_HEADERS as header}
                <td data-column={header}>{renderCell(row, header)}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>
