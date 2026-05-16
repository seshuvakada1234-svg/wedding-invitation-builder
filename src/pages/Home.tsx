/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useNavigate } from "react-router-dom";
import { ArrowRight, Heart, Globe, Camera, Share2 } from "lucide-react";
import { motion } from "motion/react";
import SEO from "../components/SEO";
import Hero from "../components/Hero";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      <SEO 
        title="Luxury Digital Wedding Invitation Builder"
        description="Craft ultra-luxury digital wedding invitations with cinematic storytelling, RSVP management, and premium templates. The #1 luxury wedding website builder."
      />

      <Hero />

      {/* SEO Content Sections */}
      <section className="bg-editorial-bg py-32 px-8 border-t border-editorial-border overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-24 items-center mb-40">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -top-12 -left-12 w-48 h-48 bg-editorial-accent/10 rounded-full blur-3xl animate-pulse" />
              <h2 className="text-4xl md:text-6xl font-serif italic mb-8 leading-tight">
                Luxury Wedding <br /> Invitation Templates
              </h2>
              <p className="text-editorial-secondary text-lg font-editorial leading-relaxed mb-10">
                Our templates are crafted with an obsession for detail, taking inspiration from cinematic storytelling and high-editorial design. Each invitation is more than a link; it's a digital heirloom that tells your unique story with elegance and poise.
              </p>
              <ul className="space-y-4 mb-12 text-editorial-ink font-medium">
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-editorial-accent" />
                  <span>Cinematic High-Resolution Visuals</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-editorial-accent" />
                  <span>Customizable Editorial Layouts</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-editorial-accent" />
                  <span>Exclusive Typography Pairings</span>
                </li>
              </ul>
              <button 
                onClick={() => navigate('/templates')}
                className="editorial-button flex items-center gap-2 group"
              >
                <span>View Luxury Collection</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-square rounded-[40px] overflow-hidden shadow-2xl border border-white"
            >
              <img 
                src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1200" 
                alt="Luxury Wedding Invitation Preview"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-editorial-ink/20" />
              <div className="absolute bottom-12 left-12 right-12 bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl">
                <p className="text-white font-serif italic text-xl mb-2">"The digital invitation felt as premium as a physical card."</p>
                <p className="text-white/60 text-xs uppercase tracking-widest">— Sarah & David</p>
              </div>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 gap-24 items-center mb-40">
            <motion.div 
              initial={{ opacity: 0, order: 2 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="md:order-2"
            >
              <h2 className="text-4xl md:text-6xl font-serif italic mb-8 leading-tight">
                AI Wedding <br /> Invitation Builder
              </h2>
              <p className="text-editorial-secondary text-lg font-editorial leading-relaxed mb-10">
                Experience the magic of AI combined with editorial precision. Our builder allows you to orchestrate every detail of your invitation experience, from immersive background music to responsive galleries and dynamic RSVP tracking.
              </p>
              <div className="grid grid-cols-2 gap-8 mb-12">
                <div>
                  <h4 className="text-editorial-accent font-serif italic text-2xl mb-2">1,200+</h4>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-editorial-muted">Couples Served</p>
                </div>
                <div>
                  <h4 className="text-editorial-accent font-serif italic text-2xl mb-2">99.9%</h4>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-editorial-muted">Uptime Score</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/builder/royal-wedding')}
                className="editorial-button bg-editorial-ink text-white hover:bg-black"
              >
                Try AI Builder
              </button>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: -30, order: 1 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="md:order-1 relative"
            >
               <div className="aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl border border-white rotate-[-2deg] relative z-10">
                 <img 
                    src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200" 
                    alt="AI Wedding Editor"
                    className="w-full h-full object-cover"
                    loading="lazy"
                 />
               </div>
               <div className="absolute top-1/2 -right-12 w-32 h-32 bg-editorial-accent/20 rounded-full blur-2xl animate-bounce" />
            </motion.div>
          </div>

          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-7xl font-serif italic mb-12 leading-tight">
              Indian Wedding <br /> 
              <span className="text-editorial-accent">Invitation Websites</span>
            </h2>
            <p className="text-editorial-secondary text-xl font-editorial leading-relaxed mb-16">
              Specializing in the grandeur of Indian weddings, Wedding Invitation offers meticulously designed templates that honor heritage while embracing digital innovation. From Royal Jaipur aesthetics to Minimalist Kerala vibes.
            </p>
            <div className="grid md:grid-cols-4 gap-12 text-center mb-24">
               <div>
                  <Globe className="w-8 h-8 text-editorial-accent mx-auto mb-4" />
                  <h5 className="font-serif italic text-lg mb-1">Global RSVP</h5>
                  <p className="text-[10px] text-editorial-muted uppercase tracking-widest">Guest Tracking</p>
               </div>
               <div>
                  <Camera className="w-8 h-8 text-editorial-accent mx-auto mb-4" />
                  <h5 className="font-serif italic text-lg mb-1">Live Gallery</h5>
                  <p className="text-[10px] text-editorial-muted uppercase tracking-widest">Share Moments</p>
               </div>
               <div>
                  <Heart className="w-8 h-8 text-editorial-accent mx-auto mb-4" />
                  <h5 className="font-serif italic text-lg mb-1">Gift Registry</h5>
                  <p className="text-[10px] text-editorial-muted uppercase tracking-widest">Seamless Gifting</p>
               </div>
               <div>
                  <Share2 className="w-8 h-8 text-editorial-accent mx-auto mb-4" />
                  <h5 className="font-serif italic text-lg mb-1">One Click Share</h5>
                  <p className="text-[10px] text-editorial-muted uppercase tracking-widest">WhatsApp & SMS</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-32 px-8 text-center bg-white border-t border-editorial-border">
         <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-serif italic mb-8 leading-tight">
              Ready to Craft <br /> Your Cinematic Story?
            </h2>
            <p className="text-editorial-secondary text-lg font-editorial mb-12">
              Join thousands of couples creating immersive, luxury wedding experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
               <button 
                 onClick={() => navigate('/templates')}
                 className="editorial-button bg-editorial-ink text-white px-12 py-5 text-lg"
               >
                 Explore Templates
               </button>
               <button 
                 onClick={() => navigate('/login')}
                 className="editorial-button bg-white text-editorial-ink border border-editorial-border px-12 py-5 text-lg"
               >
                 Get Started Free
               </button>
            </div>
         </div>
      </section>
    </div>
  );
}