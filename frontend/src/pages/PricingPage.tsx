import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Zap } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/ui/page-header";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Plan {
  id: string;
  name: string;
  price: number;
  priceMonthly?: string;
  features: string[];
  popular?: boolean;
}

export function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, refreshUser } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    api.get("/payments/plans").then(({ data }) => setPlans(data.plans)).catch(() => {});

    // Load Razorpay script
    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.head.appendChild(script);
    }
  }, []);

  async function handleUpgrade() {
    if (user?.plan === "PRO") {
      toast({ title: "You're already on Pro!" });
      return;
    }

    setLoading(true);
    try {
      const { data: order } = await api.post("/payments/create-order");

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Sylla",
        description: "Sylla Pro — Monthly Plan",
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            const { data } = await api.post("/payments/verify", response);
            toast({ title: data.message });
            await refreshUser();
          } catch {
            toast({ title: "Payment verification failed", variant: "destructive" });
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: "#22c55e" },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast({ title: "Failed to initiate payment", description: (err as Error).message, variant: "destructive" });
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <PageHeader
        title="Plans"
        subtitle="Choose the plan that fits your study goals"
      />

      {user?.plan === "PRO" && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
          <Crown size={16} className="text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">You're on Pro</p>
            <p className="text-xs text-muted-foreground font-mono">
              {user.planExpiresAt
                ? `Expires ${new Date(user.planExpiresAt).toLocaleDateString()}`
                : "Active subscription"}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-card border rounded-xl p-6 relative ${
              plan.popular
                ? "border-primary/40 shadow-[0_0_30px_rgba(34,197,94,0.08)]"
                : "border-border"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground font-mono text-[10px] tracking-widest px-3 py-1 rounded-full">
                  POPULAR
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 mb-2">
              {plan.popular ? (
                <Crown size={16} className="text-primary" />
              ) : (
                <Zap size={16} className="text-muted-foreground" />
              )}
              <h3 className="font-semibold text-foreground">{plan.name}</h3>
            </div>

            <div className="mb-6">
              {plan.price === 0 ? (
                <span className="font-mono text-3xl font-semibold text-foreground">Free</span>
              ) : (
                <div>
                  <span className="font-mono text-3xl font-semibold text-foreground">₹{plan.price}</span>
                  <span className="text-muted-foreground text-sm font-mono">/month</span>
                </div>
              )}
            </div>

            <ul className="space-y-2.5 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check size={13} className="text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={plan.id === "pro" ? handleUpgrade : undefined}
              disabled={
                loading ||
                (plan.id === "free" && user?.plan === "FREE") ||
                (plan.id === "pro" && user?.plan === "PRO")
              }
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                plan.popular
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  : "bg-secondary text-muted-foreground border border-border cursor-default"
              }`}
            >
              {plan.id === "free"
                ? user?.plan === "FREE" ? "Current Plan" : "Downgrade"
                : user?.plan === "PRO"
                ? "Current Plan"
                : loading
                ? "Processing..."
                : "Upgrade to Pro"}
            </button>
          </motion.div>
        ))}
      </div>

      <p className="text-center font-mono text-xs text-muted-foreground">
        Payments secured by Razorpay · Cancel anytime
      </p>
    </div>
  );
}
