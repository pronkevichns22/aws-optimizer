import { RotateCw, List, Download, MessageCircle, Plus } from 'lucide-react';

interface SecuritySidebarProps {
  onRescan?: () => void;
  onLogs?: () => void;
  onExport?: () => void;
  onNewChat?: () => void;
  onAskQuestion?: () => void;
}

export const SecuritySidebar = ({
  onRescan,
  onLogs,
  onExport,
  onNewChat,
  onAskQuestion,
}: SecuritySidebarProps) => {
  return (
    <div className="w-80 flex flex-col gap-9">
      {/* Title */}
      <div className="text-white text-4xl font-extrabold">Security</div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <div className="p-2 bg-zinc-900 rounded-2xl border border-[#2a3142] flex flex-col gap-2.5">
          <div className="flex gap-1">
            {/* Rescan Button */}
            <button
              onClick={onRescan}
              className="w-24 h-28 px-8 py-6 rounded-2xl flex flex-col justify-center items-center gap-2 bg-zinc-900 hover:bg-zinc-800 transition-colors"
            >
              <div className="h-10 p-2 bg-neutral-800 rounded-3xl inline-flex items-center justify-center">
                <RotateCw className="w-6 h-6 text-[#818ca2]" />
              </div>
              <div className="text-center text-[#818ca2] text-xs font-semibold">Rescan</div>
            </button>

            {/* Logs Button */}
            <button
              onClick={onLogs}
              className="w-24 h-28 px-8 py-6 rounded-2xl flex flex-col justify-center items-center gap-2 bg-zinc-900 hover:bg-zinc-800 transition-colors"
            >
              <div className="h-10 p-2 bg-neutral-800 rounded-3xl inline-flex items-center justify-center">
                <List className="w-6 h-6 text-slate-400" />
              </div>
              <div className="text-center text-[#818ca2] text-xs font-semibold">Logs</div>
            </button>

            {/* Export Button */}
            <button
              onClick={onExport}
              className="w-24 h-28 px-8 py-6 rounded-2xl flex flex-col justify-center items-center gap-2 bg-zinc-900 hover:bg-zinc-800 transition-colors"
            >
              <div className="h-10 p-2 bg-neutral-800 rounded-3xl inline-flex items-center justify-center">
                <Download className="w-6 h-6 text-[#818ca2]" />
              </div>
              <div className="text-center text-[#818ca2] text-xs font-semibold">Export</div>
            </button>
          </div>
        </div>

        {/* AI Advisor Card */}
        <div className="h-[499px] bg-zinc-900 rounded-2xl border border-[#2a3142] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-[#2a3142] flex justify-between items-center">
            <div className="text-[#818ca2] text-xs font-semibold">AI Advisor</div>
            <button
              onClick={onNewChat}
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5 text-[#818ca2]" />
              <div className="text-[#818ca2] text-xs font-semibold">New Chat</div>
            </button>
          </div>

          {/* Loading State */}
          <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-60">
            <div className="w-12 h-12 border-2 border-slate-400 rounded-full animate-spin"></div>
            <div className="text-slate-400 text-base font-semibold">Coming soon...</div>
          </div>

          {/* Input Footer */}
          <div className="border-t border-[#2a3142] p-4">
            <div className="flex items-center gap-2 bg-neutral-800 rounded-2xl px-3 py-2">
              <MessageCircle className="w-6 h-6 text-[#818ca2]" />
              <div className="flex-1 text-[#818ca2] text-xs font-semibold opacity-60">
                Ask about costs or security...
              </div>
              <button
                onClick={onAskQuestion}
                className="text-[#818ca2] hover:text-white transition-colors"
              >
                <RotateCw className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
