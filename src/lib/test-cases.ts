// ---------- Types ----------
export interface Cell {
  value: string;
  rowSpan: number;
  colSpan: number;
  hidden?: boolean;
  col: number;
  row: number;
}

export interface TransformConfig {
  transpose: boolean;
  repeatFirst: boolean;
  columnCount: number;
}

export interface TestCase {
  table: Cell[][];
  configs: TransformConfig[];
}

// ---------- Configurations ----------
export const allConfigs: TransformConfig[] = [
  { transpose: false, repeatFirst: false, columnCount: 1 },
  { transpose: false, repeatFirst: false, columnCount: 2 },
  { transpose: false, repeatFirst: false, columnCount: 3 },
  { transpose: false, repeatFirst: false, columnCount: 4 },
  { transpose: false, repeatFirst: true, columnCount: 2 },
  { transpose: false, repeatFirst: true, columnCount: 3 },
  { transpose: true, repeatFirst: false, columnCount: 2 },
  { transpose: true, repeatFirst: false, columnCount: 3 },
  { transpose: true, repeatFirst: true, columnCount: 2 },
  { transpose: true, repeatFirst: true, columnCount: 3 },
];

// ---------- Helpers ----------

function makeGrid(rows: number, cols: number): Cell[][] {
  let counter = 1;
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      value: (counter++).toString(),
      rowSpan: 1,
      colSpan: 1,
      row: r,
      col: c,
    }))
  );
}

// Insert merged cells with proper hidden flags
function applySpans(
  table: Cell[][],
  spans: { row: number; col: number; rowSpan: number; colSpan: number }[]
): Cell[][] {
  const rows = table.length;
  const cols = table[0].length;
  spans.forEach(({ row, col, rowSpan, colSpan }) => {
    const cell = table[row][col];
    if (row + rowSpan > rows || col + colSpan > cols) {
      throw new Error("Invalid span");
    }
    cell.rowSpan = rowSpan;
    cell.colSpan = colSpan;

    for (let r = row; r < row + rowSpan && r < table.length; r++) {
      for (let c = col; c < col + colSpan && c < table[0].length; c++) {
        if (r === row && c === col) continue;
        table[r][c].hidden = true;
      }
    }
  });
  return table;
}

// ---------- Test Cases ----------
export const testCases: TestCase[] = [
  // --- Small 3x3 ---
  {
    table: makeGrid(3, 3),
    configs: allConfigs,
  },
  {
    table: applySpans(makeGrid(3, 3), [
      { row: 0, col: 0, rowSpan: 2, colSpan: 1 }, // vertical merge
      { row: 0, col: 1, rowSpan: 1, colSpan: 2 }, // horizontal merge
    ]),
    configs: allConfigs,
  },

  // --- Medium 5x5 ---
  {
    table: makeGrid(5, 5),
    configs: allConfigs,
  },
  {
    table: applySpans(makeGrid(5, 5), [
      { row: 0, col: 0, rowSpan: 2, colSpan: 2 },
      { row: 2, col: 2, rowSpan: 3, colSpan: 1 },
      { row: 4, col: 2, rowSpan: 1, colSpan: 2 }, // spans columns 2-3
    ]),
    configs: allConfigs,
  },

  // --- Large 8x8 ---
  {
    table: makeGrid(8, 8),
    configs: allConfigs,
  },
  {
    table: applySpans(makeGrid(8, 8), [
      { row: 0, col: 0, rowSpan: 3, colSpan: 3 },
      { row: 3, col: 3, rowSpan: 2, colSpan: 4 },
      { row: 6, col: 6, rowSpan: 2, colSpan: 2 }, // spans rows 6-7, columns 6-7
    ]),
    configs: allConfigs,
  },
];

type FlattenedTestCase = {
  table: Cell[][];
  config: TransformConfig;
};

export const ALL_TEST_CASES: FlattenedTestCase[] = testCases
  .map((testCase) =>
    testCase.configs.map((config) => ({
      table: testCase.table,
      config,
    }))
  )
  .flat();

export default ALL_TEST_CASES;
