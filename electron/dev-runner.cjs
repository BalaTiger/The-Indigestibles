const { spawn } = require("node:child_process");
const http = require("node:http");
const process = require("node:process");

const VITE_HOST = "127.0.0.1";
const VITE_PORT = 5173;
const VITE_URL = `http://${VITE_HOST}:${VITE_PORT}`;
const MAX_WAIT_MS = 30000;
const PROBE_INTERVAL_MS = 200;

let viteProcess = null;
let electronProcess = null;
let exited = false;

function cleanup() {
  if (exited) return;
  exited = true;
  if (electronProcess && !electronProcess.killed) {
    electronProcess.kill("SIGTERM");
  }
  if (viteProcess && !viteProcess.killed) {
    viteProcess.kill("SIGTERM");
  }
}

function probeVite() {
  return new Promise((resolve) => {
    const req = http.get(VITE_URL, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForVite() {
  const deadline = Date.now() + MAX_WAIT_MS;
  while (Date.now() < deadline) {
    if (await probeVite()) {
      console.log(`[dev] Vite ready at ${VITE_URL}`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, PROBE_INTERVAL_MS));
  }
  throw new Error(`Vite dev server did not become ready at ${VITE_URL}`);
}

function startVite() {
  console.log("[dev] Starting Vite dev server...");
  viteProcess = spawn("npx vite", {
    stdio: "inherit",
    shell: true,
  });

  viteProcess.on("exit", (code) => {
    console.log(`[dev] Vite exited with code ${code}`);
    cleanup();
    process.exit(code ?? 0);
  });
}

function startElectron() {
  console.log("[dev] Starting Electron...");
  electronProcess = spawn("npx electron .", {
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      VITE_DEV_SERVER_URL: VITE_URL,
    },
  });

  electronProcess.on("exit", (code) => {
    console.log(`[dev] Electron exited with code ${code}`);
    cleanup();
    process.exit(code ?? 0);
  });
}

async function main() {
  try {
    startVite();
    await waitForVite();
    startElectron();
  } catch (err) {
    console.error("[dev]", err);
    cleanup();
    process.exit(1);
  }
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);

main();
