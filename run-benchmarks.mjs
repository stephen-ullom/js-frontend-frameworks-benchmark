import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";
import { chromium } from "playwright";
import fs from "node:fs/promises";
import {
  BENCHMARK_ACTIONS,
  BENCHMARK_ACTION_SEQUENCE,
  BENCHMARK_STATES,
} from "./shared-config/index.ts";

const frameworks = [
  "react",
  "vue",
  "angular",
  "solid",
  "svelte",
  "preact",
  "qwik",
];

const frameworkPackages = {
  react: ["react", "react-dom"],
  vue: ["vue"],
  angular: ["@angular/core"],
  solid: ["solid-js"],
  svelte: ["svelte"],
  preact: ["preact"],
  qwik: ["@builder.io/qwik"],
};

let RUNS = 1;
let MODE = "build"; // 'build' or 'dev'
let ROWS = 50;

const actionLabels = Object.fromEntries(
  BENCHMARK_ACTION_SEQUENCE.map(({ action, label }) => [action, label]),
);

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
  `\nConfiguration: Mode=${MODE}, Runs=${RUNS}, Rows=${ROWS}, Frameworks=${frameworks.join(
    ", ",
  )}, Timing=runner-observed after paint\n`,
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

function getPackageLockPath(framework, packageName) {
  return `${framework}/node_modules/${packageName}`;
}

