import React, { useState, useEffect, useRef } from 'react';
import {
  TabularBlock,
  DiagNode,
  ReaderSettings,
  BookmarkItem,
  PreviewContext
} from '../../types';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Layers,
  BookOpen
} from 'lucide-react';

interface TabularBlockViewProps {
  block: TabularBlock | null;
  loading: boolean;
  settings: ReaderSettings;
  activeCategoryCode?: string;
  targetHighlightCode?: string;
  onCodeClick: (diag: DiagNode, parent?: DiagNode) => void;
  onJumpToCodeRef: (codeStr: string) => void;
  bookmarks: BookmarkItem[];
  onToggleBookmark: (item: BookmarkItem) => void;
  onPrevBlock?: () => void;
  onNextBlock?: () => void;
  prevBlockId?: string;
  nextBlockId?: string;
}

export const TabularBlockView: React.FC<TabularBlockViewProps> = ({
  block,
  loading,
  settings,
  activeCategoryCode,
  targetHighlightCode,
  onCodeClick,
  onJumpToCodeRef,
  bookmarks,
  onToggleBookmark,
  onPrevBlock,
  onNextBlock,
  prevBlockId,
  nextBlockId
}) => {
  const [activeStickyCategory, setActiveStickyCategory] = useState<DiagNode | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const codeRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Scroll to activeCategoryCode or targetHighlightCode when block changes
  useEffect(() => {
    const target = targetHighlightCode || activeCategoryCode;
    if (target) {
      setTimeout(() => {
        const el = codeRefs.current.get(target) || categoryRefs.current.get(target);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('highlight-active');
          setTimeout(() => el.classList.remove('highlight-active'), 3200);
        }
      }, 100);
    } else {
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [block?.id, targetHighlightCode, activeCategoryCode]);

  // Track active 3-character category for Sticky Header while scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || !block) return;
      const scrollPos = containerRef.current.scrollTop + 60;
      let currentCat: DiagNode | null = null;

      for (const diag of block.diags) {
        const el = categoryRefs.current.get(diag.code);
        if (el && el.offsetTop <= scrollPos) {
          currentCat = diag;
        }
      }
      setActiveStickyCategory(currentCat || block.diags[0] || null);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [block]);

  const handleCopy = (code: string, desc: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${code} - ${desc}`);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const isCodeBookmarked = (code: string) => {
    return bookmarks.some(b => b.code === code);
  };

  // Helper to render text with clickable code links like (E08.-) or (Z79.4)
  const renderNoteWithLinks = (text: string) => {
    const regex = /\(([A-TV-Z][0-9][0-9A-Z]?(?:\.[0-9A-Z\-]*)?)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const rawCode = match[1];
      parts.push(
        <button
          key={`${match.index}-${rawCode}`}
          onClick={(e) => {
            e.stopPropagation();
            onJumpToCodeRef(rawCode);
          }}
          className="inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded text-[11px] font-mono font-bold bg-blue-100/80 hover:bg-blue-200 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 dark:hover:bg-blue-800 transition ring-1 ring-blue-400/30"
          title={`Click to preview code ${rawCode}`}
        >
          ({rawCode})
        </button>
      );
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // Render instructional notes block
  const renderInstructionalNotes = (node: DiagNode | TabularBlock['notes'], isCompact = false) => {
    if (!settings.showNotes) return null;

    const hasNotes =
      (node.excludes1 && node.excludes1.length > 0) ||
      (node.excludes2 && node.excludes2.length > 0) ||
      (node.includes && node.includes.length > 0) ||
      (node.inclusionTerm && node.inclusionTerm.length > 0) ||
      (node.codeFirst && node.codeFirst.length > 0) ||
      (node.useAdditionalCode && node.useAdditionalCode.length > 0) ||
      (node.codeAlso && node.codeAlso.length > 0) ||
      (node.notes && node.notes.length > 0) ||
      ('sevenChrNote' in node && node.sevenChrNote && node.sevenChrNote.length > 0);

    if (!hasNotes) return null;

    return (
      <div className={`my-2 space-y-1.5 ${isCompact ? 'text-[11px]' : 'text-xs'}`}>
        {/* Excludes 1 (Red / Rose) */}
        {node.excludes1 && node.excludes1.length > 0 && (
          <div className="p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30">
            <div className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5 mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>EXCLUDES 1</span>
              <span className="text-[10px] font-normal text-rose-600 dark:text-rose-400">
                (Pure excludes — condition cannot be coded here)
              </span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-700 dark:text-slate-300 pl-1">
              {node.excludes1.map((item, idx) => (
                <li key={idx} className="leading-snug">
                  {renderNoteWithLinks(item)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Excludes 2 (Amber / Orange) */}
        {node.excludes2 && node.excludes2.length > 0 && (
          <div className="p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30">
            <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>EXCLUDES 2</span>
              <span className="text-[10px] font-normal text-amber-700 dark:text-amber-400">
                (Not included here, but patient may have both simultaneously)
              </span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-700 dark:text-slate-300 pl-1">
              {node.excludes2.map((item, idx) => (
                <li key={idx} className="leading-snug">
                  {renderNoteWithLinks(item)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Includes / Inclusion Terms (Emerald / Teal) */}
        {((node.includes && node.includes.length > 0) || (node.inclusionTerm && node.inclusionTerm.length > 0)) && (
          <div className="p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30">
            <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>INCLUDES / CLINICAL CONDITIONS</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-700 dark:text-slate-300 pl-1">
              {node.includes?.map((item, idx) => (
                <li key={`inc-${idx}`} className="leading-snug">{renderNoteWithLinks(item)}</li>
              ))}
              {node.inclusionTerm?.map((item, idx) => (
                <li key={`term-${idx}`} className="leading-snug">{renderNoteWithLinks(item)}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Code First / Use Additional Code / Code Also (Blue / Indigo) */}
        {((node.codeFirst && node.codeFirst.length > 0) ||
          (node.useAdditionalCode && node.useAdditionalCode.length > 0) ||
          (node.codeAlso && node.codeAlso.length > 0)) && (
          <div className="p-2.5 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30">
            <div className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5 mb-1">
              <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>SEQUENCING & ADDITIONAL CODES</span>
            </div>
            {node.codeFirst && node.codeFirst.length > 0 && (
              <div className="mb-1">
                <span className="font-semibold text-blue-700 dark:text-blue-300">Code First: </span>
                <ul className="list-disc list-inside pl-1 text-slate-700 dark:text-slate-300">
                  {node.codeFirst.map((item, idx) => (
                    <li key={idx}>{renderNoteWithLinks(item)}</li>
                  ))}
                </ul>
              </div>
            )}
            {node.useAdditionalCode && node.useAdditionalCode.length > 0 && (
              <div className="mb-1">
                <span className="font-semibold text-blue-700 dark:text-blue-300">Use Additional Code: </span>
                <ul className="list-disc list-inside pl-1 text-slate-700 dark:text-slate-300">
                  {node.useAdditionalCode.map((item, idx) => (
                    <li key={idx}>{renderNoteWithLinks(item)}</li>
                  ))}
                </ul>
              </div>
            )}
            {node.codeAlso && node.codeAlso.length > 0 && (
              <div>
                <span className="font-semibold text-blue-700 dark:text-blue-300">Code Also: </span>
                <ul className="list-disc list-inside pl-1 text-slate-700 dark:text-slate-300">
                  {node.codeAlso.map((item, idx) => (
                    <li key={idx}>{renderNoteWithLinks(item)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 7th Character Extension Note */}
        {'sevenChrNote' in node && node.sevenChrNote && node.sevenChrNote.length > 0 && (
          <div className="p-2.5 rounded-lg border border-purple-200 dark:border-purple-900/60 bg-purple-50/70 dark:bg-purple-950/30">
            <div className="font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1.5 mb-1">
              <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>7TH CHARACTER REQUIREMENT</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-700 dark:text-slate-300 pl-1">
              {node.sevenChrNote.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Recursive Diagnosis Node Renderer
  const renderDiagnosisNode = (node: DiagNode, parent?: DiagNode): React.ReactNode => {
    const isCategory = node.level === 0;
    const isLeaf = node.is_leaf;
    const bookmarked = isCodeBookmarked(node.code);

    // Dynamic typography sizing based on settings
    const fontSizeClass =
      settings.fontSize === 'sm'
        ? isCategory ? 'text-sm' : 'text-xs'
        : settings.fontSize === 'lg'
        ? isCategory ? 'text-lg' : 'text-base'
        : isCategory ? 'text-base' : 'text-sm';

    const paddingClass =
      settings.density === 'compact'
        ? 'py-1 px-2'
        : 'py-2 px-3';

    return (
      <div
        key={node.code}
        ref={el => {
          if (el) {
            codeRefs.current.set(node.code, el);
            if (isCategory) categoryRefs.current.set(node.code, el);
          }
        }}
        id={`code-${node.code}`}
        className={`group relative transition rounded-lg ${
          isCategory
            ? 'mt-6 mb-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs'
            : 'my-0.5 hover:bg-slate-50 dark:hover:bg-slate-800/60'
        }`}
      >
        <div
          onClick={() => onCodeClick(node, parent)}
          className={`flex items-start gap-2.5 cursor-pointer ${paddingClass} ${
            node.level > 0 ? 'ml-3 sm:ml-5 code-indent-line' : ''
          }`}
        >
          {/* Code Badge */}
          <div className="shrink-0 flex items-center gap-1.5 pt-0.5">
            <span
              className={`font-mono font-bold tracking-tight px-2 py-0.5 rounded transition ${
                isCategory
                  ? 'text-sm sm:text-base bg-blue-600 text-white shadow-xs'
                  : 'text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-slate-200 dark:border-slate-700 group-hover:border-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60'
              }`}
            >
              {node.code}
            </span>

            {/* Bookmark star */}
            <button
              onClick={e => {
                e.stopPropagation();
                onToggleBookmark({
                  code: node.code,
                  desc: node.desc,
                  block_id: block?.id || '',
                  chapter: block?.chapter_num || '',
                  is_leaf: isLeaf,
                  requires_7th: !!node.requires_7th,
                  savedAt: Date.now()
                });
              }}
              className={`p-1 rounded transition ${
                bookmarked
                  ? 'text-amber-500 opacity-100'
                  : 'text-slate-300 dark:text-slate-600 hover:text-amber-500 opacity-0 group-hover:opacity-100'
              }`}
              title={bookmarked ? "Remove bookmark" : "Add to bookmarks"}
            >
              <Bookmark className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>

          {/* Description & Badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1">
              <span
                className={`font-medium ${fontSizeClass} ${
                  isCategory
                    ? 'font-bold text-slate-900 dark:text-white'
                    : 'text-slate-800 dark:text-slate-200'
                } leading-snug`}
              >
                {node.desc}
              </span>

              {/* Status Pills */}
              <div className="inline-flex items-center gap-1.5 select-none">
                {isLeaf ? (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Billable
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    Header
                  </span>
                )}

                {node.requires_7th ? (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 flex items-center gap-1">
                    <Layers className="w-2.5 h-2.5" /> 7th Chr
                  </span>
                ) : null}
              </div>
            </div>

            {/* Instructional Notes */}
            {renderInstructionalNotes(node, !isCategory)}
          </div>

          {/* Copy Button */}
          <div className="shrink-0 pt-0.5 opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={e => handleCopy(node.code, node.desc, e)}
              className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-200/60 dark:hover:bg-slate-700"
              title="Copy code and title"
            >
              {copiedCode === node.code ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Children Recursion */}
        {node.children && node.children.length > 0 && (
          <div className="mt-0.5">
            {node.children.map(child => renderDiagnosisNode(child, node))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs font-medium">Loading ICD-10-CM Section...</div>
        </div>
      </div>
    );
  }

  if (!block) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
        <div className="text-center space-y-2">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <div className="text-sm font-semibold">Select a Section to Begin Reading</div>
          <div className="text-xs text-slate-500">
            Choose a chapter and section from the navigation tree on the left.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* Sticky Active Category Header */}
      {activeStickyCategory && (
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-6 py-2.5 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-mono font-black text-sm px-2 py-0.5 rounded bg-blue-600 text-white shadow-2xs">
              {activeStickyCategory.code}
            </span>
            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
              {activeStickyCategory.desc}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeStickyCategory.requires_7th && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
                7th Chr
              </span>
            )}
            <button
              onClick={() => onCodeClick(activeStickyCategory)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              View Guidelines
            </button>
          </div>
        </div>
      )}

      {/* Main Continuous Reading Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-6 space-y-6"
      >
        {/* Section Header Banner */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <span>Chapter {block.chapter_num}</span>
            <span>•</span>
            <span className="truncate">{block.chapter_desc}</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
            {block.desc}
          </h1>

          <div className="flex items-center gap-2 mt-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Section {block.id}
            </span>
            <span className="text-xs text-slate-500">
              {block.diags.length} Primary Categories
            </span>
          </div>

          {/* Section-level instructional notes */}
          {renderInstructionalNotes(block.notes, false)}
        </div>

        {/* Diagnosis Hierarchy */}
        <div className="space-y-4">
          {block.diags.map(diag => renderDiagnosisNode(diag))}
        </div>

        {/* Previous / Next Section Navigation Buttons */}
        <div className="pt-8 pb-12 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          {prevBlockId && onPrevBlock ? (
            <button
              onClick={onPrevBlock}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Section ({prevBlockId})</span>
            </button>
          ) : <div />}

          {nextBlockId && onNextBlock ? (
            <button
              onClick={onNextBlock}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-xs"
            >
              <span>Next Section ({nextBlockId})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : <div />}
        </div>
      </div>
    </div>
  );
};
