import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useCustomers } from "@/hooks/use-customers";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Save, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getLookupCustomerByTinUrl } from "@workspace/api-client-react";

export default function CustomerNew() {
  const { createCustomer, isCreating } = useCustomers();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [tin, setTin] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);

  const handleLookup = async () => {
    if (tin.length < 5) return;
    setIsLookingUp(true);
    try {
      // Direct fetch to bypass automatic retry hooks for manual button click
      const res = await fetch(getLookupCustomerByTinUrl(tin));
      if (res.ok) {
        const data = await res.json();
        if (data.found) {
          setName(data.name || "");
          setAddress(data.address || "");
          toast({ title: "FIRS Record Found", description: "Customer details auto-populated." });
        } else {
          toast({ variant: "destructive", title: "Not Found", description: "No FIRS record for this TIN." });
        }
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Lookup Failed", description: "Could not connect to FIRS simulation." });
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCustomer({
        data: { name, tin, email, phone, address }
      });
      toast({ title: "Customer Added", description: "Successfully created new customer." });
      setLocation("/customers");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to create customer." });
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <Link href="/customers" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Customers
        </Link>
        <h1 className="text-3xl font-display font-bold text-foreground">Add New Customer</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden max-w-3xl">
        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-8">
            
            {/* TIN Lookup Section */}
            <div className="bg-slate-50 p-6 rounded-xl border border-border">
              <h3 className="font-semibold text-foreground mb-4">FIRS TIN Lookup</h3>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  value={tin}
                  onChange={e => setTin(e.target.value)}
                  placeholder="Enter Tax Identification Number" 
                  className="flex-1 px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                  required
                />
                <button 
                  type="button" 
                  onClick={handleLookup}
                  disabled={isLookingUp || tin.length < 5}
                  className="px-6 py-3 bg-secondary text-secondary-foreground font-medium rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isLookingUp ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  Look up
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Looking up a TIN will automatically fill the verified company name and address.</p>
            </div>

            {/* Manual Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Customer / Company Name *</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="Enter full name" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="email@example.com" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Phone Number</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="+234 800 000 0000" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Billing Address *</label>
                <textarea required value={address} onChange={e => setAddress(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" placeholder="Enter full address" />
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-border/50 bg-slate-50/50 flex justify-end gap-3">
            <Link href="/customers" className="px-6 py-3 font-medium text-muted-foreground hover:text-foreground hover:bg-slate-100 rounded-xl transition-colors">
              Cancel
            </Link>
            <button 
              type="submit" 
              disabled={isCreating}
              className="px-8 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Customer
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
