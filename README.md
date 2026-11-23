# 📖 ICD-10-CM 2027 Interactive Digital Codebook (Web Ebook Reader)

A complete, high-performance, client-side **ICD-10-CM 2027 Digital Codebook & Reference Reader** built with **React 18, TypeScript, Vite, and Tailwind CSS**.

This application is designed specifically for medical coders, billing specialists, health informatics professionals, and clinical documentation integrity (CDI) teams. It delivers an experience similar to professional coding suites (such as **AAPC Codify** and **Optum EncoderPro**) — **running 100% locally or on any free static host without requiring any backend database or API key**.

---

## 🌟 Key Highlights & Why It Was Built

Traditional medical coding applications often suffer from:
- Heavy server-side database requirements (SQL Server, MongoDB, Elasticsearch).
- Subscription lock-in and high monthly licensing fees.
- Clunky interfaces that force users to navigate away from the tabular context to inspect index cross-references.
- Slow network roundtrips for every subcategory search.

### The Solution: Zero-Database Static Architecture
1. **Zero Database Required**: All official 2027 ICD-10-CM codes (47,000+ entries, 22 Chapters, 297 Sections, Alphabetic Index, Neoplasm Table, and Drug Table) are pre-processed into static, optimized JSON chunks loaded on-demand.
2. **Instant Search (< 10ms)**: Complete client-side index lookup across all 47,025 codes and clinical keywords with instant dropdown results, code prefix matching, and highlight animations.
3. **Professional 3-Pane Clinical Reader**:
   - **Left Pane**: Collapsible accordion navigation (`Chapter` → `Section/Block` → `3-Character Category`) + LocalStorage Bookmarks.
   - **Center Pane**: Continuous book reading view with **Sticky Category Header** (stays pinned while scrolling subcodes), indentation lines for deep code hierarchies, and color-coded instructional callouts (`Excludes1`, `Excludes2`, `Includes`, `Code First`, `Use Additional Code`).
   - **Right Pane**: Context Drawer providing instant cross-reference previews, one-click copy, and an interactive **7th Character Extension Matrix** (`A`, `D`, `S`, etc.) that generates complete billable claim codes.

---

## 🏗️ System Architecture & Data Pipeline

```
Raw Official CMS/CDC 2027 XML Files
  ├── icd10cm-tabular_-2027.xml  (Tabular List)
  ├── icd10cm-index-2027.xml     (Alphabetic Index to Diseases)
  ├── icd10cm-eindex-2027.xml    (External Causes Index)
  ├── icd10cm-neoplasm-2027.xml  (Neoplasm Table)
  └── icd10cm-drug-2027.xml      (Table of Drugs and Chemicals)
                  │
                  ▼
         build_ebook_data.py  (Python ETL Engine)
                  │
                  ▼
         public/data/ (Optimized Static JSON Chunks)
  ├── toc.json                  (22 Chapters, 297 Blocks, Index metadata)
  ├── blocks/<block_id>.json    (297 on-demand Tabular block files)
  ├── index/<letter>.json       (26 Alphabetic Index letter files A–Z)
  ├── eindex/<letter>.json      (22 External Cause letter files A–W)
  ├── tables/neoplasm.json      (1,940 anatomical sites × 6 behavior cols)
  ├── tables/drugs.json         (7,436 substances × 6 poisoning/adverse cols)
  └── search_index.json         (Compact lookup array for 47,025 codes)
                  │
                  ▼
     React + TypeScript + Vite + Tailwind CSS Single Page App (SPA)
```

---

## 📂 Project Structure

