import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useBusiness } from "@/hooks/use-business";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Key, CreditCard, CheckCircle2, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const { user } = useAuth();
  const { updateProfile, connectFirs, selectSubscription } = useBusiness();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Profile Form
  const [companyName, setCompanyName] = useState("");
  const [tin, setTin] = useState("");
  const [address, setAddress] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // FIRS Form
  const [apiKey, setApiKey] = useState("");
  const [taxOfficeCode, setTaxOfficeCode] = useState("");

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateProfile({
        data: {
          companyName,
          tin,
          registeredAddress: address,
          contactEmail,
          contactPhone
        }
      });
      setStep(2);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFirsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await connectFirs({
        data: { apiKey, taxOfficeCode }
      });
      setStep(3);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Connection Failed", description: "Invalid FIRS credentials." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubscription = async (plan: 'basic' | 'enterprise') => {
    setIsSubmitting(true);
    try {
      await selectSubscription({ data: { plan } });
      toast({ title: "Setup Complete", description: "Your business is ready for e-invoicing." });
      setLocation("/");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-display font-bold text-foreground">Welcome, {user?.fullName?.split(' ')[0]}</h1>
          <p className="text-muted-foreground mt-2">Let's get your business set up for FIRS e-invoicing.</p>
        </div>

        {/* Progress Stepper */}
        <div className="flex items-center justify-between mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10 -translate-y-1/2" />
          <div className="absolute top-1/2 left-0 h-0.5 bg-primary -z-10 -translate-y-1/2 transition-all duration-500" style={{ width: `${(step - 1) * 50}%` }} />
          
          {[
            { num: 1, label: "Business Profile", icon: Building2 },
            { num: 2, label: "FIRS Integration", icon: Key },
            { num: 3, label: "Subscription", icon: CreditCard }
          ].map((s) => (
            <div key={s.num} className="flex flex-col items-center gap-2 bg-slate-50 px-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                step > s.num ? "bg-primary border-primary text-white" :
                step === s.num ? "bg-white border-primary text-primary shadow-lg" :
                "bg-white border-border text-muted-foreground"
              }`}>
                {step > s.num ? <CheckCircle2 className="w-6 h-6" /> : <s.icon className="w-5 h-5" />}
              </div>
              <span className={`text-sm font-medium ${step >= s.num ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleProfileSubmit}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold font-display text-foreground mb-1">Business Details</h2>
                  <p className="text-sm text-muted-foreground mb-6">Enter your registered business information.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Company Name</label>
                    <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Acme Corp Ltd" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">TIN (Tax ID)</label>
                    <input type="text" required value={tin} onChange={e => setTin(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="12345678-0001" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-foreground">Registered Address</label>
                    <input type="text" required value={address} onChange={e => setAddress(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="123 Business Avenue, Lagos" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Contact Email</label>
                    <input type="email" required value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="finance@acme.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Contact Phone</label>
                    <input type="tel" required value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="+234 800 000 0000" />
                  </div>
                </div>

                <div className="pt-6 flex justify-end">
                  <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2">
                    {isSubmitting ? "Saving..." : "Continue to Next Step"}
                    {!isSubmitting && <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleFirsSubmit}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold font-display text-foreground mb-1">Connect FIRS API</h2>
                  <p className="text-sm text-muted-foreground mb-6">Enter your API credentials provided by the FIRS e-invoicing portal.</p>
                </div>
                
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800">Your API keys are encrypted at rest. We securely transmit your invoices directly to FIRS endpoints.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">API Key</label>
                    <input type="password" required value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono" placeholder="firs_live_xxxxxxxxxxxxxxxx" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Tax Office Code</label>
                    <input type="text" required value={taxOfficeCode} onChange={e => setTaxOfficeCode(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono" placeholder="MSTO-001" />
                  </div>
                </div>

                <div className="pt-6 flex justify-between">
                  <button type="button" onClick={() => setStep(1)} className="px-6 py-3 text-muted-foreground font-medium rounded-xl hover:bg-slate-100 transition-all">
                    Back
                  </button>
                  <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2">
                    {isSubmitting ? "Connecting..." : "Verify & Connect"}
                    {!isSubmitting && <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </motion.form>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold font-display text-foreground mb-2">Select a Plan</h2>
                  <p className="text-muted-foreground">Choose the plan that fits your invoicing volume.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Plan */}
                  <div className="border border-border rounded-2xl p-6 hover:shadow-lg hover:border-primary/30 transition-all bg-white relative overflow-hidden group">
                    <h3 className="text-lg font-bold text-foreground">Basic</h3>
                    <div className="mt-2 mb-4 flex items-baseline gap-1">
                      <span className="text-3xl font-bold">₦0</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {["Up to 50 invoices/month", "Standard FIRS submission", "Email support"].map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button 
                      onClick={() => handleSubscription('basic')}
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition-colors"
                    >
                      Select Basic
                    </button>
                  </div>

                  {/* Enterprise Plan */}
                  <div className="border-2 border-primary rounded-2xl p-6 shadow-xl shadow-primary/10 bg-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
                    <h3 className="text-lg font-bold text-primary">Enterprise</h3>
                    <div className="mt-2 mb-4 flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-primary">₦15,000</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {["Unlimited invoices", "Priority FIRS queue", "API Access", "24/7 Phone support"].map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button 
                      onClick={() => handleSubscription('enterprise')}
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all hover:shadow-lg hover:-translate-y-0.5"
                    >
                      Select Enterprise
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
