import {
  TocData,
  TabularBlock,
  IndexLetterData,
  NeoplasmTableData,
  DrugTableData,
  SearchItem,
  PreviewContext,
  DiagNode
} from '../types';

class DataService {
  private tocCache: TocData | null = null;
  private blockCache = new Map<string, TabularBlock>();
  private indexCache = new Map<string, IndexLetterData>();
  private eindexCache = new Map<string, IndexLetterData>();
  private neoplasmCache: NeoplasmTableData | null = null;
  private drugsCache: DrugTableData | null = null;
  private searchIndexCache: SearchItem[] | null = null;
  private codeToSearchItemMap = new Map<string, SearchItem>();

  async getToc(): Promise<TocData> {
    if (this.tocCache) return this.tocCache;
    const res = await fetch('/data/toc.json');
    if (!res.ok) throw new Error('Failed to load Table of Contents');
    const data: TocData = await res.json();
    this.tocCache = data;
    return data;
  }

  async getBlock(blockId: string): Promise<TabularBlock> {
    if (this.blockCache.has(blockId)) {
      return this.blockCache.get(blockId)!;
    }
    const res = await fetch(`/data/blocks/${blockId}.json`);
    if (!res.ok) throw new Error(`Failed to load block ${blockId}`);
    const data: TabularBlock = await res.json();
    this.blockCache.set(blockId, data);
    return data;
  }

  async getIndexLetter(letter: string): Promise<IndexLetterData> {
    const key = letter.toUpperCase();
    if (this.indexCache.has(key)) {
      return this.indexCache.get(key)!;
    }
    const res = await fetch(`/data/index/${key}.json`);
    if (!res.ok) throw new Error(`Failed to load index letter ${key}`);
    const data: IndexLetterData = await res.json();
    this.indexCache.set(key, data);
    return data;
  }

  async getEIndexLetter(letter: string): Promise<IndexLetterData> {
    const key = letter.toUpperCase();
    if (this.eindexCache.has(key)) {
      return this.eindexCache.get(key)!;
    }
    const res = await fetch(`/data/eindex/${key}.json`);
    if (!res.ok) throw new Error(`Failed to load external cause index letter ${key}`);
    const data: IndexLetterData = await res.json();
    this.eindexCache.set(key, data);
    return data;
  }

  async getNeoplasmTable(): Promise<NeoplasmTableData> {
    if (this.neoplasmCache) return this.neoplasmCache;
    const res = await fetch('/data/tables/neoplasm.json');
    if (!res.ok) throw new Error('Failed to load Neoplasm Table');
    const data: NeoplasmTableData = await res.json();
    this.neoplasmCache = data;
    return data;
  }

  async getDrugsTable(): Promise<DrugTableData> {
    if (this.drugsCache) return this.drugsCache;
    const res = await fetch('/data/tables/drugs.json');
    if (!res.ok) throw new Error('Failed to load Drug Table');
    const data: DrugTableData = await res.json();
    this.drugsCache = data;
    return data;
  }

  async getSearchIndex(): Promise<SearchItem[]> {
    if (this.searchIndexCache) return this.searchIndexCache;
    const res = await fetch('/data/search_index.json');
    if (!res.ok) throw new Error('Failed to load Search Index');
    const data: SearchItem[] = await res.json();
    this.searchIndexCache = data;
    for (const item of data) {
      this.codeToSearchItemMap.set(item.code.toLowerCase(), item);
      const clean = item.code.replace('.', '').toLowerCase();
      if (!this.codeToSearchItemMap.has(clean)) {
        this.codeToSearchItemMap.set(clean, item);
      }
    }
    return data;
  }

  findDiagInTree(nodes: DiagNode[], code: string, parent?: DiagNode): { node: DiagNode; parent?: DiagNode } | null {
    for (const node of nodes) {
      if (node.code.toLowerCase() === code.toLowerCase()) {
        return { node, parent };
      }
      if (node.children) {
        const found = this.findDiagInTree(node.children, code, node);
        if (found) return found;
      }
    }
    return null;
  }

  async getCodePreview(codeToLookup: string): Promise<PreviewContext | null> {
    const raw = codeToLookup.trim();
    if (!raw) return null;
    const cleanLookup = raw.replace(/[\[\]\(\)\-\.]/g, '').toUpperCase();
    await this.getSearchIndex();

    let matchedItem: SearchItem | undefined;
    for (const [key, item] of this.codeToSearchItemMap.entries()) {
      const cleanKey = key.replace('.', '').toUpperCase();
      if (cleanKey === cleanLookup || cleanKey.startsWith(cleanLookup) || cleanLookup.startsWith(cleanKey)) {
        matchedItem = item;
        break;
      }
    }

    if (!matchedItem) {
      return {
        code: raw,
        desc: 'Reference code (ICD-10-CM 2027)'
      };
    }

    try {
      const block = await this.getBlock(matchedItem.block_id);
      const result = this.findDiagInTree(block.diags, matchedItem.code);

      if (result) {
        const { node, parent } = result;
        return {
          code: node.code,
          desc: node.desc,
          block_id: matchedItem.block_id,
          chapter_num: matchedItem.chapter,
          requires_7th: !!node.requires_7th,
          sevenChrDef: node.sevenChrDef,
          parentCode: parent?.code,
          parentDesc: parent?.desc,
          notes: {
            includes: node.includes,
            excludes1: node.excludes1,
            excludes2: node.excludes2,
            codeFirst: node.codeFirst,
            useAdditionalCode: node.useAdditionalCode,
            codeAlso: node.codeAlso
          }
        };
      }
    } catch {
      // Fallback to basic search item info if block fetch fails
    }

    return {
      code: matchedItem.code,
      desc: matchedItem.desc,
      block_id: matchedItem.block_id,
      chapter_num: matchedItem.chapter,
      requires_7th: !!matchedItem.requires_7th
    };
  }

  search(query: string, items: SearchItem[], limit = 50): SearchItem[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const cleanQ = q.replace('.', '');
    const isCodeSearch = /^[a-z][0-9]/i.test(q) || /^[a-z]$/i.test(q);

    const exactMatches: SearchItem[] = [];
    const codePrefixMatches: SearchItem[] = [];
    const codeContainsMatches: SearchItem[] = [];
    const textMatches: SearchItem[] = [];

    const words = q.split(/\s+/).filter(Boolean);

    for (const item of items) {
      const itemCodeLower = item.code.toLowerCase();
      const itemCodeClean = itemCodeLower.replace('.', '');
      const itemDescLower = item.desc.toLowerCase();

      if (itemCodeLower === q || itemCodeClean === cleanQ) {
        exactMatches.push(item);
        continue;
      }

      if (isCodeSearch) {
        if (itemCodeClean.startsWith(cleanQ)) {
          codePrefixMatches.push(item);
          continue;
        } else if (itemCodeClean.includes(cleanQ)) {
          codeContainsMatches.push(item);
          continue;
        }
      }

      if (words.length > 0 && words.every(w => itemDescLower.includes(w))) {
        textMatches.push(item);
      }
    }

    const results = [
      ...exactMatches,
      ...codePrefixMatches,
      ...codeContainsMatches,
      ...textMatches
    ];

    return results.slice(0, limit);
  }
}

export const dataService = new DataService();
