"use client";

import { motion } from "framer-motion";
import type { PatientCase } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CaseSidebar({
  patientCase,
  differentials,
  className,
}: {
  patientCase: PatientCase;
  differentials?: Array<{ diagnosis: string; likelihood: string }>;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "hidden w-72 shrink-0 flex-col gap-4 lg:flex",
        className,
      )}
    >
      <div className="sticky top-6 space-y-4">
        <SidebarCard title="Case summary">
          <SummaryRow label="Patient" value={patientCase.name || "—"} />
          <SummaryRow
            label="Demographics"
            value={
              patientCase.sex && patientCase.age
                ? `${patientCase.sex}, ${patientCase.age}y`
                : "—"
            }
          />
          <SummaryRow
            label="Complaints"
            value={patientCase.chiefComplaints.join(", ") || "—"}
          />
        </SidebarCard>

        {Object.keys(patientCase.history).length > 0 && (
          <SidebarCard title="History">
            {Object.entries(patientCase.history).map(([k, v]) => (
              <SummaryRow
                key={k}
                label={formatKey(k)}
                value={Array.isArray(v) ? v.join(", ") : String(v)}
              />
            ))}
          </SidebarCard>
        )}

        {differentials && differentials.length > 0 && (
          <SidebarCard title="Working differentials">
            <ul className="space-y-2">
              {differentials.map((d) => (
                <motion.li
                  key={d.diagnosis}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span>{d.diagnosis}</span>
                  <LikelihoodBadge likelihood={d.likelihood} />
                </motion.li>
              ))}
            </ul>
          </SidebarCard>
        )}
      </div>
    </aside>
  );
}

function SidebarCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-surface/60 p-4 backdrop-blur-md">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm">
      <span className="text-muted">{label}: </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function LikelihoodBadge({ likelihood }: { likelihood: string }) {
  const colors: Record<string, string> = {
    high: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    moderate: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    low: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
  };
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
        colors[likelihood] ?? colors.moderate,
      )}
    >
      {likelihood}
    </span>
  );
}

function formatKey(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
