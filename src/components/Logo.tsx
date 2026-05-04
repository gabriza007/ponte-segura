import React from 'react';
import { Shield } from 'lucide-react';

export default function Logo({ size = 32, className = '' }: { size?: number, className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Glowing background */}
        <div className="absolute inset-0 bg-primary/30 blur-md rounded-full"></div>
        {/* Shield icon */}
        <Shield size={size} className="text-primary relative z-10" />
        {/* Bridge-like arches inside shield (simplified representation) */}
        <svg 
          className="absolute z-10 text-white" 
          width={size * 0.5} 
          height={size * 0.5} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="3" 
          strokeLinecap="round"
        >
          <path d="M4 20 A8 8 0 0 1 20 20" />
          <path d="M9 20 A3 3 0 0 1 15 20" />
        </svg>
      </div>
      <span className="outfit-font font-black tracking-tight text-white whitespace-nowrap" style={{ fontSize: size * 0.85 }}>
        Ponte Segura
      </span>
    </div>
  );
}
