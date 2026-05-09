import {
  clearData,
  CONFIG,
  createData,
  monitor,
  swapData,
  updateData,
  type DataRecord,
} from "@shared/config";
import { useLayoutEffect, useState, useEffect, useRef } from "preact/hooks";

type BenchmarkResult = { action: string; duration: number };

function App() {
  const [data, setData] = useState<DataRecord[]>([]);
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [step, setStep] = useState(1);

  const resultsRef = useRef<BenchmarkResult[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      monitor.start(CONFIG.ACTION_TEXTS.CREATE);
      setData(createData());
      setStep(2);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useLayoutEffect(() => {
    const result = monitor.stop();

    if (result) {
      resultsRef.current.push({
        action: result.name,
        duration: result.duration,
      });
    }

    if (step > 1 && step < 5 && result) {
      const timer = setTimeout(() => {
        if (step === 2) {
          monitor.start(CONFIG.ACTION_TEXTS.UPDATE);
          setData((prev) => updateData(prev));
          setStep(3);
        } else if (step === 3) {
          monitor.start(CONFIG.ACTION_TEXTS.SWAP);
          setData((prev) => swapData(prev));
          setStep(4);
        } else if (step === 4) {
          monitor.start(CONFIG.ACTION_TEXTS.CLEAR);
          setData(clearData());
          setStep(5);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  useEffect(() => {
    if (step === 5) {
      setResults(resultsRef.current);
    }
  }, [step]);

  const renderCell = (row: DataRecord, header: keyof DataRecord) => {
    const value = row[header];
    return Array.isArray(value) ? value.join(", ") : String(value);
  };

  const isRunning = step > 0 && step <= 4;

  return (
    <div>
      <h1>{CONFIG.UI_TEXT.TITLE} - Automated Benchmark</h1>

      {isRunning && (
        <h3 style={{ color: "blue" }}>
          Running Benchmark... (Step {step} of 4)
        </h3>
      )}

      {step === 5 && (
        <div
          style={{
            marginBottom: "2rem",
            padding: "1rem",
            backgroundColor: "#f0f0f0",
          }}
        >
          <h2>Benchmark Results</h2>
          <table
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
              {results.map((res, idx) => (
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
                    {results
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
        {data.length === 0 ? (
          <p>{CONFIG.UI_TEXT.EMPTY_TABLE}</p>
        ) : (
          <table border={1} style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {CONFIG.TABLE_HEADERS.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.uuid}>
                  {CONFIG.TABLE_HEADERS.map((header) => (
                    <td key={header}>{renderCell(row, header)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;
