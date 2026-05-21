import { component$, useSignal } from "@builder.io/qwik";
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
} from "@shared/config";

const renderCell = (row: DataRecord, header: keyof DataRecord) => {
  const value = row[header];
  return Array.isArray(value) ? value.join(", ") : String(value);
};

export default component$(() => {
  const data = useSignal<DataRecord[]>([]);
  const benchmarkState = useSignal<BenchmarkState>(BENCHMARK_STATES.EMPTY);

  return (
    <div data-benchmark-state={benchmarkState.value}>
      <h1>{CONFIG.UI_TEXT.TITLE} - External Benchmark</h1>

      <div data-benchmark-controls>
        <button
          data-benchmark-action={BENCHMARK_ACTIONS.CREATE}
          type="button"
          onClick$={() => {
            data.value = createData();
            benchmarkState.value = BENCHMARK_STATES.CREATED;
          }}
        >
          {CONFIG.BUTTON_LABELS.CREATE}
        </button>
        <button
          data-benchmark-action={BENCHMARK_ACTIONS.UPDATE}
          type="button"
          onClick$={() => {
            data.value = updateData(data.value);
            benchmarkState.value = BENCHMARK_STATES.UPDATED;
          }}
        >
          {CONFIG.BUTTON_LABELS.UPDATE}
        </button>
        <button
          data-benchmark-action={BENCHMARK_ACTIONS.SWAP}
          type="button"
          onClick$={() => {
            data.value = swapData(data.value);
            benchmarkState.value = BENCHMARK_STATES.SWAPPED;
          }}
        >
          {CONFIG.BUTTON_LABELS.SWAP}
        </button>
        <button
          data-benchmark-action={BENCHMARK_ACTIONS.CLEAR}
          type="button"
          onClick$={() => {
            data.value = clearData();
            benchmarkState.value = BENCHMARK_STATES.CLEARED;
          }}
        >
          {CONFIG.BUTTON_LABELS.CLEAR}
        </button>
      </div>

      <div style={{ overflow: "auto", maxHeight: "40vh", marginTop: "1rem" }}>
        {data.value.length === 0 ? (
          <p>{CONFIG.UI_TEXT.EMPTY_TABLE}</p>
        ) : (
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          <table border={1} data-benchmark-table style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {CONFIG.TABLE_HEADERS.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.value.map((row, rowIndex) => (
                <tr
                  data-benchmark-row
                  data-row-index={rowIndex}
                  data-row-id={row.uuid}
                  key={row.uuid}
                >
                  {CONFIG.TABLE_HEADERS.map((header) => (
                    <td data-column={header} key={header}>
                      {renderCell(row, header as keyof DataRecord)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
});
