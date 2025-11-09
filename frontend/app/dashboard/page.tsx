// frontend/app/dashboard/page.tsx
import DeployFormS3 from "@/components/DeployFormS3";
import DeployFormLambda from "@/components/DeployFormLambda";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Control Deck</h1>
            <p className="text-sm text-white/60">
              Provision resources with sensible defaults and guardrails.
            </p>
          </div>
        </header>

        <div className="grid gap-8 md:grid-cols-2">
          {/* LEFT: S3 card */}
          <DeployFormS3 />

          {/* RIGHT: Lambda placeholder */}
          <DeployFormLambda />
        </div>
      </div>
    </main>
  );
}
