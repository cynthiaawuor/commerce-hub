import type { ReactNode } from "react";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
      <span
        aria-hidden="true"
        className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"
      />
      {label}
    </div>
  );
}

type MessageStateProps = {
  title: string;
  message?: string;
  action?: ReactNode;
};

export function ErrorState({ title, message, action }: MessageStateProps) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p className="font-medium text-red-800">{title}</p>
      {message && <p className="mt-1 text-sm text-red-700">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function EmptyState({ title, message, action }: MessageStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
      <p className="font-medium">{title}</p>
      {message && <p className="mt-1 text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
