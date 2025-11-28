
import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, subtitle, action, children, className, ...props }) => {
  return (
    <div 
      className={cn(
        "bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden shadow-xl transition-all hover:border-slate-600 flex flex-col",
        className
      )} 
      {...props}
    >
      {(title || action) && (
        <div className="px-6 py-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/30 flex-shrink-0">
          <div>
            {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
            {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6 flex-grow relative">
        {children}
      </div>
    </div>
  );
};
