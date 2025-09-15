# Table Transformer Playground

An interactive web app for **editing, merging, and transforming tables** with custom rules.
It provides both a **visual table editor** and a **Monaco-powered IDE** where you can experiment with your own transformation logic.

---

## ✨ Features

### 📝 Table Editor

* Create tables with custom number of rows and columns.
* Merge cells (`rowSpan`, `colSpan`) with a drag-select + **Merge Cells** action.
* Split merged cells back into individual cells.
* Export the current table state as JSON.

### 🔄 Transformation Controls

* **Transform** → transpose the table (rows ↔ columns, with spans swapped).
* **Repeat First** → repeat the first column/row in each grouping.
* **Column Count (N)** → control how many columns the transformed table should have.
* **Overflow Clipping** → if a cell’s `colSpan` exceeds the boundary of `N`, it’s clipped and continued in the next row with blank filler cells.

### 💻 Custom Logic IDE

* Built-in **Monaco Editor** lets you write your own transformation function.
* Provided with a default `getTransformedTable` implementation for reference.
* Write, test, and compare your custom logic against the default one.

---

## 🚀 Getting Started

### Prerequisites

* Node.js (>= 18)
* pnpm or npm

### Installation

```bash
git clone https://github.com/the-ihsan/table-transformation-test.git
cd table-transformation-test
pnpm install
pnpm dev
```

### Development

* Runs on [Vite](https://vitejs.dev) + React + TailwindCSS.
* UI components from [shadcn/ui](https://ui.shadcn.com).
* Monaco Editor integrated for live coding experience.

---

## 📖 Usage

1. **Edit Table**

   * Use the toolbar to merge or split cells.
   * Change row/column count from controls.

2. **Transform Table**

   * Toggle `Transform` (transpose).
   * Toggle `Repeat First`.
   * Adjust `Column Count`.
   * See the transformed preview instantly.

3. **Experiment with Logic**

   * Open Monaco editor pane.
   * Write your own `getTransformedTable` function.
   * Run and compare the output with the provided implementation.

---

## 🧩 Example

### Input Table

```
1 2 3
4 5 6
7 8 9
```

### Config

* Transform: false
* Repeat First: true
* Column Count: 2

### Output

```
1 4
2 5
3 6
1 7
2 8
3 9
```

---

## 📐 Clipping Rule (Important!)

When a cell’s **colSpan** exceeds the target **Column Count (N)**, the cell must be **clipped**.

* The visible part fits in the current row.
* The remaining span is continued as a **blank cell** in the next row(s).

### Example

* Cell with `colSpan = 3` placed in a table with `N = 2`.
* Current column index = `1`.

```
Before:
[ A (colSpan=3) ]
```

```
After clipping (N=2):
Row 1: [ A (colSpan=1) ][ A (colSpan=1) ]
Row 2: [ "" (colSpan=1) ]
```

The blank cell carries the same `rowSpan`, but has no value.

This ensures:

* Tables remain rectangular.
* Spans never overflow past the boundary.
