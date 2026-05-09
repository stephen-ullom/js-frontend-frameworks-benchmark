import {
  component$,
  useSignal,
  useVisibleTask$,
  useTask$,
} from "@builder.io/qwik";
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

const renderCell = (row: DataRecord, header: keyof DataRecord) => {
  const value = row[header];
  return Array.isArray(value) ? value.join(", ") : String(value);
};

export default component$(() => {
  const data = useSignal<DataRecord[]>([]);
  const results = useSignal<BenchmarkResult[]>([]);
  const step = useSignal(1);

  const resultsRef = useSignal<BenchmarkResult[]>([]);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const timer = setTimeout(() => {
      monitor.start(CONFIG.ACTION_TEXTS.CREATE);
      data.value = createData();
      step.value = 2;
    }, 500);
    return () => clearTimeout(timer);
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => step.value);

    const result = monitor.stop();

    if (result) {
      resultsRef.value = [
        ...resultsRef.value,
        {
          action: result.name,
          duration: result.duration,
        },
      ];
    }

    if (step.value === 5) {
      results.value = resultsRef.value;
    }

    if (step.value > 1 && step.value < 5 && result) {
      const timer = setTimeout(() => {
        if (step.value === 2) {
          monitor.start(CONFIG.ACTION_TEXTS.UPDATE);
          data.value = updateData(data.value);
          step.value = 3;
        } else if (step.value === 3) {
          monitor.start(CONFIG.ACTION_TEXTS.SWAP);
          data.value = swapData(data.value);
          step.value = 4;
        } else if (step.value === 4) {
          monitor.start(CONFIG.ACTION_TEXTS.CLEAR);
          data.value = clearData();
          step.value = 5;
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  });

  useTask$(({ track }) => {
    track(() => step.value);
    if (step.value === 5) {
      results.value = resultsRef.value;
    }
  });

  const isRunning = step.value > 0 && step.value <= 4;

  return (
    <div>
      <h1>{CONFIG.UI_TEXT.TITLE} - Automated Benchmark</h1>

      {isRunning && (
        <h3 style={{ color: "blue" }}>
          Running Benchmark... (Step {step.value} of 4)
        </h3>
      )}

      {step.value === 5 && (
        <div
          style={{
            marginBottom: "2rem",
            padding: "1rem",
            backgroundColor: "#f0f0f0",
          }}
        >
          <h2>Benchmark Results</h2>
          <table
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            border={1}
            style={{
              borderCollapse: "collapse",
              width: "100%",
              backgroundColor: "white",
            }}
          >
            <thead>
              <tr>
                <th style={{ padding: "8px" }}>Action</th>
                <th style={{ padding: "8px" }}>Duration (ms)</th>
              </tr>
            </thead>
            <tbody>
              {results.value.map((res, idx) => (
                <tr key={idx}>
                  <td style={{ padding: "8px" }}>{res.action}</td>
                  <td style={{ padding: "8px" }}>
                    <strong>{res.duration.toFixed(2)}</strong>
                  </td>
                </tr>
              ))}
              <tr>
                <td style={{ padding: "8px" }}>
                  <strong>Total Time</strong>
                </td>
                <td style={{ padding: "8px" }}>
                  <strong>
                    {results.value
                      .reduce((acc, curr) => acc + curr.duration, 0)
                      .toFixed(2)}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div style={{ overflow: "auto", maxHeight: "40vh", marginTop: "1rem" }}>
        {data.value.length === 0 ? (
          <p>{CONFIG.UI_TEXT.EMPTY_TABLE}</p>
        ) : (
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          <table border={1} style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {CONFIG.TABLE_HEADERS.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.value.map((row) => (
                <tr key={row.uuid}>
                  {CONFIG.TABLE_HEADERS.map((header) => (
                    <td key={header}>
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
