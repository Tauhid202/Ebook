import React, { useState } from 'react';
import { IndexLetterData, IndexTerm, ReaderSettings } from '../../types';
import { Search, ExternalLink, ArrowRight, CornerDownRight, BookOpen } from 'lucide-react';

interface IndexLetterViewProps {
  data: IndexLetterData | null;
  loading: boolean;
  settings: ReaderSettings;
  title: string;
  onSelectCode: (code: string) => void;
  onJumpToTerm?: (termTitle: string) => void;
}

export const IndexLetterView: React.FC<IndexLetterViewProps> = ({
  data,
  loading,
  settings,
  title,
  onSelectCode
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs font-medium">Loading Index Letter...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
        <div className="text-center space-y-2">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <div className="text-sm font-semibold">Select a Letter to View Terms</div>
        </div>
      </div>
    );
  }

  // Recursive term search filter
  const filterTerm = (term: IndexTerm, q: string): boolean => {
    if (term.title.toLowerCase().includes(q)) return true;
    if (term.nemod && term.nemod.toLowerCase().includes(q)) return true;
    if (term.code && term.code.toLowerCase().includes(q)) return true;
    if (term.see && term.see.toLowerCase().includes(q)) return true;
    if (term.seeAlso && term.seeAlso.toLowerCase().includes(q)) return true;
    if (term.terms && term.terms.some(t => filterTerm(t, q))) return true;
    return false;
  };

  const filteredTerms = data.terms.filter(term => {
    if (!filterQuery.trim()) return true;
    return filterTerm(term, filterQuery.toLowerCase());
  });

  const renderTerm = (term: IndexTerm): React.ReactNode => {
    const isMain = term.level === 0;

    return (
      <div
        key={`${term.title}-${term.code}-${term.level}`}
        className={`my-1 ${term.level > 0 ? 'ml-4 sm:ml-6 border-l border-slate-200/80 dark:border-slate-800 pl-3' : 'pt-2'}`}
      >
        <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1">
          {/* Term Title & Non-essential modifiers */}
          <span
            className={`${
              isMain
                ? 'font-bold text-slate-900 dark:text-white text-sm'
                : 'text-xs text-slate-700 dark:text-slate-300'
            }`}
          >
            {term.title}
          </span>

          {term.nemod && (
            <span className="text-[11px] italic text-slate-400 dark:text-slate-500 font-serif">
              {term.nemod}
            </span>
          )}

          {/* Diagnosis Code Badge */}
          {term.code && (
            <button
              onClick={() => onSelectCode(term.code!)}
              className="inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition"
              title="Click to preview code in Tabular List"
            >
              <span>{term.code}</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          )}

          {/* Manifestation Code [G63] */}
          {term.manif && (
            <span className="font-mono text-xs px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {term.manif}
            </span>
          )}

          {/* Cross References: see / see also */}
          {term.see && (
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <span className="italic font-serif">see</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {term.see}
              </span>
            </span>
          )}

          {term.seeAlso && (
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <span className="italic font-serif">see also</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {term.seeAlso}
              </span>
            </span>
          )}

          {term.seecat && (
            <span className="text-[11px] text-slate-500">
              <span className="italic">see category</span> {term.seecat}
            </span>
          )}
        </div>

        {/* Nested Subterms */}
        {term.terms && term.terms.length > 0 && (
          <div className="space-y-0.5">
            {term.terms.map(subterm => renderTerm(subterm))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900">
      {/* Top Banner with Quick Filter */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{title}</span>
            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-black shadow-xs">
              {data.letter}
            </span>
          </h1>
          <div className="text-xs text-slate-500 mt-0.5">
            Showing {filteredTerms.length} of {data.terms.length} Main Terms under letter {data.letter}
          </div>
        </div>

        {/* Filter input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            placeholder={`Filter in letter ${data.letter}...`}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Main Terms Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-3">
        {filteredTerms.length > 0 ? (
          filteredTerms.map(term => renderTerm(term))
        ) : (
          <div className="p-12 text-center text-xs text-slate-400">
            No terms match "{filterQuery}" under letter {data.letter}.
          </div>
        )}
      </div>
    </div>
  );
};
