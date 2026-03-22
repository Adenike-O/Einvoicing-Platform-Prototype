import { InvoiceStatus } from "@workspace/api-client-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function StatusBadge({ status }: { status: InvoiceStatus | string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border",
      status === InvoiceStatus.accepted && "bg-green-50 text-green-700 border-green-200",
      status === InvoiceStatus.rejected && "bg-red-50 text-red-700 border-red-200",
      status === InvoiceStatus.pending && "bg-amber-50 text-amber-700 border-amber-200",
      status === InvoiceStatus.draft && "bg-slate-100 text-slate-700 border-slate-200"
    )}>
      {status === InvoiceStatus.accepted && <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />}
      {status === InvoiceStatus.rejected && <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5" />}
      {status === InvoiceStatus.pending && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />}
      {status === InvoiceStatus.draft && <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />}
      {status}
    </span>
  );
}
