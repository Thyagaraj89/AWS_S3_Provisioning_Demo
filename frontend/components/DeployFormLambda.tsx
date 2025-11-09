"use client";
import { useState } from "react";
import { Card, Field } from "./ui/Card";

export default function DeployFormLambda() {
  const [fn, setFn] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  async function deploy() {
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/provision", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ product: "lambda", params: { function_name: fn } })
      });
      const j = await r.json();
      setMsg(r.ok ? `Queued: ${j.status}` : (j.error || j.message));
    } catch (e:any) { setMsg(e.message); }
    finally { setBusy(false); }
  }

  return (
    <Card title="AWS Lambda" subtitle="Node.js hello-world deploy (coming up next).">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field label="Function name">
            <input className="input" placeholder="my-fn-dev"
                   value={fn} onChange={(e)=>setFn(e.target.value)} />
          </Field>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <div className="text-sm text-white/70">{msg}</div>
        <button className="btn" disabled={!fn || busy} onClick={deploy}>
          {busy && <span className="spinner" />} Deploy
        </button>
      </div>
    </Card>
  );
}
