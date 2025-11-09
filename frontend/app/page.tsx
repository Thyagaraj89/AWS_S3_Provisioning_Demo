import Link from "next/link";
export default function Home() {
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="glass p-6">
        <h1 className="text-2xl font-semibold">Thyagaraj Demo</h1>
        <p className="text-white/70 mt-1">Provision AWS resources without Console/CLI.</p>
        <div className="mt-4 flex gap-3">
          <Link className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20" href="/dashboard">Open Dashboard</Link>
        </div>
      </div>
    </main>
  );
}
