import React, { useState, useEffect, useCallback } from 'react';
import {
  BookTab,
  TocData,
  TabularBlock,
  IndexLetterData,
  NeoplasmTableData,
  DrugTableData,
  ReaderSettings,
  BookmarkItem,
  PreviewContext,
  DiagNode
} from './types';
import { dataService } from './services/dataService';
import { TopToolbar } from './components/TopToolbar';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { TabularBlockView } from './components/tabular/TabularBlockView';
import { IndexLetterView } from './components/index/IndexLetterView';
import { NeoplasmTableView } from './components/tables/NeoplasmTableView';
import { DrugTableView } from './components/tables/DrugTableView';

export const App: React.FC = () => {
  // Navigation & Book Tabs
  const [activeTab, setActiveTab] = useState<BookTab>('tabular');
  const [toc, setToc] = useState<TocData | null>(null);

  // Tabular State
  const [activeBlockId, setActiveBlockId] = useState<string>('E08-E13');
  const [activeBlock, setActiveBlock] = useState<TabularBlock | null>(null);
  const [activeCategoryCode, setActiveCategoryCode] = useState<string | undefined>('E11');
  const [targetHighlightCode, setTargetHighlightCode] = useState<string | undefined>();
  const [loadingBlock, setLoadingBlock] = useState(false);

  // Index States
  const [activeIndexLetter, setActiveIndexLetter] = useState<string>('A');
  const [indexData, setIndexData] = useState<IndexLetterData | null>(null);
  const [loadingIndex, setLoadingIndex] = useState(false);

  // External Cause Index States
  const [activeEIndexLetter, setActiveEIndexLetter] = useState<string>('A');
  const [eindexData, setEIndexData] = useState<IndexLetterData | null>(null);
  const [loadingEIndex, setLoadingEIndex] = useState(false);

  // Table States
  const [neoplasmData, setNeoplasmData] = useState<NeoplasmTableData | null>(null);
  const [loadingNeoplasm, setLoadingNeoplasm] = useState(false);
  const [drugsData, setDrugsData] = useState<DrugTableData | null>(null);
  const [activeDrugLetter, setActiveDrugLetter] = useState<string>('');
  const [loadingDrugs, setLoadingDrugs] = useState(false);

  // Reader Settings (Persisted in localStorage)
  const [settings, setSettings] = useState<ReaderSettings>(() => {
    const saved = localStorage.getItem('icd10_reader_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback to default
      }
    }
    return {
      fontSize: 'md',
      density: 'comfortable',
      darkMode: false,
      showNotes: true
    };
  });

  // Bookmarks (Persisted in localStorage)
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    const saved = localStorage.getItem('icd10_bookmarks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return [
      {
        code: 'E11.9',
        desc: 'Type 2 diabetes mellitus without complications',
        block_id: 'E08-E13',
        chapter: '4',
        is_leaf: true,
        requires_7th: false,
        savedAt: Date.now()
      },
      {
        code: 'S02.0',
        desc: 'Fracture of vault of skull',
        block_id: 'S00-S09',
        chapter: '19',
        is_leaf: false,
        requires_7th: true,
        savedAt: Date.now()
      }
    ];
  });

  // Right Drawer / Preview Context
  const [previewContext, setPreviewContext] = useState<PreviewContext | null>(null);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  // Sync Dark Mode to HTML document element
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('icd10_reader_settings', JSON.stringify(settings));
  }, [settings]);

  // Sync Bookmarks to localStorage
  useEffect(() => {
    localStorage.setItem('icd10_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Load TOC on start
  useEffect(() => {
    dataService.getToc().then(data => {
      setToc(data);
    }).catch(err => {
      console.error('Failed to load TOC:', err);
    });
  }, []);

  // Fetch Active Tabular Block on demand
  useEffect(() => {
    if (activeTab === 'tabular' && activeBlockId) {
      setLoadingBlock(true);
      dataService.getBlock(activeBlockId)
        .then(block => {
          setActiveBlock(block);
          setLoadingBlock(false);
        })
        .catch(err => {
          console.error(`Failed to load block ${activeBlockId}:`, err);
          setLoadingBlock(false);
        });
    }
  }, [activeBlockId, activeTab]);

  // Fetch Alphabetic Index letter on demand
  useEffect(() => {
    if (activeTab === 'index' && activeIndexLetter) {
      setLoadingIndex(true);
      dataService.getIndexLetter(activeIndexLetter)
        .then(data => {
          setIndexData(data);
          setLoadingIndex(false);
        })
        .catch(err => {
          console.error(`Failed to load index letter ${activeIndexLetter}:`, err);
          setLoadingIndex(false);
        });
    }
  }, [activeIndexLetter, activeTab]);

  // Fetch External Cause Index letter on demand
  useEffect(() => {
    if (activeTab === 'eindex' && activeEIndexLetter) {
      setLoadingEIndex(true);
      dataService.getEIndexLetter(activeEIndexLetter)
        .then(data => {
          setEIndexData(data);
          setLoadingEIndex(false);
        })
        .catch(err => {
          console.error(`Failed to load eindex letter ${activeEIndexLetter}:`, err);
          setLoadingEIndex(false);
        });
    }
  }, [activeEIndexLetter, activeTab]);

  // Fetch Neoplasm Table on demand
  useEffect(() => {
    if (activeTab === 'neoplasm' && !neoplasmData) {
      setLoadingNeoplasm(true);
      dataService.getNeoplasmTable()
        .then(data => {
          setNeoplasmData(data);
          setLoadingNeoplasm(false);
        })
        .catch(err => {
          console.error('Failed to load neoplasm table:', err);
          setLoadingNeoplasm(false);
        });
    }
  }, [activeTab, neoplasmData]);

  // Fetch Drug Table on demand
  useEffect(() => {
    if (activeTab === 'drugs' && !drugsData) {
      setLoadingDrugs(true);
      dataService.getDrugsTable()
        .then(data => {
          setDrugsData(data);
          setLoadingDrugs(false);
        })
        .catch(err => {
          console.error('Failed to load drugs table:', err);
          setLoadingDrugs(false);
        });
    }
  }, [activeTab, drugsData]);

  // Handle block selection from Navigation
  const handleSelectBlock = (blockId: string, categoryCode?: string) => {
    setActiveBlockId(blockId);
    setActiveCategoryCode(categoryCode);
    setTargetHighlightCode(categoryCode);
    setActiveTab('tabular');
  };

  // Handle code click inside Tabular block
  const handleCodeClick = (diag: DiagNode, parent?: DiagNode) => {
    setPreviewContext({
      code: diag.code,
      desc: diag.desc,
      block_id: activeBlockId,
      chapter_num: activeBlock?.chapter_num,
      requires_7th: !!diag.requires_7th,
      sevenChrDef: diag.sevenChrDef,
      parentCode: parent?.code,
      parentDesc: parent?.desc,
      notes: {
        includes: diag.includes,
        excludes1: diag.excludes1,
        excludes2: diag.excludes2,
        codeFirst: diag.codeFirst,
        useAdditionalCode: diag.useAdditionalCode,
        codeAlso: diag.codeAlso
      }
    });
    setRightSidebarOpen(true);
  };

  // Handle Code selection from Index or Tables
  const handleSelectCodeFromIndexOrTable = async (codeToLookup: string) => {
    const preview = await dataService.getCodePreview(codeToLookup);
    if (preview) {
      setPreviewContext(preview);
      setRightSidebarOpen(true);
    }
  };

  // Jump directly to Tabular view and target code
  const handleJumpToTabular = (blockId: string, code: string) => {
    setActiveBlockId(blockId);
    setTargetHighlightCode(code);
    setActiveTab('tabular');
  };

  // Handle Instant Search Code Selection
  const handleSelectSearchCode = async (code: string, blockId: string) => {
    setActiveBlockId(blockId);
    setTargetHighlightCode(code);
    setActiveTab('tabular');
    const preview = await dataService.getCodePreview(code);
    if (preview) {
      setPreviewContext(preview);
      setRightSidebarOpen(true);
    }
  };

  // Toggle Bookmark
  const handleToggleBookmark = (item: BookmarkItem) => {
    setBookmarks(prev => {
      const exists = prev.some(b => b.code === item.code);
      if (exists) {
        return prev.filter(b => b.code !== item.code);
      } else {
        return [item, ...prev];
      }
    });
  };

  const handleRemoveBookmark = (code: string) => {
    setBookmarks(prev => prev.filter(b => b.code !== code));
  };

  const handleSelectBookmark = (bm: BookmarkItem) => {
    handleSelectSearchCode(bm.code, bm.block_id);
  };

  // Calculate Previous and Next Block IDs
  const allBlocks = toc?.blocks || [];
  const currentBlockIndex = allBlocks.findIndex(b => b.id === activeBlockId);
  const prevBlockId = currentBlockIndex > 0 ? allBlocks[currentBlockIndex - 1].id : undefined;
  const nextBlockId = currentBlockIndex >= 0 && currentBlockIndex < allBlocks.length - 1 ? allBlocks[currentBlockIndex + 1].id : undefined;

  const handlePrevBlock = () => {
    if (prevBlockId) {
      setActiveBlockId(prevBlockId);
      setActiveCategoryCode(undefined);
      setTargetHighlightCode(undefined);
    }
  };

  const handleNextBlock = () => {
    if (nextBlockId) {
      setActiveBlockId(nextBlockId);
      setActiveCategoryCode(undefined);
      setTargetHighlightCode(undefined);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* 1. Top Reader Toolbar */}
      <TopToolbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        settings={settings}
        onUpdateSettings={newS => setSettings(prev => ({ ...prev, ...newS }))}
        onSelectSearchCode={handleSelectSearchCode}
        leftSidebarOpen={leftSidebarOpen}
        onToggleLeftSidebar={() => setLeftSidebarOpen(o => !o)}
        rightSidebarOpen={rightSidebarOpen}
        onToggleRightSidebar={() => setRightSidebarOpen(o => !o)}
      />

      {/* 2. Main 3-Pane Reader Work Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane — Navigation Tree & Bookmarks */}
        <LeftSidebar
          isOpen={leftSidebarOpen}
          onToggle={() => setLeftSidebarOpen(o => !o)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          toc={toc}
          activeBlockId={activeBlockId}
          onSelectBlock={handleSelectBlock}
          activeIndexLetter={activeIndexLetter}
          onSelectIndexLetter={setActiveIndexLetter}
          activeEIndexLetter={activeEIndexLetter}
          onSelectEIndexLetter={setActiveEIndexLetter}
          activeDrugLetter={activeDrugLetter}
          onSelectDrugLetter={setActiveDrugLetter}
          bookmarks={bookmarks}
          onRemoveBookmark={handleRemoveBookmark}
          onSelectBookmark={handleSelectBookmark}
        />

        {/* Center Pane — Reading View */}
        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 overflow-hidden relative">
          {activeTab === 'tabular' && (
            <TabularBlockView
              block={activeBlock}
              loading={loadingBlock}
              settings={settings}
              activeCategoryCode={activeCategoryCode}
              targetHighlightCode={targetHighlightCode}
              onCodeClick={handleCodeClick}
              onJumpToCodeRef={handleSelectCodeFromIndexOrTable}
              bookmarks={bookmarks}
              onToggleBookmark={handleToggleBookmark}
              onPrevBlock={handlePrevBlock}
              onNextBlock={handleNextBlock}
              prevBlockId={prevBlockId}
              nextBlockId={nextBlockId}
            />
          )}

          {activeTab === 'index' && (
            <IndexLetterView
              data={indexData}
              loading={loadingIndex}
              settings={settings}
              title="Alphabetic Index to Diseases & Injuries"
              onSelectCode={handleSelectCodeFromIndexOrTable}
            />
          )}

          {activeTab === 'eindex' && (
            <IndexLetterView
              data={eindexData}
              loading={loadingEIndex}
              settings={settings}
              title="External Cause of Injuries Index"
              onSelectCode={handleSelectCodeFromIndexOrTable}
            />
          )}

          {activeTab === 'neoplasm' && (
            <NeoplasmTableView
              data={neoplasmData}
              loading={loadingNeoplasm}
              settings={settings}
              onSelectCode={handleSelectCodeFromIndexOrTable}
            />
          )}

          {activeTab === 'drugs' && (
            <DrugTableView
              data={drugsData}
              loading={loadingDrugs}
              settings={settings}
              activeDrugLetter={activeDrugLetter}
              onSelectLetter={setActiveDrugLetter}
              onSelectCode={handleSelectCodeFromIndexOrTable}
            />
          )}
        </main>

        {/* Right Pane — Context, Guidelines & Cross-Reference Drawer */}
        <RightSidebar
          isOpen={rightSidebarOpen}
          onClose={() => setRightSidebarOpen(false)}
          context={previewContext}
          onJumpToTabular={handleJumpToTabular}
          isBookmarked={!!previewContext && bookmarks.some(b => b.code === previewContext.code)}
          onToggleBookmark={handleToggleBookmark}
        />
      </div>
    </div>
  );
};

export default App;
