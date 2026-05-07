import {
  clearData,
  CONFIG,
  createData,
  monitor,
  swapData,
  updateData,
  type DataRecord,
} from "@shared/config";
import { useLayoutEffect, useState } from "react";

function App() {
  const [data, setData] = useState<DataRecord[]>([]);
  const [lastAction, setLastAction] = useState({ name: "N/A", duration: 0 });

  // This effect now correctly depends on `data` to run after each state change.
  useLayoutEffect(() => {
    const result = monitor.stop();
    if (result) {
      setLastAction(result);
    }
  }, [data]);

  const runCreate = () => {
    monitor.start(CONFIG.ACTION_TEXTS.CREATE);
    setData(createData());
  };

  const runUpdate = () => {
    if (data.length === 0) return;
    monitor.start(CONFIG.ACTION_TEXTS.UPDATE);
    setData(updateData(data));
  };

  const runSwap = () => {
    if (data.length < 10) return;
    monitor.start(CONFIG.ACTION_TEXTS.SWAP);
    setData(swapData(data));
  };

  const runClear = () => {
    monitor.start(CONFIG.ACTION_TEXTS.CLEAR);
    setData(clearData());
  };

  const renderCell = (row: DataRecord, header: keyof DataRecord) => {
    const value = row[header];
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    return String(value);
  };

  return (
    <div>
      <h1>Framework Stress Test</h1>

      {/* --- Controls --- */}
      <div>
        <button onClick={runCreate}>{CONFIG.BUTTON_LABELS.CREATE}</button>
        <button onClick={runUpdate} disabled={data.length === 0}>
          {CONFIG.BUTTON_LABELS.UPDATE}
        </button>
        <button onClick={runSwap} disabled={data.length === 0}>
          {CONFIG.BUTTON_LABELS.SWAP}
        </button>
        <button onClick={runClear} disabled={data.length === 0}>
          {CONFIG.BUTTON_LABELS.CLEAR}
        </button>
      </div>

      {/* --- Performance Info --- */}
      <div>
        Last Action: {lastAction.name} | Duration:{" "}
        <strong>{lastAction.duration.toFixed(2)}ms</strong>
      </div>

      {/* --- Data Table --- */}
      {data.length === 0 ? (
        <p>Table is empty.</p>
      ) : (
        <div style={{ overflow: "auto", maxHeight: "80vh", marginTop: "1rem" }}>
          <table border="1" style={{ borderCollapse: "collapse" }}>
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
        </div>
      )}
    </div>
  );
}

export default App;
