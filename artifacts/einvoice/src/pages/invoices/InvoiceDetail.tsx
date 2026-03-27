import { AppLayout } from "@/components/AppLayout";
import { useInvoice } from "@/hooks/use-invoices";
import { useRoute, Link } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle2, XCircle, Send, ShieldAlert, Loader2, AlertTriangle, ShieldCheck, Pencil, ExternalLink } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { InvoiceStatus } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { clsx } from "clsx";
type ValidationError = { field: string; message: string; code: string };

const ERROR_ACTIONS: Record<string, { label: string; description: string }> = {
  MISSING_CUSTOMER_TIN: { label: "Fix Customer TIN", description: "The customer on this invoice is missing a Tax Identification Number." },
  FIRS_NOT_CONNECTED: { label: "Complete FIRS Setup", description: "Your FIRS integration is not active. Please reconnect from your business settings." },
  MISSING_BUSINESS_TIN: { label: "Update Business Profile", description: "Your business Tax Identification Number (TIN) is not configured." },
  ITEM_AMOUNT_MISMATCH: { label: "Re-save Invoice", description: "A line item amount does not match the expected calculation." },
  TOTAL_MISMATCH: { label: "Re-save Invoice", description: "The invoice total does not match subtotal + VAT." },
  NO_LINE_ITEMS: { label: "Edit Invoice", description: "Invoice must have at least one line item." },
  MISSING_INVOICE_NUMBER: { label: "Edit Invoice", description: "An invoice number is required." },
  MISSING_INVOICE_DATE: { label: "Edit Invoice", description: "An invoice date is required." },
};

