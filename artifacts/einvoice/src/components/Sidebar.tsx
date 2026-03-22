import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  Building2,
  ShieldCheck
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Sidebar() {
  const [location] = useLocation();
  const { logout, user } = useAuth();

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Invoices", href: "/invoices", icon: FileText },
    { label: "Customers", href: "/customers", icon: Users },
  ];

  return (
    <div className="w-64 sidebar-gradient text-sidebar-foreground flex flex-col min-h-screen shadow-xl relative z-10">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
          <ShieldCheck className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg leading-none tracking-tight">FIRS Sync</h1>
          <p className="text-xs text-sidebar-foreground/60 font-medium mt-1">E-Invoicing Portal</p>
        </div>
      </div>

      <div className="px-4 py-2">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6 backdrop-blur-sm">
          <p className="text-xs text-sidebar-foreground/60 font-medium mb-1 uppercase tracking-wider">Business</p>
          <p className="font-semibold truncate text-sm">{user?.fullName || "Loading..."}</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium text-sm",
                isActive 
                  ? "bg-accent/20 text-accent border border-accent/20 shadow-sm" 
                  : "hover:bg-white/10 text-sidebar-foreground/80 hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5 transition-transform", isActive ? "scale-110" : "group-hover:scale-110")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-sidebar-foreground/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
