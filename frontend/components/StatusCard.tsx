"use client";

import { motion } from "framer-motion";
import clsx from "clsx";

type Status = "IDLE" | "QUEUED" | "PLANNING" | "APPLYING" | "SUCCEEDED" | "FAILED";

type StatusCardProps = {
  status: Status;
};

const LABEL: Record<Status, string> = {
  IDLE: "Idle",
  QUEUED: "Queued",
  PLANNING: "Planning",
  APPLYING: "Applying",
  SUCCEEDED: "Succeeded",
  FAILED: "Failed",
};

const COLOR: Record<Status, string> = {
  IDLE: "bg-white/10 text-white/70 border-white/20",
  QUEUED: "bg-blue-500/15 text-blue-200 border-blue-400/50",
  PLANNING: "bg-amber-500/15 text-amber-200 border-amber-400/50",
  APPLYING: "bg-indigo-500/15 text-indigo-200 border-indigo-400/50",
  SUCCEEDED: "bg-emerald-500/15 text-emerald-200 border-emerald-400/60",
  FAILED: "bg-red-500/15 text-red-200 border-red-400/60",
};

export default function StatusCard({ status }: StatusCardProps) {
  return (
    <motion.div
      key={status}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15 }}
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        "shadow-sm backdrop-blur-sm",
        COLOR[status]
      )}
    >
      {/* little animated dot */}
      <span className="relative flex h-2.5 w-2.5">
        <span
          className={clsx(
            "absolute inline-flex h-full w-full rounded-full opacity-60",
            status === "SUCCEEDED" && "animate-ping bg-emerald-400",
            status === "FAILED" && "animate-ping bg-red-400",
            (status === "APPLYING" || status === "PLANNING" || status === "QUEUED") &&
              "animate-ping bg-indigo-400"
          )}
        />
        <span
          className={clsx(
            "relative inline-flex h-2.5 w-2.5 rounded-full",
            status === "SUCCEEDED" && "bg-emerald-300",
            status === "FAILED" && "bg-red-300",
            status === "IDLE" && "bg-white/40",
            (status === "APPLYING" || status === "PLANNING" || status === "QUEUED") &&
              "bg-indigo-300"
          )}
        />
      </span>
      <span>{LABEL[status]}</span>
    </motion.div>
  );
}
