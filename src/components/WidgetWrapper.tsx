"use client";

import { Maximize2, Minimize2, X } from "lucide-react";
import { ReactNode } from "react";

interface WidgetWrapperProps {
  id: string;
  title: string;
  icon: ReactNode;
  children: ReactNode;
  isActive: boolean;
  isMaximized: boolean;
  onToggleMaximize: (id: string) => void;
  onClose: (id: string) => void;
}

export default function WidgetWrapper({
  id,
  title,
  icon,
  children,
  isActive,
  isMaximized,
  onToggleMaximize,
  onClose
}: WidgetWrapperProps) {
  if (!isActive) return null;

  return (
    <div className={`flex flex-col bg-white dark:bg-black/20 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100 overflow-hidden transition-all duration-300 ease-in-out ${isMaximized ? 'fixed inset-4 z-[100] shadow-2xl' : 'w-full h-auto relative'}`}>
      
      {/* Widget Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-neutral-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm text-neutral-600">
            {icon}
          </div>
          <h3 className="font-bold text-neutral-900">{title}</h3>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => onToggleMaximize(id)} 
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/50 rounded-md transition-colors"
            title={isMaximized ? "Réduire" : "Agrandir"}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <div className="w-px h-4 bg-neutral-200 mx-1"></div>
          <button 
            onClick={() => onClose(id)} 
            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Widget Content */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar p-6 ${isMaximized ? 'h-full' : ''}`}>
        {children}
      </div>
      
    </div>
  );
}
