import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const EditorSection = ({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon?: any }) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
    <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
      {Icon && <Icon className="w-4 h-4 text-purple-600" />}
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500">{title}</h3>
    </div>
    <div className="space-y-5">
      {children}
    </div>
  </div>
);

export const EditorField = ({ label, children, description }: { label: string; children: React.ReactNode; description?: string }) => (
  <div className="group space-y-2">
    <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider group-focus-within:text-purple-600 transition-colors">
      {label}
    </label>
    {children}
    {description && <p className="text-[9px] text-gray-400 italic leading-tight">{description}</p>}
  </div>
);

export const EditorInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={cn(
      "w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-hidden",
      props.className
    )}
  />
);

export const EditorTextarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={cn(
      "w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-hidden min-h-[100px]",
      props.className
    )}
  />
);
