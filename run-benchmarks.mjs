import { spawn } from "node:child_process";
import { chromium } from "playwright";
import fs from "node:fs/promises";

const frameworks = [
  "react",
  "vue",
  "angular",
  "solid",
  "svelte",
  "preact",
  "qwik",
];

const actions = [
  { label: "Create Rows" },
  { label: "Update Every 10th Row" },
  { label: "Swap Rows" },
  { label: "Clear Rows" },
];

let RUNS = 1;
let MODE = "build"; // 'build' or 'dev'
let ROWS = 50;

process.argv.slice(2).forEach((arg) => {
  if (arg.startsWith("--runs=")) RUNS = parseInt(arg.split("=")[1], 10);
  if (arg.startsWith("--mode=")) MODE = arg.split("=")[1];
  if (arg.startsWith("--rows=")) ROWS = parseInt(arg.split("=")[1], 10);
});

if (ROWS < 10) {
  throw new Error(
    "--rows must be at least 10 because the swap action needs two swappable rows.",
  );
}

console.log(
  `\nConfiguration: Mode=${MODE}, Runs=${RUNS}, Rows=${ROWS}, Timing=browser-observed after paint\n`,
);

function waitForUrl(childProcess) {
  return new Promise((resolve) => {
    childProcess.stdout.on("data", (data) => {
      const output = data.toString();
      const match = output.match(/http:\/\/(localhost|127\.0\.0\.1):\d+/);
      if (match) resolve(match[0]);
    });
  });
}

async function waitForPaint(page) {
  return page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve(performance.now());
          });
        });
      }),
  );
}

async function dispatchAction(page, action) {
  return page.evaluate((actionName) => {
    const button = document.querySelector(
      `[data-benchmark-action="${actionName}"]`,
    );
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error(`Missing benchmark action button: ${actionName}`);
    }

    const start = performance.now();
    button.click();
    return start;
  }, action);
}

async function getRowCount(page) {
  return page.locator("[data-benchmark-row]").count();
}

async function getCellText(page, rowIndex, column) {
  return page
    .locator(`[data-row-index="${rowIndex}"] [data-column="${column}"]`)
    .innerText();
}

async function getRowId(page, rowIndex) {
  return page
    .locator(`[data-row-index="${rowIndex}"]`)
    .getAttribute("data-row-id");
}

async function measureAction(page, action, waitForExpectedState) {
  await waitForPaint(page);
  const start = await dispatchAction(page, action);
  await waitForExpectedState();
  const end = await waitForPaint(page);
  return end - start;
}

