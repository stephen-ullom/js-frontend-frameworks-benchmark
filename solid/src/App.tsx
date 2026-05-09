import {
  clearData,
  CONFIG,
  createData,
  monitor,
  swapData,
  updateData,
  type DataRecord,
} from "@shared/config";
import {
  createSignal,
  createEffect,
  onMount,
  onCleanup,
  For,
  Show,
} from "solid-js";

type BenchmarkResult = { action: string; duration: number };

function App() {
  const [data, setData] = createSignal<DataRecord[]>([]);
  const [results, setResults] = createSignal<BenchmarkResult[]>([]);
  const [step, setStep] = createSignal(1);

  const resultsArr: BenchmarkResult[] = [];

  onMount(() => {
    const timer = setTimeout(() => {
      monitor.start(CONFIG.ACTION_TEXTS.CREATE);
      setData(createData());
      setStep(2);
    }, 500);
    onCleanup(() => clearTimeout(timer));
  });

  createEffect(() => {
    const currentStep = step();

    const result = monitor.stop();

    if (result) {
      resultsArr.push({
        action: result.name,
        duration: result.duration,
      });
    }

    if (currentStep > 1 && currentStep < 5 && result) {
      const timer = setTimeout(() => {
        if (currentStep === 2) {
          monitor.start(CONFIG.ACTION_TEXTS.UPDATE);
          setData((prev) => updateData(prev));
          setStep(3);
        } else if (currentStep === 3) {
          monitor.start(CONFIG.ACTION_TEXTS.SWAP);
          setData((prev) => swapData(prev));
          setStep(4);
        } else if (currentStep === 4) {
          monitor.start(CONFIG.ACTION_TEXTS.CLEAR);
          setData(clearData());
          setStep(5);
        }
      }, 500);
      onCleanup(() => clearTimeout(timer));
    }

    if (currentStep === 5) {
      setResults([...resultsArr]);
    }
  });

  const renderCell = (row: DataRecord, header: keyof DataRecord) => {
    const value = row[header];
    return Array.isArray(value) ? value.join(", ") : String(value);
  };

  const isRunning = () => step() > 0 && step() <= 4;

  return (
    <div>
      <h1>{CONFIG.UI_TEXT.TITLE} - Automated Benchmark</h1>

      <Show when={isRunning()}>
        <h3 style={{ color: "blue" }}>
          Running Benchmark... (Step {step()} of 4)
        </h3>
      </Show>

      <Show when={step() === 5}>
        <div
          style={{
            "margin-bottom": "2rem",
            padding: "1rem",
            "background-color": "#f0f0f0",
          }}
        >
          <h2>Benchmark Results</h2>
          <table
            // @ts-ignore
            border={1}
            style={{
              "border-collapse": "collapse",
              width: "100%",
              "background-color": "white",
            }}
          >
            <thead>
              <tr>
                <th style={{ padding: "8px" }}>Action</th>
                <th style={{ padding: "8px" }}>Duration (ms)</th>
              </tr>
            </thead>
            <tbody>
              <For each={results()}>
                {(res) => (
                  <tr>
                    <td style={{ padding: "8px" }}>{res.action}</td>
                    <td style={{ padding: "8px" }}>
                      <strong>{res.duration.toFixed(2)}</strong>
                    </td>
                  </tr>
                )}
              </For>
              <tr>
                <td style={{ padding: "8px" }}>
                  <strong>Total Time</strong>
                </td>
                <td style={{ padding: "8px" }}>
                  <strong>
                    {results()
                      .reduce((acc, curr) => acc + curr.duration, 0)
                      .toFixed(2)}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Show>

      <div
        style={{ overflow: "auto", "max-height": "40vh", "margin-top": "1rem" }}
      >
        <Show
          when={data().length > 0}
          fallback={<p>{CONFIG.UI_TEXT.EMPTY_TABLE}</p>}
        >
          {/* @ts-ignore */}
          <table border={1} style={{ "border-collapse": "collapse" }}>
            <thead>
              <tr>
                <For each={CONFIG.TABLE_HEADERS}>{(h) => <th>{h}</th>}</For>
              </tr>
            </thead>
            <tbody>
              <For each={data()}>
                {(row) => (
                  <tr>
                    <For each={CONFIG.TABLE_HEADERS}>
                      {(header) => (
                        <td>{renderCell(row, header as keyof DataRecord)}</td>
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
