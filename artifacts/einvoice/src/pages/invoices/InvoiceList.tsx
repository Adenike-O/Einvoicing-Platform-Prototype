import { AppLayout } from "@/components/AppLayout";
import { useInvoices } from "@/hooks/use-invoices";
import { Link } from "wouter";
import { Plus, FileText, Search } from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "@/components/StatusBadge";

export default function InvoiceList() {
  const { invoices, isLoading } = useInvoices();

  return (
    <AppLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage and submit your invoices to FIRS.</p>
        </div>
        <Link href="/invoices/new" className="px-4 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 hover:-translate-y-0.5">
          <Plus className="w-4 h-4" />
          Create Invoice
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50 flex gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by invoice number or customer..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-muted-foreground text-sm font-semibold uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Invoice #</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">Loading invoices...</td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-lg font-medium text-foreground mb-1">No invoices found</p>
                    <p>Create your first invoice to begin.</p>
                  </td>
                </tr>
              ) : (
                invoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 font-mono text-sm font-semibold text-foreground">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{invoice.customer?.name || `Customer #${invoice.customerId}`}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {format(new Date(invoice.invoiceDate), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      ₦{invoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/invoices/${invoice.id}`} className="inline-flex px-3 py-1.5 bg-white border border-border shadow-sm text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
