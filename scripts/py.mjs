import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const candidates =
  process.platform === "win32"
    ? [".venv/Scripts/python.exe", "python.exe", "python"]
    : [".venv/bin/python", "python3", "python"];

const python = candidates.find((candidate) =>
  candidate.startsWith(".") ? existsSync(resolve(root, candidate)) : true
);

if (!python) {
  console.error("找不到 Python。請先建立 .venv 或將 python 加入 PATH。");
  process.exit(1);
}

const result = spawnSync(python, process.argv.slice(2), {
  cwd: root,
  stdio: "inherit",
  shell: false,
});

process.exit(result.status ?? 1);
