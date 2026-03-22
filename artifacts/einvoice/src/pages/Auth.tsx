import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, ShieldCheck, Mail, Lock, User, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login({ data: { email, password } });
        toast({ title: "Welcome back", description: "Successfully logged in." });
      } else {
        await register({ data: { email, password, fullName } });
        toast({ title: "Account created", description: "Welcome to FIRS Sync." });
      }
      setLocation("/");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: err.message || "An error occurred during authentication."
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50">
      {/* Left side - Visuals */}
      <div className="hidden lg:flex w-1/2 relative bg-primary overflow-hidden sidebar-gradient flex-col justify-between p-12">
        <div className="relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-xl mb-8">
            <ShieldCheck className="w-7 h-7 text-accent" />
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-4 tracking-tight leading-tight">
            Government Compliance,<br/>Simplified.
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-md leading-relaxed">
            Directly connect your invoicing workflow to the Federal Inland Revenue Service API with zero friction.
          </p>
        </div>

        {/* Abstract graphics instead of just image */}
        <div className="absolute inset-0 z-0 opacity-50">
          <img src={`${import.meta.env.BASE_URL}images/auth-bg.png`} alt="Auth Background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/50 to-primary/95 mix-blend-multiply" />
        </div>

        <div className="relative z-10 flex items-center gap-4 text-white/60 text-sm font-medium">
          <ShieldCheck className="w-5 h-5 text-accent/80" />
          <span>Enterprise-grade security • NDPR Compliant</span>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 bg-white" />
        
        <div className="w-full max-w-md relative z-10">
          <div className="lg:hidden flex items-center gap-3 mb-8">
             <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-display font-bold text-xl text-primary">FIRS Sync</h1>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-display font-bold text-foreground mb-2">
              {isLogin ? "Sign in to portal" : "Create an account"}
            </h2>
            <p className="text-muted-foreground">
              {isLogin ? "Enter your details to access your dashboard." : "Set up your business profile for e-invoicing."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-medium text-foreground">Full Name</label>
                  <div className="relative">
                    <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Password</label>
                {isLogin && <a href="#" className="text-xs font-semibold text-primary hover:underline">Forgot password?</a>}
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn || isRegistering}
              className="w-full mt-6 py-3 px-4 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {isLoggingIn || isRegistering ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => setIsLogin(!isLogin)} 
                className="font-semibold text-primary hover:underline"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
