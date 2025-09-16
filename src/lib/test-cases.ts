import { transformTable } from "./transform";
import { buildTableFromCells, formatTestCaseTitle } from "./utils";
import {
  complileCode,
  executeCompiledFunction,
  executeUserCode,
} from "./code-executor";
import type { Cell, TransformConfig } from "./types";

export interface TestCase {
  table: Cell[][];
  configs: TransformConfig[];
  hasMergedCells: boolean;
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
      hidden: false,
      shadow: false,
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
        table[r][c].value = cell.value;
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
    hasMergedCells: false,
  },
  {
    table: applySpans(makeGrid(3, 3), [
      { row: 0, col: 0, rowSpan: 2, colSpan: 1 }, // vertical merge
      { row: 0, col: 1, rowSpan: 1, colSpan: 2 }, // horizontal merge
    ]),
    configs: allConfigs,
    hasMergedCells: true,
  },

  // --- Medium 5x5 ---
  {
    table: makeGrid(5, 5),
    configs: allConfigs,
    hasMergedCells: false,
  },
  {
    table: applySpans(makeGrid(5, 5), [
      { row: 0, col: 0, rowSpan: 2, colSpan: 2 },
      { row: 4, col: 2, rowSpan: 1, colSpan: 2 }, // spans columns 2-3
    ]),
    configs: allConfigs,
    hasMergedCells: true,
  },

  // --- Large 8x8 ---
  {
    table: makeGrid(8, 8),
    configs: allConfigs,
    hasMergedCells: false,
  },
  {
    table: applySpans(makeGrid(8, 8), [
      { row: 0, col: 0, rowSpan: 3, colSpan: 3 },
      { row: 3, col: 3, rowSpan: 2, colSpan: 4 },
      { row: 6, col: 6, rowSpan: 2, colSpan: 2 }, // spans rows 6-7, columns 6-7
    ]),
    configs: allConfigs,
    hasMergedCells: true,
  },
];

export type FlattenedTestCase = {
  table: Cell[][];
  config: TransformConfig;
  hasMergedCells: boolean;
};

export const ALL_TEST_CASES: FlattenedTestCase[] = testCases
  .map((testCase) =>
    testCase.configs.map((config) => ({
      table: testCase.table,
      config,
      hasMergedCells: testCase.hasMergedCells,
    }))
  )
  .flat();

export const runTest = (
  input: Cell[][],
  config: TransformConfig,
  output: HTMLTableElement
) => {
  const expectedTable = buildTableFromCells(transformTable(input, config));
  if (output.rows.length !== expectedTable.rows.length) {
    return false;
  }
  for (let i = 0; i < output.rows.length; i++) {
    const oCells = output.rows[i].cells;
    const eCells = expectedTable.rows[i].cells;
    if (oCells.length !== eCells.length) {
      return false;
    }
    for (let j = 0; j < oCells.length; j++) {
      const oCell = oCells[j];
      const eCell = eCells[j];
      if (
        oCell.textContent !== eCell.textContent ||
        oCell.rowSpan !== eCell.rowSpan ||
        oCell.colSpan !== eCell.colSpan
      ) {
        return false;
      }
    }
  }
  return true;
};
// ---------- Test Result Types ----------
export interface TestResult {
  testCase: string;
  hasMergedCells: boolean;
  result: Promise<{
    passed: boolean;
    error?: string;
  }>;
}

interface CompileAndRunCurrentTestProps {
  code: string;
  isTypeScript: boolean;
  testCase: FlattenedTestCase;
}

export const compileAndRunCurrentTest = ({
  code,
  isTypeScript,
  testCase,
}: CompileAndRunCurrentTestProps): TestResult => {
  return {
    testCase: formatTestCaseTitle(testCase.table, testCase.config),
    hasMergedCells: testCase.hasMergedCells,
    result: (async () => {
      try {
        const result = executeUserCode(
          code,
          isTypeScript,
          testCase.table,
          testCase.config
        );
        if (!result.success) {
          return {
            passed: false,
            error: result.error,
          };
        }
        const passed = runTest(testCase.table, testCase.config, result.output);
        return {
          passed: passed,
          error: passed ? undefined : `Does not match expected output`,
        };
      } catch (error) {
        console.log(error);
        return {
          passed: false,
          error: "Unknown error while executing user code",
        };
      }
    })(),
  };
};

interface CompileAndRunAllTestsProps {
  code: string;
  isTypeScript: boolean;
}

interface CompileAndRunAllTestsResult {
  success: boolean;
  error: string;
  results: TestResult[];
}

const getResult = async (
  fn: any,
  testCase: FlattenedTestCase
): Promise<{
  passed: boolean;
  error: string;
}> => {
  try {
    const table = buildTableFromCells(testCase.table);
    const result = executeCompiledFunction(fn, table, testCase.config);
    if (!result.success) {
      return {
        passed: false,
        error: result.error,
      };
    }
    if (runTest(testCase.table, testCase.config, result.output)) {
      return {
        passed: true,
        error: "",
      };
    }
    return {
      passed: false,
      error: "Does not match expected output",
    };
  } catch (error) {
    console.log(error);
    return {
      passed: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error while executing compiled function",
    };
  }
};

export const compileAndRunAllTests = ({
  code,
  isTypeScript,
}: CompileAndRunAllTestsProps): CompileAndRunAllTestsResult => {
  const compiledCode = complileCode(code, isTypeScript);
  if (!compiledCode.success) {
    return {
      success: false,
      error: compiledCode.error,
      results: [],
    };
  }
  const results: CompileAndRunAllTestsResult["results"] = ALL_TEST_CASES.map(
    (testCase) => ({
      testCase: formatTestCaseTitle(
        JSON.parse(JSON.stringify(testCase.table)),
        testCase.config
      ),
      hasMergedCells: testCase.hasMergedCells,
      result: getResult(compiledCode.compiledFunction, testCase),
    })
  );
  return {
    success: true,
    error: "",
    results: results,
  };
};
