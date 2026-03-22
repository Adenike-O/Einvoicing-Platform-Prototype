import { AppLayout } from "@/components/AppLayout";
import { useCustomers } from "@/hooks/use-customers";
import { Link } from "wouter";
import { Plus, Users, Search } from "lucide-react";
import { format } from "date-fns";

export default function CustomerList() {
  const { customers, isLoading } = useCustomers();

  return (
    <AppLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your clients and their tax information.</p>
        </div>
        <Link href="/customers/new" className="px-4 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 hover:-translate-y-0.5">
          <Plus className="w-4 h-4" />
          Add Customer
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by name or TIN..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-muted-foreground text-sm font-semibold uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Customer Name</th>
                <th className="px-6 py-4 font-medium">TIN</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Date Added</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">Loading customers...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-lg font-medium text-foreground mb-1">No customers found</p>
                    <p>Add your first customer to start invoicing.</p>
                  </td>
                </tr>
              ) : (
                customers.map(customer => (
                  <tr key={customer.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{customer.name}</div>
                      <div className="text-sm text-muted-foreground truncate w-48">{customer.address}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm">{customer.tin}</td>
                    <td className="px-6 py-4 text-sm">{customer.email || '-'}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {customer.createdAt ? format(new Date(customer.createdAt), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/customers/${customer.id}`} className="text-primary font-medium text-sm hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details
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
