/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, LayoutDashboard, Settings } from "lucide-react";
import { motion } from "motion/react";

const TEMPLATES = [
  {
    id: 'minimal',
    name: 'Minimal Royal',
    description: 'Clean typography, focus on visual story.',
    price: '₹999',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800',
    tag: 'Popular'
  },
  {
    id: 'beach',
    name: 'Coastal Bliss',
    description: 'Breezy layout, soft blues, and script fonts.',
    price: '₹999',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800',
    tag: 'Trendy'
  },
  {
    id: 'royal',
    name: 'Grand Manor',
    description: 'Serif brilliance, deep colors, elegant frames.',
    price: '₹999',
    image: 'https://images.unsplash.com/photo-1544124499-58912cbddaad?auto=format&fit=crop&q=80&w=800',
    tag: 'Classic'
  }
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-24 px-8 max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="uppercase tracking-[0.4em] text-[10px] font-bold text-editorial-accent mb-6 block">
            The Digital Invitation Suite
          </span>
          <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter mb-8 leading-tight">
            Celebrate your <br /> 
            <span className="text-editorial-accent">perfect union</span> digitally.
          </h1>
          <p className="max-w-2xl mx-auto text-editorial-secondary mb-12 text-lg leading-relaxed">
            Choose from our curated editorial templates to create a stunning, 
            premium wedding website that tells your unique story.
          </p>
        </motion.div>
      </section>

      {/* Templates Grid */}
      <section className="px-8 pb-32 max-w-6xl mx-auto w-full">
        {/* Featured Signature Template (Indian Royal Wedding) */}
        <section className="px-0 pb-32 max-w-6xl mx-auto w-full">
           <div className="flex items-center gap-3 text-editorial-accent mb-6">
              <Sparkles className="w-5 h-5" />
              <span className="text-[11px] font-bold uppercase tracking-[0.4em]">Premium Selection</span>
           </div>
           <div className="relative group cursor-pointer" onClick={() => navigate('/builder/royal-wedding')}>
              <div className="aspect-[21/9] rounded-3xl overflow-hidden mb-8 border border-editorial-border shadow-soft group-hover:shadow-2xl transition-all duration-700">
                 <img 
                   src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=1920" 
                   alt="Indian Royal Wedding" 
                   className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-12 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <h3 className="text-white text-5xl md:text-7xl font-serif italic mb-4">Indian Royal Wedding</h3>
                    <p className="text-white/80 text-xl md:text-2xl font-serif italic mb-4 opacity-0 group-hover:opacity-100 transition-opacity delay-100 italic">Experience heritage, grandeur, and artisanal design.</p>
                    <div className="flex items-center gap-4">
                       <button className="editorial-button bg-white text-editorial-ink hover:scale-105 border-none">
                         Customize Now
                       </button>
                       <span className="text-white/60 text-sm font-medium">₹999 Premium Collection</span>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        <h2 className="editorial-section-title mb-12">Signature Templates</h2>
        
        <div className="grid md:grid-cols-3 gap-12 mb-16">
          {TEMPLATES.map((tpl, i) => (
            <motion.div
              key={tpl.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="group cursor-pointer"
              onClick={() => navigate(`/builder/${tpl.id}`)}
            >
              <div className="relative aspect-[4/5] mb-6 overflow-hidden editorial-card border-none">
                <img 
                  src={tpl.image} 
                  alt={tpl.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] uppercase font-bold tracking-widest text-editorial-ink rounded-full">
                    {tpl.tag}
                  </span>
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button className="editorial-button bg-white text-editorial-ink hover:bg-white hover:scale-105">
                    Start Customizing
                  </button>
                </div>
              </div>
              
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-serif italic text-2xl">{tpl.name}</h3>
                <span className="text-sm font-medium text-editorial-accent">{tpl.price}</span>
              </div>
              <p className="text-sm text-editorial-secondary leading-relaxed mb-4">
                {tpl.description}
              </p>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-editorial-ink">
                <span>View Details</span>
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center">
           <button 
             onClick={() => navigate('/templates')}
             className="editorial-button bg-editorial-ink text-white hover:bg-black px-10 py-4"
           >
             View All Signature Templates
           </button>
        </div>
      </section>

      {/* Social Proof / Features */}
      <section className="bg-white py-24 border-y border-editorial-border">
        <div className="max-w-6xl mx-auto px-8 grid md:grid-cols-3 gap-16">
          <div className="text-center">
            <Sparkles className="w-8 h-8 text-editorial-accent mx-auto mb-6" />
            <h4 className="font-serif italic text-xl mb-3">Live Previews</h4>
            <p className="text-sm text-editorial-secondary leading-relaxed">
              Watch your site come to life as you edit with our side-by-side builder experience.
            </p>
          </div>
          <div className="text-center">
            <LayoutDashboard className="w-8 h-8 text-editorial-accent mx-auto mb-6" />
            <h4 className="font-serif italic text-xl mb-3">RSVP Management</h4>
            <p className="text-sm text-editorial-secondary leading-relaxed">
              Track responses effortlessly and set custom limits for your exclusive guest list.
            </p>
          </div>
          <div className="text-center">
            <Settings className="w-8 h-8 text-editorial-accent mx-auto mb-6" />
            <h4 className="font-serif italic text-xl mb-3">Mobile Optimized</h4>
            <p className="text-sm text-editorial-secondary leading-relaxed">
              Your invitations look flawless on any device, from desktop to the smallest smartphone.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}