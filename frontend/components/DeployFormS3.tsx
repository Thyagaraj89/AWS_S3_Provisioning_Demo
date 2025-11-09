"use client";

import { useEffect, useRef, useState } from "react";
import StatusCard from "./StatusCard";

const BUCKET = /^[a-z0-9.-]{3,63}$/;

type Status = "IDLE" | "QUEUED" | "PLANNING" | "APPLYING" | "SUCCEEDED" | "FAILED";

export default function DeployFormS3() {
  const [bucket, setBucket] = useState("");
  const [versioning, setVersioning] = useState(true);
  const [days, setDays] = useState<string>("");
  const [kms, setKms] = useState("");

  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [status, setStatus] = useState<Status>("IDLE");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // job tracking
  const [jobId, setJobId] = useState<string>("");
  const [log, setLog] = useState<string>("");
  const [outputs, setOutputs] = useState<any>(null);

  const pollRef = useRef<number | null>(null);

  function stopPolling() {
    if (pollRef.current) {
      window.clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  }

  async function deploy() {
    setMsg(null);
    setOutputs(null);
    setLog("");
    setStatus("IDLE");
    setJobId("");
    setDone(false);

    if (!BUCKET.test(bucket)) {
      setMsg({
        type: "err",
        text: "Bucket name must be 3–63 chars: a–z, 0–9, dots, hyphens.",
      });
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/provision", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          product: "s3_bucket",
          params: {
            bucket_name: bucket.trim(),
            enable_versioning: versioning,
            expire_noncurrent_after_days: days ? Number(days) : undefined,
            kms_key_arn: kms || undefined,
          },
        }),
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to enqueue job");

      // normalise id field from API
      const deploymentId: string | undefined =
        j.deploymentId ?? j.id ?? j.jobId;

      if (!deploymentId) {
        throw new Error("API did not return a deployment id");
      }

      setJobId(deploymentId);
      setStatus("QUEUED");
      setMsg({ type: "ok", text: `Job queued: ${deploymentId}` });

      // start polling
      stopPolling();
      let delay = 1500;
      const MAX = 10000;

      const poll = async () => {
        try {
          const r = await fetch(`/api/deployments/${deploymentId}`);
          if (!r.ok) {
            // exponential backoff on errors
            delay = Math.min(delay * 2, MAX);
          } else {
            const d = await r.json();
            if (d.meta?.status) {
              setStatus(d.meta.status as Status);
            }
            if (typeof d.log === "string") setLog(d.log);
            if (d.outputs) setOutputs(d.outputs);

            if (d.meta?.status === "SUCCEEDED") {
              const name = d.outputs?.bucket_name?.value ?? bucket;
              setMsg({ type: "ok", text: `✓ Created bucket: ${name}` });
              setDone(true);
              stopPolling();
              return;
            }

            if (d.meta?.status === "FAILED") {
              setMsg({ type: "err", text: d.meta?.error || "Job failed" });
              setDone(true);
              stopPolling();
              return;
            }

            // still running – gentle backoff, slightly quicker while applying
            delay = Math.min(
              d.meta?.status === "APPLYING" ? 3000 : delay * 1.5,
              MAX
            );
          }
        } catch {
          delay = Math.min(delay * 2, MAX);
        }

        pollRef.current = window.setTimeout(poll, delay);
      };

      pollRef.current = window.setTimeout(poll, delay);
    } catch (e: any) {
      setMsg({ type: "err", text: e.message });
    } finally {
      setBusy(false);
    }
  }

  // clear timers on unmount
  useEffect(() => () => stopPolling(), []);

  const disabled = busy || done;

  return (
    <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 shadow-xl">
      <h3 className="text-lg font-semibold text-white">Amazon S3</h3>
      <p className="mb-4 text-sm text-white/60">
        Safe defaults: versioning, optional lifecycle &amp; encryption.
      </p>

      {/* form fields */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Bucket name */}
        <div className="md:col-span-2">
          <label className="label">Bucket name</label>
          <input
            className="input"
            placeholder="my-company-assets-dev"
            disabled={disabled}
            value={bucket}
            onChange={(e) => setBucket(e.target.value)}
          />
          <p className="hint">Use a globally-unique name for production.</p>
        </div>

        {/* Versioning */}
        <div>
          <label className="label">Versioning</label>
          <label className="inline-flex items-center gap-2 text-sm text-white/75">
            <input
              type="checkbox"
              className="checkbox"
              disabled={disabled}
              checked={versioning}
              onChange={(e) => setVersioning(e.target.checked)}
            />
            Enable object versioning
          </label>
        </div>

        {/* Lifecycle days */}
        <div>
          <label className="label">Lifecycle (days, optional)</label>
          <input
            className="input"
            type="number"
            min={1}
            placeholder="30"
            disabled={disabled}
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
          <p className="hint">
            Expire noncurrent object versions after N days.
          </p>
        </div>

        {/* KMS ARN */}
        <div className="md:col-span-2">
          <label className="label">KMS Key ARN (optional)</label>
          <input
            className="input"
            placeholder="arn:aws:kms:ap-southeast-1:123456789012:key/uuid"
            disabled={disabled}
            value={kms}
            onChange={(e) => setKms(e.target.value)}
          />
          <p className="hint">
            Leave empty to use S3-managed encryption (SSE-S3).
          </p>
        </div>
      </div>

      {/* footer: status + button + message */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <div
          className={`text-sm ${
            msg?.type === "err" ? "text-red-300" : "text-white/70"
          }`}
        >
          {msg?.text}
        </div>

        <div className="flex items-center gap-3">
          <StatusCard status={status} />
          <button
            className="btn"
            disabled={!bucket || busy}
            onClick={deploy}
          >
            {busy ? "Deploying…" : done ? "Redeploy" : "Deploy"}
          </button>
        </div>
      </div>

      {/* log tail */}
      {log && (
        <pre className="mt-4 max-h-48 overflow-auto rounded-xl bg-black/40 p-3 text-xs text-white/70 ring-1 ring-white/10">
          {log.split("\n").slice(-30).join("\n")}
        </pre>
      )}

      {/* outputs */}
      {outputs?.bucket_name?.value && (
        <div className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-sm">
          Bucket:{" "}
          <span className="font-semibold">{outputs.bucket_name.value}</span>
        </div>
      )}
    </div>
  );
}
