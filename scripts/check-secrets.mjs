import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { parse } from "dotenv";
import "dotenv/config";
const root = process.cwd();
const gitArgs = ["--git-dir=" + path.join(root, ".git"), "--work-tree=" + root];
const git = (args, options = {}) =>
  execFileSync("git", [...gitArgs, ...args], options);
const tracked = git(["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);
const violations = new Set();
const secrets = new Set([process.env.OPENAI_API_KEY].filter(Boolean));
for (const relative of [
  ".data/nl-runtime.env",
  ".data/nl-ssh.env",
  ".data/vps.env",
]) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) continue;
  for (const [name, value] of Object.entries(parse(fs.readFileSync(file)))) {
    if (/(KEY|SECRET|PASSWORD|TOKEN)$/.test(name) && value.length >= 10)
      secrets.add(value);
  }
}
const credentialPattern =
  /sk-(?:proj-)?[a-zA-Z0-9_-]{30,}|gh[pousr]_[a-zA-Z0-9]{30,}|github_pat_[a-zA-Z0-9_]{40,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/;
function inspect(content, label) {
  const text = content.toString("utf8");
  if (
    credentialPattern.test(text) ||
    [...secrets].some((secret) => text.includes(secret))
  )
    violations.add(label + ": credential detected");
}
for (const file of [
  ".env",
  ".env.local",
  ".env.production",
  ".data/nl-ssh.env",
  "backups/check.dump",
  "private.key",
]) {
  try {
    git(["check-ignore", file], { stdio: "ignore" });
  } catch {
    violations.add(file + ": not ignored");
  }
}
for (const file of tracked) {
  if (
    (/\.env(\.|$)/.test(file) && file !== ".env.example") ||
    /(^|\/)(\.data|node_modules|\.next|backups|test-results|playwright-report|\.venv|__pycache__)\//.test(
      file,
    ) ||
    /\.(pem|key|p12|pfx|dump|zip|tar|tar\.gz|sql\.gz|tgz|sqlite3?|db|log|pyc)$/.test(
      file,
    )
  )
    violations.add(file + ": private or generated file in Git index");
}
// Inspect the actual index blobs, not only working files: unstaged edits must not hide a staged secret.
if (tracked.length) {
  const buffer = git(["cat-file", "--batch"], {
    input: tracked.map((file) => ":" + file).join("\n") + "\n",
    maxBuffer: 64 * 1024 * 1024,
  });
  let offset = 0;
  for (const file of tracked) {
    const end = buffer.indexOf(10, offset);
    const header = buffer.subarray(offset, end).toString();
    const size = Number(header.split(" ").at(-1));
    if (end < 0 || !Number.isFinite(size))
      throw new Error("Cannot inspect index blob: " + file);
    offset = end + 1;
    if (size > 5 * 1024 * 1024)
      violations.add(file + ": file larger than 5 MB");
    inspect(buffer.subarray(offset, offset + size), "index/" + file);
    offset += size + 1;
  }
}
const skip = new Set([
  "node_modules",
  ".git",
  ".data",
  "backups",
  "test-results",
  "playwright-report",
  ".venv",
  "__pycache__",
  ".next",
]);
function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      skip.has(entry.name) ||
      entry.name.startsWith(".env") ||
      entry.isSymbolicLink()
    )
      continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) scan(file);
    else if (
      /\.(ts|tsx|js|cjs|mjs|json|md|yml|yaml|css|html|svg|py|sh)$/.test(file)
    )
      inspect(fs.readFileSync(file), path.relative(root, file));
  }
}
scan(root);
const staticDir = path.join(root, ".next", "static");
if (fs.existsSync(staticDir)) scan(staticDir);
if (violations.size) {
  console.error(
    "Secret safety check failed (paths only):\n" + [...violations].join("\n"),
  );
  process.exit(1);
}
console.log(
  "Secret check passed: Git index, source and browser bundle scanned; private files ignored.",
);
