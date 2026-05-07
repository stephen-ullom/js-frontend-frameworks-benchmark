import {
  clearData,
  CONFIG,
  createData,
  monitor,
  swapData,
  updateData,
  type DataRecord,
} from "@shared/config";
import { useLayoutEffect, useState, useRef } from "react";

function App() {
  const [data, setData] = useState<DataRecord[]>([]);
  const perfTextRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const result = monitor.stop();
    if (result && perfTextRef.current) {
      perfTextRef.current.innerHTML = CONFIG.UI_TEXT.getPerfResult(
        result.name,
        result.duration
      );
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
      <h1>{CONFIG.UI_TEXT.TITLE}</h1>

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

      <div
        ref={perfTextRef}
        dangerouslySetInnerHTML={{ __html: CONFIG.UI_TEXT.PERF_DEFAULT }}
      />

      {data.length === 0 ? (
        <p>{CONFIG.UI_TEXT.EMPTY_TABLE}</p>
      ) : (
        <div style={{ overflow: "auto", maxHeight: "80vh", marginTop: "1rem" }}>
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
        </div>
      )}
    </div>
  );
}

export default App;
