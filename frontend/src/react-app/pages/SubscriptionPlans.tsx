import { useState, useEffect } from "react";
import { Check, CreditCard } from "lucide-react";

interface SubscriptionPlan {
  id: number;
  tier_name: string;
  monthly_price: number;
  yearly_price: number;
  currency: string;
  benefits: string;
  is_active: boolean;
  display_order: number;
}

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = useState(true);
  const [discountPercentage, setDiscountPercentage] = useState(17);

  useEffect(() => {
    fetchPlans();
    fetchSettings();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/subscription-plans");
      if (res.ok) {
        const data = await res.json();
        setPlans(data.filter((p: SubscriptionPlan) => p.is_active));
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/subscription-settings");
      if (res.ok) {
        const data = await res.json();
        setDiscountPercentage(data.yearly_discount_percentage || 17);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const getTierDisplayName = (tierName: string) => {
    const nameMap: Record<string, string> = {
      'mavy_lite': 'Mavy Lite',
      'mavy_plus': 'Mavy Plus',
      'mavy_pro': 'Mavy Pro',
      'mavy_max': 'Mavy Max'
    };
    return nameMap[tierName] || tierName.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  const handleSubscribe = async (planId: number) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    const price = billingCycle === "monthly" ? plan.monthly_price : plan.yearly_price;
    
    alert(`Subscribing to ${getTierDisplayName(plan.tier_name)} - ${billingCycle} plan for ${plan.currency} ${price.toFixed(2)}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600 mb-8">Unlock powerful features for your biomedical engineering career</p>
          
          <div className="inline-flex items-center bg-white rounded-full p-1 shadow-lg">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-3 rounded-full font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-3 rounded-full font-medium transition-all flex items-center gap-2 ${
                billingCycle === "yearly"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Yearly
              <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                Save {discountPercentage}%
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.sort((a, b) => a.display_order - b.display_order).map((plan) => {
            const isFree = plan.monthly_price === 0 && plan.yearly_price === 0;
            const isPopular = plan.tier_name === "mavy_pro";
            const price = billingCycle === "monthly" ? plan.monthly_price : plan.yearly_price;
            const benefits = JSON.parse(plan.benefits || "[]");

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-transform hover:scale-105 ${
                  isPopular ? "ring-4 ring-blue-500" : ""
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                    Most Popular
                  </div>
                )}

                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {getTierDisplayName(plan.tier_name)}
                  </h3>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-gray-900">
                        {plan.currency} {price.toFixed(0)}
                      </span>
                      <span className="text-gray-600">
                        /{billingCycle === "monthly" ? "month" : "year"}
                      </span>
                    </div>
                    {billingCycle === "yearly" && !isFree && (
                      <p className="text-sm text-green-600 mt-1">
                        Billed annually • Save {plan.currency} {((plan.monthly_price * 12) - plan.yearly_price).toFixed(0)}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {benefits.map((benefit: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isFree}
                    className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                      isFree
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : isPopular
                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
                        : "bg-gray-900 text-white hover:bg-gray-800"
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    {isFree ? "Current Plan" : "Subscribe Now"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">All plans include a 14-day money-back guarantee</p>
          <p className="text-sm text-gray-500">
            Have questions? <a href="/contact" className="text-blue-600 hover:underline">Contact our team</a>
          </p>
        </div>
      </div>
    </div>
  );
}
