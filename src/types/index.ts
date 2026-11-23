export interface SevenChrExtension {
  char: string;
  desc: string;
}

export interface SevenChrDef {
  extensions: SevenChrExtension[];
  notes?: string[];
}

export interface DiagNode {
  code: string;
  desc: string;
  placeholder?: boolean;
  is_leaf: boolean;
  level: number;
  requires_7th?: boolean;
  sevenChrDef?: SevenChrDef;
  sevenChrNote?: string[];
  includes?: string[];
  inclusionTerm?: string[];
  excludes1?: string[];
  excludes2?: string[];
  codeFirst?: string[];
  codeAlso?: string[];
  useAdditionalCode?: string[];
  notes?: string[];
  children?: DiagNode[];
}

export interface BlockNotes {
  includes?: string[];
  inclusionTerm?: string[];
  excludes1?: string[];
  excludes2?: string[];
  codeFirst?: string[];
  codeAlso?: string[];
  useAdditionalCode?: string[];
  notes?: string[];
  sevenChrNote?: string[];
  sevenChrDef?: SevenChrDef;
}

export interface TabularBlock {
  id: string;
  desc: string;
  chapter_num: string;
  chapter_desc: string;
  notes: BlockNotes;
  diags: DiagNode[];
}

export interface TocCategory {
  code: string;
  desc: string;
}

export interface TocSection {
  id: string;
  desc: string;
  first: string;
  last: string;
  categories: TocCategory[];
}

export interface TocChapter {
  num: string;
  desc: string;
  code_range: string;
  notes?: BlockNotes;
  sections: TocSection[];
}

export interface BlockMeta {
  id: string;
  desc: string;
  chapter_num: string;
  chapter_desc: string;
}

export interface IndexMeta {
  letters: string[];
  counts: Record<string, number>;
}

export interface TocData {
  version: string;
  title: string;
  chapters: TocChapter[];
  blocks: BlockMeta[];
  index: IndexMeta;
  eindex: IndexMeta;
  tables: {
    neoplasm: { title: string; rows: number };
    drugs: { title: string; rows: number; letters: string[] };
  };
}

export interface IndexTerm {
  title: string;
  level: number;
  nemod?: string;
  code?: string;
  see?: string;
  seeAlso?: string;
  seecat?: string;
  subcat?: string;
  manif?: string;
  terms?: IndexTerm[];
}

export interface IndexLetterData {
  letter: string;
  terms: IndexTerm[];
}

export interface TableRow {
  title: string;
  level: number;
  nemod?: string;
  letter?: string;
  cells?: string[];
  see?: string;
  seeAlso?: string;
}

export interface NeoplasmTableData {
  title: string;
  headers: string[];
  rows: TableRow[];
}

export interface DrugTableData {
  title: string;
  headers: string[];
  letters: string[];
  rows: TableRow[];
}

export interface SearchItem {
  code: string;
  desc: string;
  block_id: string;
  chapter: string;
  is_leaf: number;
  requires_7th: number;
}

export type BookTab = 'tabular' | 'index' | 'neoplasm' | 'drugs' | 'eindex';

export type FontSize = 'sm' | 'md' | 'lg';
export type Density = 'compact' | 'comfortable';

export interface ReaderSettings {
  fontSize: FontSize;
  density: Density;
  darkMode: boolean;
  showNotes: boolean;
}

export interface BookmarkItem {
  code: string;
  desc: string;
  block_id: string;
  chapter: string;
  is_leaf: boolean;
  requires_7th: boolean;
  savedAt: number;
}

export interface PreviewContext {
  code: string;
  desc?: string;
  block_id?: string;
  chapter_num?: string;
  source?: string;
  requires_7th?: boolean;
  sevenChrDef?: SevenChrDef;
  parentCode?: string;
  parentDesc?: string;
  notes?: {
    includes?: string[];
    excludes1?: string[];
    excludes2?: string[];
    codeFirst?: string[];
    useAdditionalCode?: string[];
    codeAlso?: string[];
  };
}
