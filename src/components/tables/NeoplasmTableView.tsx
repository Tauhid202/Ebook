import React, { useState, useMemo } from 'react';
import { NeoplasmTableData, TableRow, ReaderSettings } from '../../types';
import { Search, Activity, ExternalLink } from 'lucide-react';

interface NeoplasmTableViewProps {
  data: NeoplasmTableData | null;
  loading: boolean;
  settings: ReaderSettings;
  onSelectCode: (code: string) => void;
}

export const NeoplasmTableView: React.FC<NeoplasmTableViewProps> = ({
  data,
  loading,
  settings,
  onSelectCode
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 100;

  const filteredRows = useMemo(() => {
    if (!data) return [];
    if (!filterQuery.trim()) return data.rows;
    const q = filterQuery.toLowerCase();
    return data.rows.filter(r => {
      if (r.title.toLowerCase().includes(q)) return true;
      if (r.nemod && r.nemod.toLowerCase().includes(q)) return true;
      if (r.cells && r.cells.some(c => c.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [data, filterQuery]);

  const pagedRows = useMemo(() => {
    return filteredRows.slice(0, page * pageSize);
  }, [filteredRows, page]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs font-medium">Loading Neoplasm Table...</div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900">
      {/* Top Controls Banner */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Table of Neoplasms (ICD-10-CM 2027)
            </h1>
            <div className="text-xs text-slate-500">
              Showing {filteredRows.length} anatomical sites & histological classifications
            </div>
          </div>
        </div>

        {/* Search site input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={filterQuery}
            onChange={e => {
              setFilterQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search anatomical site (e.g. lung, breast)..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Table Content Scroll Area */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-xs text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">
            <tr>
              <th className="py-2.5 px-3 min-w-[220px]">Neoplasm (Site / Histology)</th>
              <th className="py-2.5 px-2 text-center text-rose-700 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 min-w-[90px]">
                Malignant Primary
              </th>
              <th className="py-2.5 px-2 text-center text-rose-600 dark:text-rose-300 min-w-[90px]">
                Malignant Secondary
              </th>
              <th className="py-2.5 px-2 text-center text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/20 min-w-[90px]">
                Ca in situ
              </th>
              <th className="py-2.5 px-2 text-center text-emerald-700 dark:text-emerald-400 min-w-[90px]">
                Benign
              </th>
              <th className="py-2.5 px-2 text-center text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 min-w-[90px]">
                Uncertain Behavior
              </th>
              <th className="py-2.5 px-2 text-center text-slate-600 dark:text-slate-400 min-w-[90px]">
                Unspecified
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {pagedRows.map((row, idx) => {
              const isIndented = row.level > 0;

              return (
                <tr
                  key={`${row.title}-${idx}`}
                  className="hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition group"
                >
                  {/* Site Title */}
                  <td className="py-2 px-3">
                    <div
                      className="flex items-baseline gap-1.5"
                      style={{ paddingLeft: `${row.level * 16}px` }}
                    >
                      <span
                        className={`font-medium ${
                          row.level === 0
                            ? 'font-bold text-slate-900 dark:text-white'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {row.title}
                      </span>
                      {row.nemod && (
                        <span className="text-[10px] text-slate-400 italic font-serif">
                          {row.nemod}
                        </span>
                      )}
                      {row.see && (
                        <span className="text-[10px] text-slate-400 italic">
                          see {row.see}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 6 Behavior Code Columns */}
                  {row.cells && row.cells.length === 6 ? (
                    row.cells.map((codeCell, cellIdx) => {
                      const cleanCode = codeCell.trim();
                      const isValidCode = cleanCode && cleanCode !== '--' && cleanCode !== '-';

                      return (
                        <td
                          key={cellIdx}
                          className={`py-2 px-2 text-center font-mono ${
                            cellIdx === 0
                              ? 'bg-rose-50/30 dark:bg-rose-950/10'
                              : cellIdx === 2
                              ? 'bg-indigo-50/30 dark:bg-indigo-950/10'
                              : cellIdx === 4
                              ? 'bg-amber-50/30 dark:bg-amber-950/10'
                              : ''
                          }`}
                        >
                          {isValidCode ? (
                            <button
                              onClick={() => onSelectCode(cleanCode)}
                              className="px-1.5 py-0.5 rounded text-[11px] font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white transition"
                              title={`Preview ${cleanCode}`}
                            >
                              {cleanCode}
                            </button>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 text-[10px]">
                              —
                            </span>
                          )}
                        </td>
                      );
                    })
                  ) : (
                    <td colSpan={6} className="py-2 px-2 text-center text-slate-400 text-[10px]">
                      —
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Load more if filteredRows > pagedRows */}
        {filteredRows.length > pagedRows.length && (
          <div className="p-4 text-center">
            <button
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            >
              Load more rows ({filteredRows.length - pagedRows.length} remaining)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
