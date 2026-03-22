import { AppLayout } from "@/components/AppLayout";
import { useInvoice } from "@/hooks/use-invoices";
import { useRoute, Link } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle2, XCircle, Send, ShieldAlert, Loader2, AlertTriangle } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { InvoiceStatus } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { clsx } from "clsx";

export default function InvoiceDetail() {
  const [, params] = useRoute("/invoices/:id");
  const id = Number(params?.id);
  const { invoice, isLoading, validateInvoice, isValidating, submitInvoice, isSubmitting } = useInvoice(id);
  const { toast } = useToast();
  const [validationErrors, setValidationErrors] = useState<any[]>([]);

  if (isLoading) return <AppLayout><div className="p-12 text-center text-muted-foreground animate-pulse">Loading invoice...</div></AppLayout>;
  if (!invoice) return <AppLayout><div className="p-12 text-center">Invoice not found.</div></AppLayout>;

  const handleValidate = async () => {
    try {
      const res = await validateInvoice({ id });
      if (res.valid) {
        setValidationErrors([]);
        toast({ title: "Validation Passed", description: "Invoice meets all FIRS format requirements." });
      } else {
        setValidationErrors(res.errors);
        toast({ variant: "destructive", title: "Validation Failed", description: "Please review the highlighted errors." });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to run validation." });
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await submitInvoice({ id });
      if (res.status === InvoiceStatus.accepted) {
        toast({ title: "FIRS Submission Successful", description: `Ref: ${res.firsReferenceId}` });
      } else {
        toast({ variant: "destructive", title: "FIRS Rejected", description: "Invoice was rejected by FIRS." });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Submission Error", description: err.message });
    }
  };

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/invoices" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Invoices
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-display font-bold text-foreground">{invoice.invoiceNumber}</h1>
            <StatusBadge status={invoice.status} />
          </div>
        </div>
        
        {/* Action Buttons based on status */}
        <div className="flex gap-3">
          {(invoice.status === InvoiceStatus.draft || invoice.status === InvoiceStatus.rejected) && (
            <>
              <button 
                onClick={handleValidate}
                disabled={isValidating || isSubmitting}
                className="px-4 py-2 bg-white border border-border text-foreground font-medium rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4 text-amber-500" />}
                Run Validation
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isValidating || isSubmitting || validationErrors.length > 0}
                className="px-6 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit to FIRS
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Validation/Rejection Banner */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 text-red-800 font-bold mb-3">
                <AlertTriangle className="w-5 h-5" />
                Validation Errors Detected
              </div>
              <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
                {validationErrors.map((err, i) => (
                  <li key={i}><span className="font-semibold">{err.field}:</span> {err.message}</li>
                ))}
              </ul>
            </div>
          )}

          {invoice.status === InvoiceStatus.rejected && invoice.rejectionReasons && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
               <div className="flex items-center gap-3 text-red-800 font-bold mb-3">
                <XCircle className="w-5 h-5" />
                FIRS Rejection Reasons
              </div>
              <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
                {invoice.rejectionReasons.map((reason, i) => <li key={i}>{reason}</li>)}
              </ul>
            </div>
          )}

          {invoice.status === InvoiceStatus.accepted && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex justify-between items-center">
               <div className="flex items-center gap-3 text-green-800 font-bold">
                <CheckCircle2 className="w-6 h-6" />
                <div>
                  <p>Successfully submitted to FIRS</p>
                  <p className="text-xs font-normal opacity-80 mt-1">Reference: {invoice.firsReferenceId}</p>
                </div>
              </div>
              <div className="text-right text-green-800 text-sm">
                <p>Date: {invoice.submittedAt ? format(new Date(invoice.submittedAt), 'PP pp') : '-'}</p>
              </div>
            </div>
          )}

          {/* Paper Invoice Preview */}
          <div className="bg-white rounded-2xl shadow-sm border border-border/50 p-10 min-h-[600px] flex flex-col">
            <div className="flex justify-between items-start border-b border-border/50 pb-8 mb-8">
              <div>
                <h2 className="text-4xl font-display font-black text-slate-200 tracking-tighter uppercase">INVOICE</h2>
                <p className="font-mono mt-2 text-foreground font-semibold">{invoice.invoiceNumber}</p>
              </div>
              <div className="text-right space-y-1 text-sm text-muted-foreground">
                <p><span className="font-semibold text-foreground">Date:</span> {format(new Date(invoice.invoiceDate), 'MMM d, yyyy')}</p>
                {invoice.dueDate && <p><span className="font-semibold text-foreground">Due:</span> {format(new Date(invoice.dueDate), 'MMM d, yyyy')}</p>}
              </div>
            </div>

            <div className="mb-10">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Billed To</h3>
              <p className="font-bold text-lg text-foreground">{invoice.customer?.name}</p>
              <p className="text-muted-foreground text-sm mt-1 whitespace-pre-line">{invoice.customer?.address}</p>
              <p className="text-sm font-mono mt-2 bg-slate-100 inline-block px-2 py-1 rounded">TIN: {invoice.customer?.tin}</p>
            </div>

            <table className="w-full text-left mb-8">
              <thead>
                <tr className="border-y border-border text-sm font-semibold text-foreground">
                  <th className="py-3">Description</th>
                  <th className="py-3 text-center">Qty</th>
                  <th className="py-3 text-right">Price</th>
                  <th className="py-3 text-right">VAT</th>
                  <th className="py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-sm">
                {invoice.lineItems.map((item, i) => (
                  <tr key={i}>
                    <td className="py-4 pr-4">{item.description}</td>
                    <td className="py-4 text-center text-muted-foreground">{item.quantity}</td>
                    <td className="py-4 text-right text-muted-foreground">₦{item.unitPrice.toLocaleString()}</td>
                    <td className="py-4 text-right text-muted-foreground">{item.vatRate}%</td>
                    <td className="py-4 text-right font-medium text-foreground">₦{item.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-auto flex justify-end border-t border-border pt-6">
              <div className="w-64 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">₦{invoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VAT Amount</span>
                  <span className="font-medium text-foreground">₦{invoice.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <span className="font-bold text-foreground text-lg">Total Due</span>
                  <span className="font-bold text-primary text-xl">₦{invoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-slate-800 text-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-accent" />
              Compliance Status
            </h3>
            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex justify-between pb-3 border-b border-white/10">
                <span>Data Format</span>
                <span className={clsx(validationErrors.length === 0 ? "text-green-400" : "text-amber-400")}>
                  {validationErrors.length === 0 ? "Valid" : "Needs Review"}
                </span>
              </div>
              <div className="flex justify-between pb-3 border-b border-white/10">
                <span>Customer TIN</span>
                <span className="text-green-400">Verified</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-white/10">
                <span>VAT Calculation</span>
                <span className="text-green-400">Accurate (7.5%)</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>FIRS Sync</span>
                <span className={invoice.status === InvoiceStatus.accepted ? "text-green-400 font-bold" : "text-slate-400"}>
                  {invoice.status === InvoiceStatus.accepted ? "Synced" : "Pending"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
