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

let RUNS = 1;
let MODE = "build"; // 'build' or 'dev'
let ROWS = 50;

process.argv.slice(2).forEach((arg) => {
  if (arg.startsWith("--runs=")) RUNS = parseInt(arg.split("=")[1], 10);
  if (arg.startsWith("--mode=")) MODE = arg.split("=")[1];
  if (arg.startsWith("--rows=")) ROWS = parseInt(arg.split("=")[1], 10);
});

console.log(`\n⚙️  Configuration: Mode=${MODE}, Runs=${RUNS}, Rows=${ROWS}\n`);

function waitForUrl(childProcess) {
  return new Promise((resolve) => {
    childProcess.stdout.on("data", (data) => {
      const output = data.toString();
      const match = output.match(/http:\/\/(localhost|127\.0\.0\.1):\d+/);
      if (match) resolve(match[0]);
    });
  });
}

async function runBenchmarkIteration(url, browser) {
  const context = await browser.newContext();
  const page = await context.newPage();

  // Append row count to URL so the shared config picks it up
  await page.goto(`${url}?rows=${ROWS}`);

  await page.waitForSelector('h2:has-text("Benchmark Results")', {
    timeout: 6000000,
  });

  const data = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll("table tbody tr"));
    return rows
      .map((row) => {
        const cells = row.querySelectorAll("td");
        return {
          action: cells[0]?.innerText.trim(),
          duration: parseFloat(cells[1]?.innerText.trim()) || 0,
        };
      })
      .filter((res) => res.action !== "Total Time"); // Exclude total row for averaging
  });

  await context.close();
  return data;
}

async function processFramework(framework, browser) {
  console.log(`\n▶️ Starting ${framework}...`);
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
        setTimeout(() => rej(new Error("Server start timeout")), 30000)
      ),
    ]);

    console.log(`   Server running at ${url}. Running ${RUNS} iteration(s)...`);
    const allRunsData = [];

    for (let i = 0; i < RUNS; i++) {
      console.log(`   - Run ${i + 1}/${RUNS}...`);
      const data = await runBenchmarkIteration(url, browser);
      allRunsData.push(data);
    }

    console.log(`✅ ${framework} finished.`);
    return calculateAverages(allRunsData);
  } catch (error) {
    console.error(`❌ Error benchmarking ${framework}:`, error.message);
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
  const aggregated = {};

  allRunsData.forEach((run) => {
    run.forEach((item) => {
      if (!aggregated[item.action]) aggregated[item.action] = 0;
      aggregated[item.action] += item.duration;
    });
  });

  return Object.keys(aggregated).map((action) => ({
    action,
    duration: (aggregated[action] / RUNS).toFixed(2),
  }));
}

async function main() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const allResults = {};

  for (const fw of frameworks) {
    const result = await processFramework(fw, browser);
    if (result) allResults[fw] = result;
  }

  await browser.close();

  let markdown = `# Framework Benchmark Results\n**Configuration:** Mode: \`${MODE}\`, Runs per framework: \`${RUNS}\`, Rows: \`${ROWS}\`\n\n`;

  for (const [fw, results] of Object.entries(allResults)) {
    markdown += `## ${fw.charAt(0).toUpperCase() + fw.slice(1)}\n\n`;
    markdown += `| Action | Avg Duration (ms) |\n| :--- | :--- |\n`;
    let total = 0;
    results.forEach((res) => {
      markdown += `| ${res.action} | ${res.duration} |\n`;
      total += parseFloat(res.duration);
    });
    markdown += `| **Total Average** | **${total.toFixed(2)}** |\n\n`;
  }

  await fs.writeFile("benchmark-results.md", markdown);
  console.log(
    "\n🎉 All benchmarks complete! Results saved to benchmark-results.md"
  );
}

main();
