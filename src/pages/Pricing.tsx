/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";

const PLANS = [
  {
    name: "Standard",
    price: "₹0",
    description: "Try out the platform and share your draft.",
    features: [
        "1 Digital Invitation",
        "Watermarked Preview",
        "10 Guest Views",
        "Standard Templates",
        "Basic RSVP Tracking"
    ],
    buttonText: "Get Started",
    accent: false
  },
  {
    name: "Prime",
    price: "₹999",
    description: "Professional suite for the perfect digital union.",
    features: [
        "All Standard Features",
        "Remove Watermarks",
        "500 Guest Views",
        "Premium Templates",
        "Custom Location Maps",
        "Gallery Image Hosting",
        "Priority Support"
    ],
    buttonText: "Go Premium",
    accent: true
  },
  {
    name: "Luxury",
    price: "₹2,499",
    description: "High-end bespoke digital experience with full support.",
    features: [
        "All Prime Features",
        "Unlimited Guest Views",
        "Exclusive Royal Templates",
        "Custom Domain Support",
        "Wedding Countdown Timer",
        "One-on-one consultation"
    ],
    buttonText: "Contact Sales",
    accent: false
  }
];

export default function Pricing() {
  return (
    <div className="py-24 px-6 lg:px-8 max-w-6xl mx-auto w-full">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-serif italic mb-4 leading-tight">Simple, transparent <span className="text-editorial-accent">pricing</span>.</h1>
        <p className="text-editorial-secondary max-w-xl mx-auto">
          Choose the plan that fits your wedding celebration. Upgrade at any time to unlock more features.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`editorial-card p-10 flex flex-col ${plan.accent ? 'border-editorial-accent ring-1 ring-editorial-accent' : ''}`}
          >
            <div className="mb-8">
              <h3 className="font-serif italic text-2xl mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-editorial-ink">{plan.price}</span>
                <span className="text-xs text-editorial-muted font-bold uppercase tracking-widest">/ one-time</span>
              </div>
              <p className="mt-4 text-sm text-editorial-secondary leading-relaxed">
                {plan.description}
              </p>
            </div>

            <div className="flex-1 space-y-4 mb-10">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <div className={`mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${plan.accent ? 'bg-editorial-accent text-white' : 'bg-editorial-bg text-editorial-muted'}`}>
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span className="text-sm text-editorial-ink">{feature}</span>
                </div>
              ))}
            </div>

            <Link 
              to={plan.name === 'Luxury' ? '#' : '/'} 
              className={`w-full py-3 rounded-full text-center text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                plan.accent 
                  ? 'bg-editorial-accent text-white hover:bg-[#B37E4A]' 
                  : 'bg-editorial-bg text-editorial-ink border border-editorial-border hover:bg-white'
              }`}
            >
              <span>{plan.buttonText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-24 editorial-card p-12 bg-editorial-ink text-white flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
             <h2 className="text-3xl font-serif italic mb-4">Have questions about our plans?</h2>
             <p className="text-white/60 text-sm leading-relaxed max-w-md">
                Our support team is available 24/7 to help you choose the best plan for your special day. Reach out to us anytime.
             </p>
          </div>
          <button className="editorial-button bg-white text-editorial-ink hover:bg-white/90">
             Talk to an Expert
          </button>
      </div>
    </div>
  );
}
