import React, { useState } from 'react';
import {
  TocData,
  BookTab,
  BookmarkItem
} from '../types';
import {
  Book,
  Bookmark,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Folder,
  Trash2,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface LeftSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: BookTab;
  onTabChange: (tab: BookTab) => void;
  toc: TocData | null;
  activeBlockId: string;
  onSelectBlock: (blockId: string, categoryCode?: string) => void;
  activeIndexLetter: string;
  onSelectIndexLetter: (letter: string) => void;
  activeEIndexLetter: string;
  onSelectEIndexLetter: (letter: string) => void;
  activeDrugLetter: string;
  onSelectDrugLetter: (letter: string) => void;
  bookmarks: BookmarkItem[];
  onRemoveBookmark: (code: string) => void;
  onSelectBookmark: (bookmark: BookmarkItem) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  isOpen,
  activeTab,
  toc,
  activeBlockId,
  onSelectBlock,
  activeIndexLetter,
  onSelectIndexLetter,
  activeEIndexLetter,
  onSelectEIndexLetter,
  activeDrugLetter,
  onSelectDrugLetter,
  bookmarks,
  onRemoveBookmark,
  onSelectBookmark
}) => {
  const [sidebarTab, setSidebarTab] = useState<'toc' | 'bookmarks'>('toc');
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({ '1': true, '4': true });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [filterQuery, setFilterQuery] = useState('');

  if (!isOpen) return null;

  const toggleChapter = (num: string) => {
    setExpandedChapters(prev => ({ ...prev, [num]: !prev[num] }));
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredChapters = toc?.chapters.filter(ch => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      ch.desc.toLowerCase().includes(q) ||
      ch.code_range.toLowerCase().includes(q) ||
      ch.sections.some(s => s.desc.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.categories.some(c => c.code.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)))
    );
  }) || [];

  return (
    <aside className="w-80 sm:w-88 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 select-none h-full overflow-hidden">
      {/* Sidebar Sub-Tabs: TOC vs Bookmarks */}
      <div className="p-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 bg-slate-50 dark:bg-slate-950/50">
        <button
          onClick={() => setSidebarTab('toc')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition ${
            sidebarTab === 'toc'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Book className="w-3.5 h-3.5" />
          <span>Navigation</span>
        </button>

        <button
          onClick={() => setSidebarTab('bookmarks')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition ${
            sidebarTab === 'bookmarks'
              ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-2xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Bookmarks ({bookmarks.length})</span>
        </button>
      </div>

      {sidebarTab === 'toc' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Quick Filter Box */}
          {activeTab === 'tabular' && (
            <div className="p-2.5 border-b border-slate-100 dark:border-slate-800/80">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={e => setFilterQuery(e.target.value)}
                  placeholder="Filter chapters & sections..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Navigation Content Area */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {activeTab === 'tabular' ? (
              filteredChapters.map(ch => {
                const isChExpanded = expandedChapters[ch.num] ?? false;
                const hasActiveSection = ch.sections.some(s => s.id === activeBlockId);

                return (
                  <div key={ch.num} className="border border-slate-200/80 dark:border-slate-800/80 rounded-lg overflow-hidden bg-white dark:bg-slate-900/60 shadow-2xs mb-1.5">
                    {/* Chapter Accordion Header */}
                    <button
                      onClick={() => toggleChapter(ch.num)}
                      className={`w-full text-left p-2.5 flex items-start gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${
                        hasActiveSection ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <div className="mt-0.5 text-slate-400">
                        {isChExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-blue-700 dark:text-blue-400">
                            Ch. {ch.num}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {ch.code_range}
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mt-0.5 line-clamp-2 leading-snug">
                          {ch.desc}
                        </div>
                      </div>
                    </button>

                    {/* Chapter Sections List */}
                    {isChExpanded && (
                      <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30 p-1.5 space-y-1">
                        {ch.sections.map(sec => {
                          const isSecActive = sec.id === activeBlockId;
                          const isSecExpanded = expandedSections[sec.id] ?? false;

                          return (
                            <div key={sec.id} className="rounded-md overflow-hidden">
                              <div
                                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition ${
                                  isSecActive
                                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                                }`}
                              >
                                <button
                                  onClick={() => toggleSection(sec.id)}
                                  className="p-0.5 rounded hover:bg-black/10 text-current"
                                  title="Toggle 3-character categories"
                                >
                                  {isSecExpanded ? (
                                    <ChevronDown className="w-3 h-3" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3" />
                                  )}
                                </button>
                                <button
                                  onClick={() => onSelectBlock(sec.id)}
                                  className="flex-1 text-left flex items-center justify-between gap-1 overflow-hidden"
                                >
                                  <span className="font-mono text-[11px] font-bold shrink-0">
                                    {sec.id}
                                  </span>
                                  <span className={`text-[10px] truncate ${isSecActive ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {sec.desc.replace(`(${sec.id})`, '').trim()}
                                  </span>
                                </button>
                              </div>

                              {/* 3-Character Categories Accordion Sub-level */}
                              {isSecExpanded && (
                                <div className="ml-5 pl-2 border-l border-slate-200 dark:border-slate-700 my-1 space-y-0.5">
                                  {sec.categories.map(cat => (
                                    <button
                                      key={cat.code}
                                      onClick={() => onSelectBlock(sec.id, cat.code)}
                                      className="w-full text-left px-2 py-1 rounded text-[11px] hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 flex items-center gap-2 transition"
                                    >
                                      <span className="font-mono font-bold text-[10px] text-blue-600 dark:text-blue-400">
                                        {cat.code}
                                      </span>
                                      <span className="truncate text-[10px] text-slate-600 dark:text-slate-300">
                                        {cat.desc}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            ) : activeTab === 'index' ? (
              <div className="p-2 space-y-3">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
                  Alphabetic Index Letters (A–Z)
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {toc?.index.letters.map(letter => {
                    const count = toc.index.counts[letter] || 0;
                    const isActive = activeIndexLetter === letter;
                    return (
                      <button
                        key={letter}
                        onClick={() => onSelectIndexLetter(letter)}
                        className={`p-2 rounded-lg text-center border transition flex flex-col items-center justify-center ${
                          isActive
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-bold'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 hover:border-blue-400'
                        }`}
                      >
                        <span className="text-sm font-bold">{letter}</span>
                        <span className={`text-[9px] ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : activeTab === 'eindex' ? (
              <div className="p-2 space-y-3">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
                  External Cause Index Letters
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {toc?.eindex.letters.map(letter => {
                    const count = toc.eindex.counts[letter] || 0;
                    const isActive = activeEIndexLetter === letter;
                    return (
                      <button
                        key={letter}
                        onClick={() => onSelectEIndexLetter(letter)}
                        className={`p-2 rounded-lg text-center border transition flex flex-col items-center justify-center ${
                          isActive
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-bold'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 hover:border-blue-400'
                        }`}
                      >
                        <span className="text-sm font-bold">{letter}</span>
                        <span className={`text-[9px] ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : activeTab === 'neoplasm' ? (
              <div className="p-3 space-y-3">
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60">
                  <div className="text-xs font-bold text-purple-900 dark:text-purple-300">
                    Neoplasm Table Overview
                  </div>
                  <div className="text-[11px] text-purple-700 dark:text-purple-400 mt-1">
                    Structured 7-column clinical reference for 1,940 anatomical sites and tumor histology classifications.
                  </div>
                </div>
              </div>
            ) : activeTab === 'drugs' ? (
              <div className="p-2 space-y-3">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
                  Substance Index Letters
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {toc?.tables.drugs.letters.map(letter => {
                    const isActive = activeDrugLetter === letter;
                    return (
                      <button
                        key={letter}
                        onClick={() => onSelectDrugLetter(letter)}
                        className={`p-2 rounded-lg text-center border transition font-bold text-xs ${
                          isActive
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-blue-400'
                        }`}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        /* Bookmarks Tab Content */
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {bookmarks.length > 0 ? (
            bookmarks.map(bm => (
              <div
                key={bm.code}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 shadow-2xs group hover:border-blue-300 dark:hover:border-blue-700 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    onClick={() => onSelectBookmark(bm)}
                    className="text-left flex-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                        {bm.code}
                      </span>
                      {bm.is_leaf ? (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-semibold">
                          Billable
                        </span>
                      ) : (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 font-medium">
                          Header
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1 line-clamp-2">
                      {bm.desc}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Section {bm.block_id}
                    </div>
                  </button>
                  <button
                    onClick={() => onRemoveBookmark(bm.code)}
                    className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    title="Remove bookmark"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              <Bookmark className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-50" />
              <div>No bookmarks saved yet.</div>
              <div className="text-[11px] text-slate-500 mt-1">
                Click the star icon next to any ICD-10-CM code to save it here for quick demo access.
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
