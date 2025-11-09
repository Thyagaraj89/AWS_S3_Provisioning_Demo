import path from "path";
import fs from "fs/promises";
import fssync from "fs";

function getRepoRoot() {
  // MUST match what you start the runner with:
  // RUNNER_REPO_ROOT=$(pwd)/.. npm start
  const envRoot = process.env.RUNNER_REPO_ROOT;
  if (envRoot && envRoot.trim().length > 0) return envRoot;
  // fall back to project root (frontend/..)
  return path.join(process.cwd(), "..");
}

export function getJobsDir() {
  return path.join(getRepoRoot(), "runner_jobs");
}

export async function readJob(jobId: string) {
  const p = path.join(getJobsDir(), jobId, "job.json");
  const raw = await fs.readFile(p, "utf8");
  return JSON.parse(raw);
}

export async function readLog(jobId: string) {
  const p = path.join(getJobsDir(), jobId, "runner.log");
  if (!fssync.existsSync(p)) return "";
  return await fs.readFile(p, "utf8");
}
