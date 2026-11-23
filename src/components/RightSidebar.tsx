import React, { useState } from 'react';
import { PreviewContext, BookmarkItem } from '../types';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Bookmark,
  ShieldCheck,
  AlertTriangle,
  Info,
  Layers,
  FileText
} from 'lucide-react';

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  context: PreviewContext | null;
  onJumpToTabular: (blockId: string, code: string) => void;
  isBookmarked: boolean;
  onToggleBookmark: (item: BookmarkItem) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  isOpen,
  onClose,
  context,
  onJumpToTabular,
  isBookmarked,
  onToggleBookmark
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedExtension, setSelectedExtension] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const extensions = context?.sevenChrDef?.extensions || [];

  // Build composite code with selected 7th char extension
  const getCompositeCode = (extChar: string) => {
    if (!context) return '';
    let base = context.code;
    const clean = base.replace('.', '');
    if (clean.length === 3) {
      return `${base}.XXX${extChar}`;
    } else if (clean.length === 4) {
      return `${base}XX${extChar}`;
    } else if (clean.length === 5) {
      return `${base}X${extChar}`;
    } else if (clean.length === 6) {
      return `${base}${extChar}`;
    }
    return `${base}${extChar}`;
  };

  return (
    <aside className="w-84 sm:w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 select-none h-full overflow-hidden shadow-xl z-20">
      {/* Drawer Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Clinical Guidelines & Preview
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {context ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Main Code Highlight Card */}
          <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-xl font-black text-blue-700 dark:text-blue-400 tracking-tight">
                  {context.code}
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  {context.requires_7th ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/70 dark:text-purple-300">
                      7th Chr Required
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-300">
                      Standard Code
                    </span>
                  )}
                  {context.block_id && (
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      Sec: {context.block_id}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Bookmark & Copy */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    onToggleBookmark({
                      code: context.code,
                      desc: context.desc || '',
                      block_id: context.block_id || '',
                      chapter: context.chapter_num || '',
                      is_leaf: !context.requires_7th,
                      requires_7th: !!context.requires_7th,
                      savedAt: Date.now()
                    })
                  }
                  className={`p-1.5 rounded-lg border transition ${
                    isBookmarked
                      ? 'bg-amber-500 text-white border-amber-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-amber-500 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                  title={isBookmarked ? "Remove bookmark" : "Bookmark this code"}
                >
                  <Bookmark className="w-4 h-4 fill-current" />
                </button>

                <button
                  onClick={() =>
                    handleCopy(`${context.code} - ${context.desc || ''}`)
                  }
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 transition"
                  title="Copy code and description"
                >
                  {copiedCode ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Official Description */}
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
              {context.desc || 'No description provided.'}
            </div>

            {/* Jump to Tabular Page Button */}
            {context.block_id && (
              <button
                onClick={() => onJumpToTabular(context.block_id!, context.code)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Jump to Tabular Page ({context.block_id})</span>
              </button>
            )}
          </div>

          {/* 7th Character Extension Matrix */}
          {extensions.length > 0 && (
            <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-800/80 bg-purple-50/40 dark:bg-purple-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  7th Character Extension Matrix
                </span>
                <span className="text-[10px] text-purple-700 dark:text-purple-400 font-medium">
                  {extensions.length} extensions
                </span>
              </div>

              <div className="text-[11px] text-slate-600 dark:text-slate-300">
                Official encounter definitions for completing this diagnosis:
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {extensions.map(ext => {
                  const isSelected = selectedExtension === ext.char;
                  const fullCode = getCompositeCode(ext.char);

                  return (
                    <div
                      key={ext.char}
                      onClick={() => setSelectedExtension(ext.char)}
                      className={`p-2 rounded-lg border text-xs cursor-pointer transition ${
                        isSelected
                          ? 'border-purple-500 bg-white dark:bg-slate-800 shadow-xs'
                          : 'border-purple-100 dark:border-purple-900/60 bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-200">
                            {ext.char}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                            {ext.desc}
                          </span>
                        </div>
                        {isSelected && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(fullCode);
                            }}
                            className="p-1 rounded text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950"
                            title="Copy complete 7-char code"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      {isSelected && (
                        <div className="mt-1.5 pt-1 border-t border-purple-100 dark:border-purple-900/50 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Full Claim Code:</span>
                          <span className="font-mono font-bold text-purple-700 dark:text-purple-300">
                            {fullCode}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Parent Context */}
          {context.parentCode && (
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-1">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Parent Category
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                  {context.parentCode}
                </span>
                <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                  {context.parentDesc}
                </span>
              </div>
            </div>
          )}

          {/* Quick Notes Summary */}
          {context.notes && Object.values(context.notes).some(arr => arr && arr.length > 0) && (
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Instructional Notes
              </div>

              {context.notes.excludes1 && context.notes.excludes1.length > 0 && (
                <div className="text-xs space-y-1">
                  <span className="font-bold text-rose-600 dark:text-rose-400">Excludes1:</span>
                  <ul className="list-disc list-inside text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                    {context.notes.excludes1.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}

              {context.notes.excludes2 && context.notes.excludes2.length > 0 && (
                <div className="text-xs space-y-1">
                  <span className="font-bold text-amber-600 dark:text-amber-400">Excludes2:</span>
                  <ul className="list-disc list-inside text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                    {context.notes.excludes2.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}

              {context.notes.includes && context.notes.includes.length > 0 && (
                <div className="text-xs space-y-1">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Includes:</span>
                  <ul className="list-disc list-inside text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                    {context.notes.includes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}

              {context.notes.useAdditionalCode && context.notes.useAdditionalCode.length > 0 && (
                <div className="text-xs space-y-1">
                  <span className="font-bold text-blue-600 dark:text-blue-400">Use Additional Code:</span>
                  <ul className="list-disc list-inside text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                    {context.notes.useAdditionalCode.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
          <Info className="w-10 h-10 text-slate-300 mb-3 opacity-60" />
          <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            No Code Selected
          </div>
          <div className="text-xs text-slate-500 mt-1 max-w-[220px]">
            Click any ICD-10-CM code in the Tabular List, Index, or Tables to view official guidelines, extensions, and cross-references.
          </div>
        </div>
      )}
    </aside>
  );
};
