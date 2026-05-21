import {
  clearData,
  CONFIG,
  createData,
  swapData,
  updateData,
  type DataRecord,
} from "@shared/config";
import { createSignal, For, Show } from "solid-js";

type BenchmarkState = "empty" | "created" | "updated" | "swapped" | "cleared";

function App() {
  const [data, setData] = createSignal<DataRecord[]>([]);
  const [benchmarkState, setBenchmarkState] =
    createSignal<BenchmarkState>("empty");

  const renderCell = (row: DataRecord, header: keyof DataRecord) => {
    const value = row[header];
    return Array.isArray(value) ? value.join(", ") : String(value);
  };

  return (
    <div data-benchmark-state={benchmarkState()}>
      <h1>{CONFIG.UI_TEXT.TITLE} - External Benchmark</h1>

      <div data-benchmark-controls>
        <button
          data-benchmark-action="create"
          type="button"
          onClick={() => {
            setData(createData());
            setBenchmarkState("created");
          }}
        >
          {CONFIG.BUTTON_LABELS.CREATE}
        </button>
        <button
          data-benchmark-action="update"
          type="button"
          onClick={() => {
            setData((prev) => updateData(prev));
            setBenchmarkState("updated");
          }}
        >
          {CONFIG.BUTTON_LABELS.UPDATE}
        </button>
        <button
          data-benchmark-action="swap"
          type="button"
          onClick={() => {
            setData((prev) => swapData(prev));
            setBenchmarkState("swapped");
          }}
        >
          {CONFIG.BUTTON_LABELS.SWAP}
        </button>
        <button
          data-benchmark-action="clear"
          type="button"
          onClick={() => {
            setData(clearData());
            setBenchmarkState("cleared");
          }}
        >
          {CONFIG.BUTTON_LABELS.CLEAR}
        </button>
      </div>

      <div
        style={{ overflow: "auto", "max-height": "40vh", "margin-top": "1rem" }}
      >
        <Show
          when={data().length > 0}
          fallback={<p>{CONFIG.UI_TEXT.EMPTY_TABLE}</p>}
        >
          {/* @ts-ignore */}
          <table
            border={1}
            data-benchmark-table
            style={{ "border-collapse": "collapse" }}
          >
            <thead>
              <tr>
                <For each={CONFIG.TABLE_HEADERS}>{(h) => <th>{h}</th>}</For>
              </tr>
            </thead>
            <tbody>
              <For each={data()}>
                {(row, rowIndex) => (
                  <tr
                    data-benchmark-row
                    data-row-index={rowIndex()}
                    data-row-id={row.uuid}
                  >
                    <For each={CONFIG.TABLE_HEADERS}>
                      {(header) => (
                        <td data-column={header}>
                          {renderCell(row, header as keyof DataRecord)}
                        </td>
                      )}
                    </For>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Show>
      </div>
    </div>
  );
}

export default App;
