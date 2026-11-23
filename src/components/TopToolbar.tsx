import React, { useState, useEffect, useRef } from 'react';
import {
  BookTab,
  ReaderSettings,
  SearchItem,
  FontSize,
  Density
} from '../types';
import {
  Search,
  BookOpen,
  ListFilter,
  Activity,
  Pill,
  ShieldAlert,
  Sun,
  Moon,
  Type,
  FileText,
  SlidersHorizontal,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { dataService } from '../services/dataService';

interface TopToolbarProps {
  activeTab: BookTab;
  onTabChange: (tab: BookTab) => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
  onSelectSearchCode: (code: string, blockId: string) => void;
  leftSidebarOpen: boolean;
  onToggleLeftSidebar: () => void;
  rightSidebarOpen: boolean;
  onToggleRightSidebar: () => void;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  activeTab,
  onTabChange,
  settings,
  onUpdateSettings,
  onSelectSearchCode,
  leftSidebarOpen,
  onToggleLeftSidebar,
  rightSidebarOpen,
  onToggleRightSidebar
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [searchIndex, setSearchIndex] = useState<SearchItem[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Preload search index in background
  useEffect(() => {
    dataService.getSearchIndex().then(items => {
      setSearchIndex(items);
    }).catch(err => {
      console.error('Failed to preload search index:', err);
    });
  }, []);

  // Global keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !searchInputRef.current?.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Search Input Change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    setIsSearching(true);
    setIsSearchOpen(true);

    // Instant search with dataService
    const results = dataService.search(val, searchIndex, 40);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSelectCode = (item: SearchItem) => {
    onSelectSearchCode(item.code, item.block_id);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const bookTabs: { id: BookTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'tabular', label: 'Tabular List', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'index', label: 'Alphabetic Index', icon: <ListFilter className="w-4 h-4" /> },
    { id: 'neoplasm', label: 'Neoplasm Table', icon: <Activity className="w-4 h-4" /> },
    { id: 'drugs', label: 'Drug & Chemical', icon: <Pill className="w-4 h-4" /> },
    { id: 'eindex', label: 'External Causes', icon: <ShieldAlert className="w-4 h-4" /> }
  ];

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 flex items-center justify-between gap-3 select-none z-30 shrink-0">
      {/* Brand & Left Sidebar Toggle */}
      <div className="flex items-center gap-2.5 min-w-[210px]">
        <button
          onClick={onToggleLeftSidebar}
          title={leftSidebarOpen ? "Collapse navigation (Ctrl+B)" : "Expand navigation"}
          className={`p-2 rounded-lg border text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
            leftSidebarOpen ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800' : 'border-transparent'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-1 ring-blue-500/20">
            ICD
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-sm tracking-tight">
              ICD-10-CM
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 ring-1 ring-emerald-500/30">
                2027
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Digital Codebook Reader
            </div>
          </div>
        </div>
      </div>

      {/* Center: Book Tabs Navigation */}
      <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
        {bookTabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Section: Instant Search & Reader Controls */}
      <div className="flex items-center gap-2.5">
        {/* Instant Search Bar */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => {
                if (searchQuery.trim()) setIsSearchOpen(true);
              }}
              placeholder="Search code (e.g. E11.9) or keyword..."
              className="w-56 sm:w-72 md:w-80 pl-9 pr-14 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition"
            />
            {searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setIsSearchOpen(false);
                }}
                className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded shadow-2xs pointer-events-none">
                /
              </kbd>
            )}
          </div>

          {/* Search Dropdown Results */}
          {isSearchOpen && (
            <div
              ref={dropdownRef}
              className="absolute right-0 top-full mt-1.5 w-96 max-w-[90vw] max-h-[440px] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 divide-y divide-slate-100 dark:divide-slate-800"
            >
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  {searchResults.length > 0
                    ? `Results (${searchResults.length} matches)`
                    : 'Search in 47,025 ICD-10-CM Codes'}
                </span>
                <span className="text-[10px] text-slate-400">Press Esc to close</span>
              </div>

              {isSearching ? (
                <div className="p-6 text-center text-xs text-slate-500">Searching...</div>
              ) : searchResults.length > 0 ? (
                <div className="p-1 space-y-0.5">
                  {searchResults.map((item, idx) => (
                    <button
                      key={`${item.code}-${idx}`}
                      onClick={() => handleSelectCode(item)}
                      className="w-full text-left p-2 rounded-lg hover:bg-blue-50/80 dark:hover:bg-blue-950/40 flex items-start gap-2.5 group transition"
                    >
                      <div className="shrink-0 mt-0.5">
                        <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-slate-200 dark:border-slate-700">
                          {item.code}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-900 dark:group-hover:text-blue-200 line-clamp-2 leading-tight">
                          {item.desc}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          <span>Ch. {item.chapter}</span>
                          <span>•</span>
                          <span>Sec. {item.block_id}</span>
                          <span>•</span>
                          {item.is_leaf ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Billable
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              Header Code
                            </span>
                          )}
                          {item.requires_7th ? (
                            <span className="px-1 py-0.2 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 font-medium">
                              7th Chr
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery.trim() ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  No matching ICD-10-CM codes found for "{searchQuery}".
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  Type a code (e.g. <span className="font-mono text-blue-600">E11.9</span>, <span className="font-mono text-blue-600">S02</span>) or diagnosis title (e.g. <span className="text-blue-600">diabetes</span>).
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reader Controls Group */}
        <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
          {/* Font Size S / M / L */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            {(['sm', 'md', 'lg'] as FontSize[]).map(size => (
              <button
                key={size}
                onClick={() => onUpdateSettings({ fontSize: size })}
                className={`px-2 py-1 rounded transition text-xs ${
                  settings.fontSize === size
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={`Font Size: ${size.toUpperCase()}`}
              >
                {size.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Density Toggle (Compact vs Comfortable) */}
          <button
            onClick={() =>
              onUpdateSettings({
                density: settings.density === 'compact' ? 'comfortable' : 'compact'
              })
            }
            className={`p-2 rounded-lg border text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
              settings.density === 'compact'
                ? 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'
                : 'border-transparent'
            }`}
            title={`Density: ${settings.density === 'compact' ? 'Compact' : 'Comfortable'}`}
          >
            <Type className="w-4 h-4" />
          </button>

          {/* Instructional Notes Toggle */}
          <button
            onClick={() => onUpdateSettings({ showNotes: !settings.showNotes })}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-medium transition ${
              settings.showNotes
                ? 'border-blue-300 dark:border-blue-700 bg-blue-50/80 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Toggle Instructional Notes visibility"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Notes</span>
          </button>

          {/* Dark / Light Mode */}
          <button
            onClick={() => onUpdateSettings({ darkMode: !settings.darkMode })}
            className="p-2 rounded-lg border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title={settings.darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {settings.darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Right Sidebar (Guidelines / Preview) Toggle */}
          <button
            onClick={onToggleRightSidebar}
            title={rightSidebarOpen ? "Collapse drawer" : "Open context & guidelines drawer"}
            className={`p-2 rounded-lg border text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
              rightSidebarOpen ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800' : 'border-transparent'
            }`}
          >
            <BookOpen className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