async function getFrameworkVersions() {
  const packageLock = JSON.parse(
    await fs.readFile("package-lock.json", "utf8"),
  );
  const versions = {};

  for (const framework of frameworks) {
    const packages = frameworkPackages[framework] ?? [framework];

    versions[framework] = packages
      .map((packageName) => {
        const version =
          packageLock.packages?.[getPackageLockPath(framework, packageName)]
            ?.version ??
          packageLock.packages?.[`node_modules/${packageName}`]?.version;
        return version ? `${packageName}@${version}` : packageName;
      })
      .join(", ");
  }

  return versions;
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

async function getRowCount(page) {
  return page.locator("[data-benchmark-row]").count();
}

async function getCellText(page, rowIndex, column) {
  return page
    .locator("[data-benchmark-row]")
    .nth(rowIndex)
    .locator(`[data-column="${column}"]`)
    .innerText();
}

async function getRowId(page, rowIndex) {
  return page
    .locator("[data-benchmark-row]")
    .nth(rowIndex)
    .getAttribute("data-row-id");
}

async function measureAction(page, action, waitForExpectedState) {
  await waitForPaint(page);
  const start = performance.now();
  await page.locator(`[data-benchmark-action="${action}"]`).click();
  await waitForExpectedState();
  await waitForPaint(page);
  return performance.now() - start;
}

async function runBenchmarkIteration(url, browser) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${url}?rows=${ROWS}`);
  await page.waitForSelector("[data-benchmark-controls]", { timeout: 60000 });
  await waitForPaint(page);

  const results = [];

  const createDuration = await measureAction(
    page,
    BENCHMARK_ACTIONS.CREATE,
    async () => {
      await page.waitForFunction(
        ({ rows, state }) =>
          document.querySelector(`[data-benchmark-state='${state}']`) &&
          document.querySelectorAll("[data-benchmark-row]").length === rows,
        { rows: ROWS, state: BENCHMARK_STATES.CREATED },
      );
    },
  );
  results.push({
    action: actionLabels[BENCHMARK_ACTIONS.CREATE],
    duration: createDuration,
  });

  const firstSalary = parseFloat(await getCellText(page, 0, "salary"));
  const updateDuration = await measureAction(
    page,
    BENCHMARK_ACTIONS.UPDATE,
    async () => {
      await page.waitForFunction(
        ({ expectedSalary, state }) => {
          const firstRow = document.querySelectorAll("[data-benchmark-row]")[0];
          const salary = firstRow?.querySelector(`[data-column="salary"]`);
          return (
            document.querySelector(`[data-benchmark-state='${state}']`) &&
            salary?.textContent?.trim() === String(expectedSalary)
          );
        },
        { expectedSalary: firstSalary + 50, state: BENCHMARK_STATES.UPDATED },
      );
    },
  );
  results.push({
    action: actionLabels[BENCHMARK_ACTIONS.UPDATE],
    duration: updateDuration,
  });

  const secondRowId = await getRowId(page, 1);
  const swapTargetIndex = ROWS - 9;
  const swapTargetRowId = await getRowId(page, swapTargetIndex);
  const swapDuration = await measureAction(
    page,
    BENCHMARK_ACTIONS.SWAP,
    async () => {
      await page.waitForFunction(
        ({ secondId, state, targetIndex, targetId }) => {
          const rows = document.querySelectorAll("[data-benchmark-row]");
          const secondRow = rows[1];
          const targetRow = rows[targetIndex];
          return (
            document.querySelector(`[data-benchmark-state='${state}']`) &&
            secondRow?.getAttribute("data-row-id") === targetId &&
            targetRow?.getAttribute("data-row-id") === secondId
          );
        },
        {
          secondId: secondRowId,
          state: BENCHMARK_STATES.SWAPPED,
          targetIndex: swapTargetIndex,
          targetId: swapTargetRowId,
        },
      );
    },
  );
  results.push({
    action: actionLabels[BENCHMARK_ACTIONS.SWAP],
    duration: swapDuration,
  });

  const clearDuration = await measureAction(
    page,
    BENCHMARK_ACTIONS.CLEAR,
    async () => {
      await page.waitForFunction(
        (state) =>
          document.querySelector(`[data-benchmark-state='${state}']`) &&
          document.querySelectorAll("[data-benchmark-row]").length === 0,
        BENCHMARK_STATES.CLEARED,
      );
    },
  );
  results.push({
    action: actionLabels[BENCHMARK_ACTIONS.CLEAR],
    duration: clearDuration,
  });

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
  return BENCHMARK_ACTION_SEQUENCE.map(({ label }) => {
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

function createCsv(allResults, frameworkVersions) {
  const actionLabels = BENCHMARK_ACTION_SEQUENCE.map(({ label }) => label);
  const rows = [["Framework", "Version", ...actionLabels, "Total Average"]];

  for (const [framework, results] of Object.entries(allResults)) {
    const durationsByAction = new Map(
      results.map((result) => [result.action, result.duration]),
    );
    const durations = actionLabels.map(
      (label) => durationsByAction.get(label) ?? "",
    );
    const total = durations
      .reduce((sum, duration) => sum + (parseFloat(duration) || 0), 0)
      .toFixed(2);

    rows.push([
      framework,
      frameworkVersions[framework] ?? "",
      ...durations,
      total,
    ]);
  }

  return `${rows.map((row) => row.map(escapeCsv).join(",")).join("\n")}\n`;
}

async function main() {
  const frameworkVersions = await getFrameworkVersions();
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const allResults = {};

  for (const fw of frameworks) {
    const result = await processFramework(fw, browser);
    if (result) allResults[fw] = result;
  }

  await browser.close();

  let markdown = `# Framework Benchmark Results\n\n`;
  markdown += `**Configuration:** Mode: \`${MODE}\`, Runs per framework: \`${RUNS}\`, Rows: \`${ROWS}\`\n\n`;
  markdown += `**Frameworks:** \`${frameworks.join("`, `")}\`\n\n`;
  markdown += `**Timing method:** Playwright triggers each action, waits for the expected DOM state, waits two \`requestAnimationFrame\` ticks so paint can complete, then records elapsed runner-observed time with high-resolution \`performance.now()\`.\n\n`;
  markdown += `## Versions\n\n`;
  markdown += `| Framework | Version |\n| :--- | :--- |\n`;

  for (const framework of frameworks) {
    markdown += `| ${framework} | ${frameworkVersions[framework]} |\n`;
  }

  markdown += `\n`;

  for (const [fw, results] of Object.entries(allResults)) {
    markdown += `## ${fw.charAt(0).toUpperCase() + fw.slice(1)}\n\n`;
    markdown += `| Action | Avg Runner-Observed Duration (ms) |\n| :--- | ---: |\n`;
    let total = 0;
    results.forEach((res) => {
      markdown += `| ${res.action} | ${res.duration} |\n`;
      total += parseFloat(res.duration);
    });
    markdown += `| **Total Average** | **${total.toFixed(2)}** |\n\n`;
  }

  await fs.writeFile("benchmark-results.md", markdown);
  await fs.writeFile(
    "benchmark-results.csv",
    createCsv(allResults, frameworkVersions),
  );
  console.log(
    "\nAll benchmarks complete. Results saved to benchmark-results.md and benchmark-results.csv",
  );
}

main();
