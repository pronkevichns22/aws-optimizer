import { useState } from 'react';
import { Plus, Loader2, Paperclip, Send, ChevronDown, ChevronUp } from 'lucide-react';

export const AIAdvisor = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="flex flex-col bg-[#13141B] border border-[#242732] rounded-[16px] overflow-hidden shadow-lg" 
      style={{ minHeight: isExpanded ? '400px' : 'auto' }}>
      
      {/* Header */}
      <div className="p-5 border-b border-[#242732] flex justify-between items-center hover:bg-[#1C1D25]/50 transition-colors cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-3 flex-1">
          <span className="text-[#818CA2] text-xs font-bold tracking-widest uppercase">AI Advisor</span>
          <div className="text-[#479DFF] text-[9px] font-bold px-2 py-1 rounded-full bg-[#479DFF]/10 border border-[#479DFF]/30">
            BETA
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded && (
            <button className="flex items-center gap-1.5 text-[#818CA2] hover:text-white transition-colors">
              <Plus size={16} /> 
              <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Chat</span>
            </button>
          )}
          <button className="text-[#818CA2] hover:text-white transition-colors">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <>
          <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-30 min-h-[250px] py-8">
            <Loader2 size={44} className="animate-spin text-[#818CA2]" />
            <span className="text-sm font-bold text-white">Coming soon.....</span>
          </div>
          
          {/* Input */}
          <div className="p-5 border-t border-[#242732] flex items-center justify-between bg-[#0B0C10]/20 hover:bg-[#0B0C10]/40 transition-colors">
            <button className="text-[#818CA2] hover:text-white transition-colors p-1 disabled:opacity-50" disabled>
              <Paperclip size={20} />
            </button>
            <button className="text-[#818CA2] hover:text-white transition-colors p-1 disabled:opacity-50" disabled>
              <Send size={20} className="rotate-45" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