async function runBenchmarkIteration(url, browser) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${url}?rows=${ROWS}`);
  await page.waitForSelector("[data-benchmark-controls]", { timeout: 60000 });
  await waitForPaint(page);

  const results = [];

  const createDuration = await measureAction(page, "create", async () => {
    await page.waitForFunction(
      (rows) =>
        document.querySelector("[data-benchmark-state='created']") &&
        document.querySelectorAll("[data-benchmark-row]").length === rows,
      ROWS,
    );
  });
  results.push({ action: "Create Rows", duration: createDuration });

  const firstSalary = parseFloat(await getCellText(page, 0, "salary"));
  const updateDuration = await measureAction(page, "update", async () => {
    await page.waitForFunction((expectedSalary) => {
      const salary = document.querySelector(
        `[data-row-index="0"] [data-column="salary"]`,
      );
      return (
        document.querySelector("[data-benchmark-state='updated']") &&
        salary?.textContent?.trim() === String(expectedSalary)
      );
    }, firstSalary + 50);
  });
  results.push({ action: "Update Every 10th Row", duration: updateDuration });

  const secondRowId = await getRowId(page, 1);
  const swapTargetIndex = ROWS - 9;
  const swapTargetRowId = await getRowId(page, swapTargetIndex);
  const swapDuration = await measureAction(page, "swap", async () => {
    await page.waitForFunction(
      ({ secondId, targetIndex, targetId }) => {
        const secondRow = document.querySelector(`[data-row-index="1"]`);
        const targetRow = document.querySelector(
          `[data-row-index="${targetIndex}"]`,
        );
        return (
          document.querySelector("[data-benchmark-state='swapped']") &&
          secondRow?.getAttribute("data-row-id") === targetId &&
          targetRow?.getAttribute("data-row-id") === secondId
        );
      },
      {
        secondId: secondRowId,
        targetIndex: swapTargetIndex,
        targetId: swapTargetRowId,
      },
    );
  });
  results.push({ action: "Swap Rows", duration: swapDuration });

  const clearDuration = await measureAction(page, "clear", async () => {
    await page.waitForFunction(
      () =>
        document.querySelector("[data-benchmark-state='cleared']") &&
        document.querySelectorAll("[data-benchmark-row]").length === 0,
    );
  });
  results.push({ action: "Clear Rows", duration: clearDuration });

  const finalRowCount = await getRowCount(page);
  if (finalRowCount !== 0) {
    throw new Error(
      `Expected clear action to remove all rows, saw ${finalRowCount}`,
    );
  }

  await context.close();
  return results;
}

async function processFramework(framework, browser) {
  console.log(`\nStarting ${framework}...`);
  const scriptName = MODE === "dev" ? `dev:${framework}` : `start:${framework}`;

  const child = spawn("npm", ["run", scriptName], {
    cwd: process.cwd(),
    shell: true,
    detached: true,
  });

  try {
    const url = await Promise.race([
      waitForUrl(child),
      new Promise((_, rej) =>
        setTimeout(() => rej(new Error("Server start timeout")), 30000),
      ),
    ]);

    console.log(`   Server running at ${url}. Running ${RUNS} iteration(s)...`);
    const allRunsData = [];

    for (let i = 0; i < RUNS; i++) {
      console.log(`   - Run ${i + 1}/${RUNS}...`);
      const data = await runBenchmarkIteration(url, browser);
      allRunsData.push(data);
    }

    console.log(`${framework} finished.`);
    return calculateAverages(allRunsData);
  } catch (error) {
    console.error(`Error benchmarking ${framework}:`, error.message);
    return null;
  } finally {
    try {
      process.kill(-child.pid);
    } catch (e) {
      child.kill();
    }
  }
}

function calculateAverages(allRunsData) {
  return actions.map(({ label }) => {
    const durations = allRunsData
      .flat()
      .filter((item) => item.action === label)
      .map((item) => item.duration);

    return {
      action: label,
      duration: (
        durations.reduce((total, duration) => total + duration, 0) /
        durations.length
      ).toFixed(2),
    };
  });
}

function escapeCsv(value) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function createCsv(allResults) {
  const rows = [["framework", "action", "avg_browser_observed_duration_ms"]];

  for (const [framework, results] of Object.entries(allResults)) {
    let total = 0;
    results.forEach((result) => {
      total += parseFloat(result.duration);
      rows.push([framework, result.action, result.duration]);
    });
    rows.push([framework, "Total Average", total.toFixed(2)]);
  }

  return `${rows.map((row) => row.map(escapeCsv).join(",")).join("\n")}\n`;
}

async function main() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const allResults = {};

  for (const fw of frameworks) {
    const result = await processFramework(fw, browser);
    if (result) allResults[fw] = result;
  }

  await browser.close();

  let markdown = `# Framework Benchmark Results\n\n`;
  markdown += `**Configuration:** Mode: \`${MODE}\`, Runs per framework: \`${RUNS}\`, Rows: \`${ROWS}\`\n\n`;
  markdown += `**Timing method:** Playwright triggers each action in the browser, waits for the expected DOM state, waits two \`requestAnimationFrame\` ticks so paint can complete, then records elapsed browser time with \`performance.now()\`.\n\n`;

  for (const [fw, results] of Object.entries(allResults)) {
    markdown += `## ${fw.charAt(0).toUpperCase() + fw.slice(1)}\n\n`;
    markdown += `| Action | Avg Browser-Observed Duration (ms) |\n| :--- | ---: |\n`;
    let total = 0;
    results.forEach((res) => {
      markdown += `| ${res.action} | ${res.duration} |\n`;
      total += parseFloat(res.duration);
    });
    markdown += `| **Total Average** | **${total.toFixed(2)}** |\n\n`;
  }

  await fs.writeFile("benchmark-results.md", markdown);
  await fs.writeFile("benchmark-results.csv", createCsv(allResults));
  console.log(
    "\nAll benchmarks complete. Results saved to benchmark-results.md and benchmark-results.csv",
  );
}

main();
