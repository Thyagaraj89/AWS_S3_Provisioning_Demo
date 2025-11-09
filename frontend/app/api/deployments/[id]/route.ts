// app/api/deployments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

// IMPORTANT: frontend cwd = repo_root/frontend
// jobs live at repo_root/runner_jobs → go one level up
const jobsDir = path.resolve(process.cwd(), "..", "runner_jobs");
const LOG_TAIL_BYTES = 20_000; // last 20k chars of log

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  try {
    const dir = path.join(jobsDir, id);
    const jobFile = path.join(dir, "job.json");
    const logFile = path.join(dir, "runner.log");
    const outputsFile = path.join(dir, "outputs.json");

    // --- job.json ---
    const jobJson = await fs.readFile(jobFile, "utf8");
    const job = JSON.parse(jobJson);

    // normalise meta/status
    const meta = job.meta ?? {};
    if (!meta.status && job.status) {
      meta.status = job.status;
    }

    // --- log tail ---
    let log = "";
    try {
      const buf = await fs.readFile(logFile);
      if (buf.length > LOG_TAIL_BYTES) {
        const tail = buf.subarray(buf.length - LOG_TAIL_BYTES);
        log = tail.toString("utf8");
      } else {
        log = buf.toString("utf8");
      }
    } catch {
      log = "";
    }

    // --- outputs ---
    let outputs: any = null;
    try {
      const outText = await fs.readFile(outputsFile, "utf8");
      outputs = JSON.parse(outText || "{}");
    } catch {
      outputs = job.outputs ?? null;
    }

    return NextResponse.json({
      id: job.id ?? id,
      meta,
      log,
      outputs,
    });
  } catch (e) {
    console.error("deployment GET error", e);
    return NextResponse.json(
      { error: "Deployment not found", meta: { status: "FAILED" } },
      { status: 404 }
    );
  }
}
