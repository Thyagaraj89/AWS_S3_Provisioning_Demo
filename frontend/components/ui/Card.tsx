import { ReactNode } from "react";

export function Card({ title, subtitle, children }:{
  title: string; subtitle?: string; children: ReactNode;
}) {
  return (
    <section className="glass">
      <div className="border-b border-white/10 px-5 py-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-white/65">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Field({
  label, hint, children
}: { label: string; hint?: string; children: ReactNode; }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm text-white/80">{label}</div>
      {children}
      {hint && <div className="mt-1 text-xs text-white/50">{hint}</div>}
    </label>
  );
}