```text
Ebook/
├── build_ebook_data.py          # Python XML-to-JSON ETL script
├── verify_demo.py               # Automated 8-point verification script
├── index.html                   # HTML5 shell with Google Inter & JetBrains Mono
├── package.json                 # Project dependencies & npm scripts
├── postcss.config.js            # PostCSS configuration
├── tailwind.config.js           # Tailwind CSS configuration with book themes
├── tsconfig.json                # TypeScript strict configuration
├── vite.config.ts               # Vite bundler configuration
│
├── public/
│   └── data/                    # Generated static JSON data
│       ├── toc.json             # Table of Contents
│       ├── search_index.json    # Global instant search index
│       ├── blocks/              # 297 Section chunk files (e.g. E08-E13.json)
│       ├── index/               # 26 Alphabetic Index letter files (A.json - Z.json)
│       ├── eindex/              # 22 External Cause Index letter files (A.json - W.json)
│       └── tables/              # neoplasm.json and drugs.json
│
└── src/
    ├── main.tsx                 # React application entry point
    ├── index.css                # Custom scrollbars, sticky styles, flash animations
    ├── App.tsx                  # Main state coordinator & 3-pane layout
    ├── types/
    │   └── index.ts             # Complete TypeScript interfaces for all data
    ├── services/
    │   └── dataService.ts       # Caching fetch service & client-side search engine
    └── components/
        ├── TopToolbar.tsx       # Book tabs, search input, font size, density, theme
        ├── LeftSidebar.tsx      # Accordion tree, letter jumpers, local bookmarks
        ├── RightSidebar.tsx     # Context drawer, 7th char matrix, copy code
        ├── tabular/
        │   └── TabularBlockView.tsx # Book view, sticky category header, callouts
        ├── index/
        │   └── IndexLetterView.tsx  # Natural language index & cross-references
        └── tables/
            ├── NeoplasmTableView.tsx # 7-column neoplasm matrix with search filter
            └── DrugTableView.tsx     # 7-column poisoning & adverse effect table
```

---

## 🚀 Local Setup & Development

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Python**: 3.8+ (for ETL preprocessing)

### 1. Preprocess the XML Data
If you modify or update the raw XML files, run the Python ETL script:
```bash
python build_ebook_data.py
```
*Processes all 5 XML files into static JSON chunks in under 5 seconds.*

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Start the Local Dev Server
```bash
npm run dev
```
Open **`http://localhost:5173/`** in your browser.

### 4. Build for Production
```bash
npm run build
```
Creates an optimized, production-ready static build inside the `dist/` directory (total JS bundle is only **~62 KB gzipped**).

---

## 🌐 Can I Deploy It to a Free Server?

### **YES! 100% Free Forever.**
Because this project is a **100% static Single Page Application (SPA)** with zero backend, zero database, and zero server-side computation, you can host it completely free on any modern static hosting platform with global CDN acceleration and free SSL certificates.

Here are the easiest free deployment options:

### Option 1: Vercel (Recommended — 2 Minutes)
1. Push this folder to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Vercel automatically detects Vite:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **"Deploy"**. Your digital codebook is live worldwide on a free `.vercel.app` domain!

*(Alternatively, run `npx vercel` directly in this directory)*.

---

### Option 2: Netlify (Drag-and-Drop or Git)
1. Build the production folder locally:
   ```bash
   npm run build
   ```
2. Log into [netlify.com](https://www.netlify.com/).
3. Drag and drop the `dist/` folder directly onto the Netlify dashboard.
4. Your site is deployed instantly on a free `.netlify.app` URL with free HTTPS.

---

### Option 3: GitHub Pages
1. Install the `gh-pages` helper or use GitHub Actions:
   ```bash
   npm install --save-dev gh-pages
   ```
2. In `vite.config.ts`, add the base repository path:
   ```ts
   export default defineConfig({
     base: '/your-repo-name/',
     plugins: [react()]
   });
   ```
3. Add a deploy script to `package.json`:
   ```json
   "scripts": {
     "deploy": "tsc && vite build && gh-pages -d dist"
   }
   ```
4. Run `npm run deploy`.

---

### Option 4: Cloudflare Pages
1. Go to [pages.cloudflare.com](https://pages.cloudflare.com/) (100% free with unlimited bandwidth).
2. Connect your Git repository.
3. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Click **"Save and Deploy"**.

---

## ⌨️ Reader Controls & Keyboard Shortcuts

| Shortcut / Control | Action |
| :--- | :--- |
| **`/`** | Focus global search bar instantly from anywhere |
| **`Esc`** | Close search dropdown results |
| **`S / M / L`** | Switch font scale between Small, Medium, and Large |
| **Density Toggle** | Toggle between Compact and Comfortable layout padding |
| **Notes Toggle** | Show or Hide instructional notes (`Excludes1`, `Includes`, etc.) |
| **Theme Toggle** | Switch between Dark Reading Mode and Crisp Light Mode |
| **Star Button (⭐)** | Save code to persistent local bookmarks list |

---

## 📑 Official Data Attribution
- Official ICD-10-CM 2027 release files provided by the **Centers for Disease Control and Prevention (CDC)** and the **Centers for Medicare & Medicaid Services (CMS)**.
- Public domain U.S. Government clinical data.
