#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// ----- Paths & constants -----

const RUNNER_DIR = __dirname;
const JOBS_DIR = path.resolve(RUNNER_DIR, "../runner_jobs");
const REPO_ROOT =
  process.env.RUNNER_REPO_ROOT || path.resolve(RUNNER_DIR, "..");
const POLL_INTERVAL_MS = 2000;

console.log("[worker] Starting Terraform job runner");
console.log("[worker] RUNNER_DIR   :", RUNNER_DIR);
console.log("[worker] JOBS_DIR     :", JOBS_DIR);
console.log("[worker] REPO_ROOT    :", REPO_ROOT);

if (!fs.existsSync(JOBS_DIR)) {
  fs.mkdirSync(JOBS_DIR, { recursive: true });
}

// ----- Small helpers -----

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function readJson(file) {
  try {
    const text = fs.readFileSync(file, "utf8");
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function jobDir(id) {
  return path.join(JOBS_DIR, id);
}

function logPath(id) {
  return path.join(jobDir(id), "runner.log");
}

function appendLog(id, line) {
  const full = `[${new Date().toISOString()}] ${line}\n`;
  fs.appendFileSync(logPath(id), full);
  process.stdout.write(full);
}

/**
 * Update job status in both root & meta
 */
function setJobStatus(job, status) {
  job.status = status;
  job.meta = job.meta || {};
  job.meta.status = status;
}

/**
 * Persist job.json back to disk
 */
function saveJob(job) {
  const file = path.join(jobDir(job.id), "job.json");
  writeJson(file, job);
}

// ----- Terraform helpers -----

/**
 * Run terraform with given args in cwd, streaming to runner.log
 * Optional timeoutMs: if provided, kill process after that many ms.
 * Returns { code, out }
 */
function runTerraform(job, args, cwd, timeoutMs) {
  return new Promise((resolve) => {
    const id = job.id;
    const cmdString = ["terraform", ...args].join(" ");
    appendLog(id, `> ${cmdString}`);

    const child = spawn("terraform", args, {
      cwd,
      env: process.env,
    });

    let allOut = "";
    let finished = false;
    let timedOut = false;

    const killTimer =
      typeof timeoutMs === "number"
        ? setTimeout(() => {
            if (!finished) {
              timedOut = true;
              appendLog(id, `terraform ${args[0]} timed out, killing process…`);
              child.kill("SIGKILL");
            }
          }, timeoutMs)
        : null;

    child.stdout.on("data", (d) => {
      const text = d.toString();
      allOut += text;
      fs.appendFileSync(logPath(id), text);
    });

    child.stderr.on("data", (d) => {
      const text = d.toString();
      allOut += text;
      fs.appendFileSync(logPath(id), text);
    });

    child.on("close", (code) => {
      finished = true;
      if (killTimer) clearTimeout(killTimer);

      if (timedOut) {
        appendLog(id, `terraform ${args[0]} -> exit (timeout)`);
        return resolve({ code: 124, out: allOut });
      }

      appendLog(id, `terraform ${args[0]} -> exit ${code}`);
      resolve({ code, out: allOut });
    });
  });
}

// ----- Render TF files for a job -----

function renderTerraformFiles(job) {
  const dir = jobDir(job.id);

  appendLog(job.id, "Rendering Terraform files…");

  if (job.product !== "s3_bucket") {
    throw new Error(`Unsupported product: ${job.product}`);
  }

  const params = job.params || {};
  const awsRegion = job.aws_region || "ap-southeast-1";

  // Absolute path to the s3_bucket module (variables not allowed in source=)
  const moduleSource = path
    .join(REPO_ROOT, "infra", "modules", "s3_bucket")
    .replace(/\\/g, "/");

  const mainTf = `
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "s3" {
  source     = "${moduleSource}"
  aws_region = var.aws_region

  bucket_name       = var.bucket_name
  enable_versioning = var.enable_versioning

  kms_key_arn = var.kms_key_arn
}

output "bucket_name" {
  value = module.s3.bucket_name
}
`.trimStart();

  const variablesTf = `
variable "aws_region" {
  type = string
}

variable "bucket_name" {
  type = string
}

variable "enable_versioning" {
  type = bool
}

variable "expire_noncurrent_after_days" {
  type    = number
  default = null
}

variable "kms_key_arn" {
  type    = string
  default = ""
}
`.trimStart();

  const lines = [];
  lines.push(`aws_region = "${awsRegion}"`);
  lines.push(`bucket_name = "${params.bucket_name}"`);
  lines.push(
    `enable_versioning = ${
      params.enable_versioning === false ? "false" : "true"
    }`
  );

  if (typeof params.expire_noncurrent_after_days === "number") {
    lines.push(
      `expire_noncurrent_after_days = ${params.expire_noncurrent_after_days}`
    );
  }

  if (params.kms_key_arn) {
    lines.push(`kms_key_arn = "${params.kms_key_arn}"`);
  }

  const tfvars = lines.join("\n") + "\n";

  fs.writeFileSync(path.join(dir, "main.tf"), mainTf);
  fs.writeFileSync(path.join(dir, "variables.tf"), variablesTf);
  fs.writeFileSync(path.join(dir, "terraform.tfvars"), tfvars);
}

// ----- Job processing -----

async function processJob(job) {
  const dir = jobDir(job.id);

  try {
    // Mark planning
    setJobStatus(job, "PLANNING");
    job.startedAt = job.startedAt || new Date().toISOString();
    saveJob(job);

    // Generate TF files
    renderTerraformFiles(job);

    // terraform init
    let r = await runTerraform(job, ["init", "-input=false", "-no-color"], dir);
    if (r.code !== 0) throw new Error("terraform init failed");

    // terraform plan
    r = await runTerraform(
      job,
      ["plan", "-out=tfplan", "-input=false", "-no-color"],
      dir
    );
    if (r.code !== 0) throw new Error("terraform plan failed");

    // mark applying
    setJobStatus(job, "APPLYING");
    saveJob(job);

    // terraform apply with 10-minute timeout
    r = await runTerraform(
      job,
      ["apply", "-auto-approve", "-input=false", "-no-color", "tfplan"],
      dir,
      10 * 60 * 1000
    );
    if (r.code !== 0) throw new Error("terraform apply failed");

    // terraform output
    const out = await runTerraform(job, ["output", "-json"], dir);
    const outputsJson = out.out || "{}";
    fs.writeFileSync(path.join(dir, "outputs.json"), outputsJson);

    try {
      job.outputs = JSON.parse(outputsJson);
    } catch {
      job.outputs = null;
    }

    // success
    setJobStatus(job, "SUCCEEDED");
    job.finishedAt = new Date().toISOString();
    saveJob(job);
    appendLog(job.id, "✓ Job succeeded");
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    appendLog(job.id, `✗ Job failed: ${msg}`);
    setJobStatus(job, "FAILED");
    job.finishedAt = new Date().toISOString();
    job.meta = job.meta || {};
    job.meta.error = msg;
    saveJob(job);
  }
}

// ----- Pick a QUEUED job -----

function pickQueuedJob() {
  if (!fs.existsSync(JOBS_DIR)) return null;

  const entries = fs.readdirSync(JOBS_DIR, { withFileTypes: true });

  for (const e of entries) {
    if (!e.isDirectory()) continue;

    const id = e.name;
    const file = path.join(JOBS_DIR, id, "job.json");
    const data = readJson(file);
    if (!data) continue;

    data.id = data.id || id;

    const status = (data.meta && data.meta.status) || data.status;
    if (status === "QUEUED") {
      return data;
    }
  }

  return null;
}

// ----- Main loop -----

async function mainLoop() {
  while (true) {
    const job = pickQueuedJob();
    if (!job) {
      await sleep(POLL_INTERVAL_MS);
      continue;
    }

    appendLog(job.id, `→ Processing job ${job.id} (${job.product})`);
    await processJob(job);
  }
}

mainLoop().catch((err) => {
  console.error("[worker] Fatal error:", err);
  process.exit(1);
});
