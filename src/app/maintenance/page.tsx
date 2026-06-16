import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maintenance — Clincalass",
};

export default function MaintenancePage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15">
          <span className="text-3xl">🔧</span>
        </div>
        <h1 className="text-3xl font-bold">Under Maintenance</h1>
        <p className="mt-3 max-w-sm text-muted">
          The app is temporarily offline for updates. Check back shortly.
        </p>
      </div>
    </div>
  );
}
