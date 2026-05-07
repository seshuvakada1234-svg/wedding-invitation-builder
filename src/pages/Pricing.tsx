/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Check, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { auth, authFetch } from "../lib/firebase";
import toast from "react-hot-toast";

export default function Pricing() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [minimalPrice, setMinimalPrice] = useState(499);

  useEffect(() => {
    async function loadPrice() {
      try {
        const { getDoc, doc } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        const snap = await getDoc(doc(db, "templates", "minimal"));
        if (snap.exists()) {
          const data = snap.data();
          if (data.publishPrice) setMinimalPrice(Number(data.publishPrice));
        }
      } catch (e) {
        console.error("Failed to load minimal price:", e);
      }
    }
    loadPrice();

    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    if (!auth.currentUser) {
      toast.error("Please login first to continue.");
      navigate("/login");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Get Config and Create Order on Backend
      const configRes = await fetch("/api/config");
      const config = await configRes.json();
      const razorpayKeyId = config.razorpayKeyId;

      if (!razorpayKeyId) {
        throw new Error("Razorpay Key ID not configured on server.");
      }

      const orderRes = await authFetch("/api/create-order", {
        method: "POST",
        body: JSON.stringify({ templateId: "minimal" }) // Default to minimal tier for the 499 plan
      });

      const data = await orderRes.json();
      if (!data.success) throw new Error(data.error || "Failed to create order");

      const order = data.order;

      // 2. Open Razorpay Checkout
      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: "Wedding Invitations",
        description: "One-time payment for premium invitation access",
        order_id: order.id,
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          }
        },
        handler: async (response: any) => {
          setIsProcessing(true); // Keep processing during verification
          try {
            const verifyRes = await authFetch("/api/verify-payment", {
              method: "POST",
              body: JSON.stringify({
                ...response,
                userId: auth.currentUser?.uid,
                email: auth.currentUser?.email,
                templateId: "minimal"
              }),
            });
            const verifyData = await verifyRes.json();
 
            if (verifyData.success) {
              toast.success("Payment successful! Redirecting...");
              setTimeout(() => navigate("/builder"), 1500);
            } else {
              throw new Error(verifyData.error);
            }
          } catch (err: any) {
            toast.error("Payment verification failed: " + err.message);
            setIsProcessing(false);
          }
        },
        prefill: {
          email: auth.currentUser.email || "",
          name: auth.currentUser.displayName || "",
        },
        theme: {
          color: "#D4AF37",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error("Failed to initiate payment: " + error.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="py-24 px-6 lg:px-8 max-w-4xl mx-auto w-full">
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-serif italic mb-6 leading-tight"
        >
          Unlock Your <span className="text-editorial-accent">Wedding Invitation</span>
        </motion.h1>
        <p className="text-editorial-secondary max-w-xl mx-auto text-lg leading-relaxed">
          Create, customize, and share your perfect digital invitation with our premium tools and support.
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="editorial-card p-12 flex flex-col border-editorial-accent ring-1 ring-editorial-accent bg-white shadow-2xl relative"
        >
          <div className="absolute -top-4 right-8 bg-editorial-accent text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg">
            Best Value
          </div>

          <div className="mb-10 text-center">
            <h3 className="font-serif italic text-3xl mb-2">Premium Plan</h3>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold text-editorial-ink">₹{minimalPrice}</span>
              <span className="text-sm text-editorial-muted font-bold uppercase tracking-widest">/ one-time</span>
            </div>
          </div>

          <div className="space-y-6 mb-12">
            {[
              "Unlimited Edits & Updates",
              "Permanent Shareable Link",
              "Access to All Premium Templates",
              "High-Resolution Gallery Hosting",
              "Interactive RSVP & Guest List",
              "Custom Map & Location Integration",
              "No Watermarks or Ads"
            ].map((feature) => (
              <div key={feature} className="flex items-start gap-4">
                <div className="mt-1 shrink-0 w-5 h-5 rounded-full bg-editorial-accent/10 flex items-center justify-center">
                  <Check className="w-3 h-3 text-editorial-accent" />
                </div>
                <span className="text-editorial-ink font-medium">{feature}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full editorial-button bg-editorial-ink text-white py-5 rounded-xl hover:bg-black transition-all flex items-center justify-center gap-3 group"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span className="text-xs font-bold uppercase tracking-[0.3em]">Pay & Publish</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <p className="mt-8 text-center text-xs text-editorial-muted leading-relaxed italic">
            Secure processing by Razorpay. No recurring charges.
          </p>
        </motion.div>
      </div>

      <div className="mt-20 text-center">
         <p className="text-editorial-muted text-sm italic font-serif">
            "We were amazed at how beautiful our digital invite looked. Worth every penny!"
         </p>
         <div className="mt-4 flex justify-center gap-1">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="w-1.5 h-1.5 bg-editorial-accent rounded-full opacity-60"></div>
            ))}
         </div>
      </div>
    </div>
  );
}
