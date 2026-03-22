import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Auth from "@/pages/Auth";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import CustomerList from "@/pages/customers/CustomerList";
import CustomerNew from "@/pages/customers/CustomerNew";
import InvoiceList from "@/pages/invoices/InvoiceList";
import InvoiceNew from "@/pages/invoices/InvoiceNew";
import InvoiceDetail from "@/pages/invoices/InvoiceDetail";
import { useAuth } from "@/hooks/use-auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 1000 * 60,
    },
  },
});

function LoadingScreen() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoutes() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      setLocation("/auth");
    } else if (!user.onboardingComplete) {
      setLocation("/onboarding");
    }
  }, [isLoading, user, setLocation]);

  if (isLoading) return <LoadingScreen />;
  if (!user || !user.onboardingComplete) return null;

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/customers" component={CustomerList} />
      <Route path="/customers/new" component={CustomerNew} />
      <Route path="/invoices" component={InvoiceList} />
      <Route path="/invoices/new" component={InvoiceNew} />
      <Route path="/invoices/:id" component={InvoiceDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      <Route path="/onboarding" component={Onboarding} />
      <Route component={ProtectedRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
