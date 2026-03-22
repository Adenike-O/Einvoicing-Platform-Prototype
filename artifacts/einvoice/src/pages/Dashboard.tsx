import { useMemo } from "react";
import { Link } from "wouter";
import { useInvoices } from "@/hooks/use-invoices";
import { useBusiness } from "@/hooks/use-business";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { FileText, Plus, Users, CheckCircle2, XCircle, Clock } from "lucide-react";
import { InvoiceStatus } from "@workspace/api-client-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { invoices, isLoading } = useInvoices();
  const { profile } = useBusiness();

  const stats = useMemo(() => {
    if (!invoices) return { total: 0, pending: 0, accepted: 0, rejected: 0, totalAmount: 0 };
    return invoices.reduce((acc, inv) => {
      acc.total++;
      acc.totalAmount += inv.totalAmount;
      if (inv.status === InvoiceStatus.pending) acc.pending++;
      if (inv.status === InvoiceStatus.accepted) acc.accepted++;
      if (inv.status === InvoiceStatus.rejected) acc.rejected++;
      return acc;
    }, { total: 0, pending: 0, accepted: 0, rejected: 0, totalAmount: 0 });
  }, [invoices]);

  // Mock chart data for visualization
  const chartData = [
    { name: "Mon", amount: 4000 },
    { name: "Tue", amount: 3000 },
    { name: "Wed", amount: 2000 },
    { name: "Thu", amount: 2780 },
    { name: "Fri", amount: 1890 },
    { name: "Sat", amount: 2390 },
    { name: "Sun", amount: 3490 },
  ];

  return (
    <AppLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {profile?.companyName}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/customers/new" className="px-4 py-2 bg-white border border-border text-foreground font-medium rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
            <Users className="w-4 h-4" />
            Add Customer
          </Link>
          <Link href="/invoices/new" className="px-4 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 hover:-translate-y-0.5">
            <Plus className="w-4 h-4" />
            Create Invoice
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</span>
          </div>
          <h3 className="text-3xl font-display font-bold">{stats.total}</h3>
          <p className="text-sm text-muted-foreground mt-1 font-medium">₦{stats.totalAmount.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Accepted</span>
          </div>
          <h3 className="text-3xl font-display font-bold text-green-700">{stats.accepted}</h3>
          <p className="text-sm text-muted-foreground mt-1">Synced with FIRS</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending</span>
          </div>
          <h3 className="text-3xl font-display font-bold text-amber-700">{stats.pending}</h3>
          <p className="text-sm text-muted-foreground mt-1">Awaiting validation</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <XCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rejected</span>
          </div>
          <h3 className="text-3xl font-display font-bold text-red-700">{stats.rejected}</h3>
          <p className="text-sm text-muted-foreground mt-1">Needs correction</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-border/50">
          <h3 className="font-display font-bold text-lg mb-6">Invoice Volume (₦)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Amount']}
                />
                <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border/50 flex items-center justify-between">
            <h3 className="font-display font-bold text-lg">Recent Activity</h3>
            <Link href="/invoices" className="text-sm font-medium text-primary hover:underline">View All</Link>
          </div>
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : invoices?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No invoices created yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {invoices?.slice(0, 5).map(inv => (
                  <Link key={inv.id} href={`/invoices/${inv.id}`} className="block p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-foreground">{inv.invoiceNumber}</span>
                      <StatusBadge status={inv.status} />
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-sm text-muted-foreground truncate w-32">{inv.customer?.name || `Customer #${inv.customerId}`}</span>
                      <span className="font-medium text-sm">₦{inv.totalAmount.toLocaleString()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
