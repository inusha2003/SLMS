const { spawnSync } = require("node:child_process");

delete process.env.ELECTRON_RUN_AS_NODE;

const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(npxCommand, ["cypress", ...process.argv.slice(2)], {
  env: process.env,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
