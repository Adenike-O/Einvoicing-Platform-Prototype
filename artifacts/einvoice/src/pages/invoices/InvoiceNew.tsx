import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useInvoices } from "@/hooks/use-invoices";
import { useCustomers } from "@/hooks/use-customers";
import { useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ArrowLeft, Save, Plus, Trash2, Send } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const lineItemSchema = z.object({
  description: z.string().min(1, "Required"),
  quantity: z.coerce.number().min(1),
  unitPrice: z.coerce.number().min(0),
  vatRate: z.coerce.number().min(0).max(100),
});

const invoiceFormSchema = z.object({
  customerId: z.coerce.number().min(1, "Select a customer"),
  invoiceNumber: z.string().min(1, "Required"),
  invoiceDate: z.string().min(1, "Required"),
  dueDate: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, "At least one item required"),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

export default function InvoiceNew() {
  const { customers } = useCustomers();
  const { createInvoice, isCreating } = useInvoices();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: `INV-${format(new Date(), "yyyyMMdd")}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      invoiceDate: format(new Date(), "yyyy-MM-dd"),
      lineItems: [{ description: "", quantity: 1, unitPrice: 0, vatRate: 7.5 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems"
  });

  const watchLineItems = watch("lineItems");
  
  // Calculations
  const subtotal = watchLineItems.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unitPrice)), 0);
  const vatAmount = watchLineItems.reduce((acc, item) => acc + ((Number(item.quantity) * Number(item.unitPrice)) * (Number(item.vatRate) / 100)), 0);
  const totalAmount = subtotal + vatAmount;

  const onSubmit = async (data: InvoiceFormValues) => {
    try {
      const payload = {
        ...data,
        subtotal,
        vatAmount,
        totalAmount,
        currency: "NGN",
        lineItems: data.lineItems.map(item => ({
          ...item,
          amount: Number(item.quantity) * Number(item.unitPrice)
        }))
      };
      
      const newInvoice = await createInvoice({ data: payload });
      toast({ title: "Draft Saved", description: "Invoice drafted successfully. You can now validate and submit it." });
      setLocation(`/invoices/${newInvoice.id}`);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <Link href="/invoices" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Invoices
        </Link>
        <h1 className="text-3xl font-display font-bold text-foreground">Create Invoice</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-5xl">
        {/* Header Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-border/50 p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-bold text-lg border-b border-border/50 pb-2">Bill To</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Customer *</label>
              <select 
                {...register("customerId")} 
                className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-slate-50"
              >
                <option value="">Select a customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} (TIN: {c.tin})</option>)}
              </select>
              {errors.customerId && <p className="text-sm text-red-500">{errors.customerId.message}</p>}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg border-b border-border/50 pb-2">Invoice Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Invoice Number *</label>
                <input {...register("invoiceNumber")} className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 bg-slate-50 font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Currency</label>
                <input value="NGN (₦)" disabled className="w-full px-4 py-3 rounded-xl border border-border bg-slate-100 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Issue Date *</label>
                <input type="date" {...register("invoiceDate")} className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 bg-slate-50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Due Date</label>
                <input type="date" {...register("dueDate")} className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 bg-slate-50" />
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden">
          <div className="p-6 border-b border-border/50 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-lg">Line Items</h3>
            <button 
              type="button" 
              onClick={() => append({ description: "", quantity: 1, unitPrice: 0, vatRate: 7.5 })}
              className="text-sm font-medium text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
          <div className="p-6 overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="text-sm font-semibold text-muted-foreground border-b border-border">
                  <th className="pb-3 w-2/5">Description</th>
                  <th className="pb-3 w-1/6">Qty</th>
                  <th className="pb-3 w-1/6">Price (₦)</th>
                  <th className="pb-3 w-1/6">VAT (%)</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {fields.map((field, index) => {
                  const qty = Number(watchLineItems[index]?.quantity || 0);
                  const price = Number(watchLineItems[index]?.unitPrice || 0);
                  const amt = qty * price;
                  return (
                    <tr key={field.id}>
                      <td className="py-4 pr-4">
                        <input {...register(`lineItems.${index}.description`)} placeholder="Item description" className="w-full px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 bg-slate-50" />
                      </td>
                      <td className="py-4 pr-4">
                        <input type="number" step="0.01" {...register(`lineItems.${index}.quantity`)} className="w-full px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 bg-slate-50" />
                      </td>
                      <td className="py-4 pr-4">
                        <input type="number" step="0.01" {...register(`lineItems.${index}.unitPrice`)} className="w-full px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 bg-slate-50" />
                      </td>
                      <td className="py-4 pr-4">
                        <input type="number" step="0.1" {...register(`lineItems.${index}.vatRate`)} className="w-full px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 bg-slate-50" />
                      </td>
                      <td className="py-4 text-right font-medium text-foreground">
                        ₦{amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 text-right">
                        <button type="button" onClick={() => remove(index)} className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          <div className="bg-slate-50 p-6 border-t border-border/50 flex justify-end">
            <div className="w-64 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">₦{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT Amount:</span>
                <span className="font-medium">₦{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <span className="font-bold text-foreground">Total:</span>
                <span className="font-bold text-primary text-xl">₦{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link href="/invoices" className="px-6 py-3 font-medium text-muted-foreground hover:text-foreground hover:bg-slate-200 rounded-xl transition-colors">
            Discard
          </Link>
          <button 
            type="submit" 
            disabled={isCreating}
            className="px-8 py-3 bg-white border border-primary text-primary font-bold rounded-xl hover:bg-primary/5 transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm"
          >
            <Save className="w-4 h-4" />
            Save as Draft
          </button>
        </div>
      </form>
    </AppLayout>
  );
}
