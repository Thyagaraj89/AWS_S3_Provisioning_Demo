import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import path from "path";
import { promises as fs } from "fs";

// Repo root is 2 dirs up from /frontend
const repoRoot = path.resolve(process.cwd(), "..");
const jobsDir  = path.join(repoRoot, "runner_jobs");
const awsRegion = process.env.AWS_REGION || "ap-southeast-1";

// write QUEUED job
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const product = String(body?.product || "");
    const params  = body?.params || {};

    if (!product) return NextResponse.json({ error: "Missing product" }, { status: 400 });

    // minimal validation for s3
    if (product === "s3_bucket") {
      const name = params?.bucket_name;
      if (!name || !/^[a-z0-9.-]{3,63}$/.test(name)) {
        return NextResponse.json(
          { error: "Invalid bucket_name (lowercase letters, numbers, dots, hyphens, 3–63 chars)." },
          { status: 400 }
        );
      }
    }

    const id  = crypto.randomUUID();
    const dir = path.join(jobsDir, id);
    await fs.mkdir(dir, { recursive: true });

    const meta = {
      id,
      product,
      aws_region: awsRegion,
      params,
      status: "QUEUED" as const,
      createdAt: new Date().toISOString()
    };

    await fs.writeFile(path.join(dir, "job.json"), JSON.stringify(meta, null, 2), "utf8");
    await fs.writeFile(path.join(dir, "runner.log"), "", "utf8");

    return NextResponse.json({ deploymentId: id, status: "QUEUED" });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "enqueue failed" }, { status: 500 });
  }
}