export default function InvoiceDetail() {
  const [, params] = useRoute("/invoices/:id");
  const id = Number(params?.id);
  const { invoice, isLoading, validateInvoice, isValidating, submitInvoice, isSubmitting } = useInvoice(id);
  const { toast } = useToast();

  const [validationPassed, setValidationPassed] = useState<boolean | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [tinInput, setTinInput] = useState("");
  const [showTinFix, setShowTinFix] = useState(false);
  const [isFixingTin, setIsFixingTin] = useState(false);

  if (isLoading) return <AppLayout><div className="p-12 text-center text-muted-foreground animate-pulse">Loading invoice...</div></AppLayout>;
  if (!invoice) return <AppLayout><div className="p-12 text-center">Invoice not found.</div></AppLayout>;

  const handleValidate = async () => {
    setShowTinFix(false);
    try {
      const res = await validateInvoice({ id });
      if (res.valid) {
        setValidationErrors([]);
        setValidationPassed(true);
        toast({ title: "Validation Passed", description: "Invoice meets all FIRS format requirements." });
      } else {
        setValidationErrors(res.errors as ValidationError[]);
        setValidationPassed(false);
        toast({
          variant: "destructive",
          title: "Validation Failed",
          description: `${res.errors.length} issue${res.errors.length > 1 ? "s" : ""} found. Review and fix below.`,
        });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to run validation. Please try again." });
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await submitInvoice({ id });
      if (res.status === InvoiceStatus.accepted) {
        toast({ title: "FIRS Submission Successful", description: `Reference: ${res.firsReferenceId}` });
      } else {
        toast({ variant: "destructive", title: "FIRS Rejected", description: "Invoice was rejected. See rejection reasons below." });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Submission Error", description: err.message });
    }
  };

  const handleFixCustomerTin = async () => {
    if (!tinInput.trim() || !invoice.customerId) return;
    setIsFixingTin(true);
    try {
      const response = await fetch(`/api/customers/${invoice.customerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tin: tinInput.trim() }),
      });
      if (!response.ok) throw new Error("Server error");

      toast({ title: "Customer TIN Updated", description: "Run validation again to confirm the fix." });
      setShowTinFix(false);
      setTinInput("");
      setValidationErrors((prev) => prev.filter((e) => e.code !== "MISSING_CUSTOMER_TIN"));
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Failed", description: err.message || "Could not update customer TIN." });
    } finally {
      setIsFixingTin(false);
    }
  };

  const hasMissingTin = validationErrors.some((e) => e.code === "MISSING_CUSTOMER_TIN");
  const canSubmit = validationPassed === true && !isSubmitting;

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
                disabled={!canSubmit}
                title={!canSubmit && validationPassed !== true ? "Run validation first to enable submission" : undefined}
                className="px-6 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
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

          {/* ── Validation success banner ── */}
          {validationPassed === true && validationErrors.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-green-800">Validation Passed</p>
                <p className="text-sm text-green-700 mt-0.5">
                  Invoice meets all FIRS format requirements. You can now submit it.
                </p>
              </div>
            </div>
          )}

          {/* ── Validation error panel ── */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 text-red-800 font-bold">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                {validationErrors.length} Validation Issue{validationErrors.length > 1 ? "s" : ""} Found
              </div>

              <div className="space-y-3">
                {validationErrors.map((err, i) => {
                  const action = ERROR_ACTIONS[err.code];
                  const isTinError = err.code === "MISSING_CUSTOMER_TIN";
                  const isFirsError = err.code === "FIRS_NOT_CONNECTED" || err.code === "MISSING_BUSINESS_TIN";

                  return (
                    <div key={i} className="bg-white rounded-xl border border-red-100 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-xs font-mono text-red-400 mb-1">{err.field}</p>
                          <p className="text-sm text-red-800">{action?.description || err.message}</p>
                          <p className="text-xs text-red-500 mt-1">{err.message}</p>
                        </div>
                        {isTinError && !showTinFix && (
                          <button
                            onClick={() => setShowTinFix(true)}
                            className="flex-shrink-0 flex items-center gap-1.5 text-sm font-semibold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Fix TIN
                          </button>
                        )}
                        {isFirsError && (
                          <Link
                            href="/onboarding"
                            className="flex-shrink-0 flex items-center gap-1.5 text-sm font-semibold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Fix Setup
                          </Link>
                        )}
                      </div>

                      {/* Inline TIN fix form */}
                      {isTinError && showTinFix && (
                        <div className="mt-4 pt-4 border-t border-red-100">
                          <label className="text-xs font-semibold text-red-700 uppercase tracking-wide block mb-2">
                            Enter Customer TIN
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={tinInput}
                              onChange={(e) => setTinInput(e.target.value)}
                              placeholder="e.g. 12345678901"
                              className="flex-1 px-3 py-2 text-sm rounded-lg border border-red-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-300 font-mono"
                            />
                            <button
                              onClick={handleFixCustomerTin}
                              disabled={isFixingTin || !tinInput.trim()}
                              className="px-4 py-2 bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-800 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                            >
                              {isFixingTin ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              Save TIN
                            </button>
                            <button
                              onClick={() => { setShowTinFix(false); setTinInput(""); }}
                              className="px-3 py-2 text-sm text-muted-foreground hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                          <p className="text-xs text-red-500 mt-2">After saving, click <strong>Run Validation</strong> again to confirm.</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleValidate}
                  disabled={isValidating}
                  className="text-sm font-semibold text-red-700 hover:text-red-900 flex items-center gap-1.5 underline underline-offset-2"
                >
                  {isValidating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                  Re-run Validation
                </button>
              </div>
            </div>
          )}

          {/* FIRS rejection banner */}
          {invoice.status === InvoiceStatus.rejected && invoice.rejectionReasons && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 text-red-800 font-bold mb-3">
                <XCircle className="w-5 h-5" />
                FIRS Rejection Reasons
              </div>
              <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
                {invoice.rejectionReasons.map((reason, i) => <li key={i}>{reason}</li>)}
              </ul>
              <p className="text-xs text-red-500 mt-4">Fix the issues above, run validation, then resubmit.</p>
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
                <p>{invoice.submittedAt ? format(new Date(invoice.submittedAt), 'PP pp') : '-'}</p>
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
              {invoice.customer?.tin && (
                <p className="text-sm font-mono mt-2 bg-slate-100 inline-block px-2 py-1 rounded">TIN: {invoice.customer.tin}</p>
              )}
              {!invoice.customer?.tin && (
                <p className="text-sm font-mono mt-2 bg-red-100 text-red-700 inline-block px-2 py-1 rounded">TIN: Not set</p>
              )}
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
                  <span className="text-muted-foreground">VAT (7.5%)</span>
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

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-slate-800 text-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              Compliance Status
            </h3>
            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex justify-between pb-3 border-b border-white/10">
                <span>Data Format</span>
                <span className={clsx(
                  validationPassed === true ? "text-green-400" :
                  validationPassed === false ? "text-red-400" :
                  "text-slate-400"
                )}>
                  {validationPassed === true ? "✓ Valid" : validationPassed === false ? "✗ Invalid" : "Not checked"}
                </span>
              </div>
              <div className="flex justify-between pb-3 border-b border-white/10">
                <span>Customer TIN</span>
                <span className={clsx(invoice.customer?.tin ? "text-green-400" : "text-red-400")}>
                  {invoice.customer?.tin ? "Verified" : "Missing"}
                </span>
              </div>
              <div className="flex justify-between pb-3 border-b border-white/10">
                <span>VAT Calculation</span>
                <span className="text-green-400">7.5% Applied</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>FIRS Sync</span>
                <span className={invoice.status === InvoiceStatus.accepted ? "text-green-400 font-bold" : "text-slate-400"}>
                  {invoice.status === InvoiceStatus.accepted ? "Synced" : "Pending"}
                </span>
              </div>
            </div>

            {validationPassed === null && (
              <button
                onClick={handleValidate}
                disabled={isValidating}
                className="mt-6 w-full py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                Run Validation
              </button>
            )}
            {validationPassed === true && (
              <div className="mt-6 py-2.5 rounded-xl bg-green-500/20 text-green-400 text-sm font-semibold flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Ready to Submit
              </div>
            )}
            {validationPassed === false && (
              <button
                onClick={handleValidate}
                disabled={isValidating}
                className="mt-6 w-full py-2.5 rounded-xl bg-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                Re-run Validation
              </button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
