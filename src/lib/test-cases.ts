import { transformTable } from "./transform";
import { parseTable } from "./utils";
import { compileUserCode, executeCompiledFunction, type CompiledFunction } from "./code-executor";

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

export const runTest = (
  input: Cell[][],
  config: TransformConfig,
  output: HTMLTableElement
) => {
  const outputTable = parseTable(output);
  const expectedTable = transformTable(input, config);
  return JSON.stringify(outputTable) === JSON.stringify(expectedTable);
};

// ---------- Test Result Types ----------
export interface TestResult {
  testCase: {
    table: Cell[][];
    config: TransformConfig;
  };
  passed: boolean;
  error?: string;
  index: number;
}

// ---------- Test Runner Functions ----------

/**
 * Creates a table element from test case data
 */
function createTableFromTestCase(testCase: FlattenedTestCase): HTMLTableElement {
  const tableElement = document.createElement('table');
  const tbody = document.createElement('tbody');
  
  testCase.table.forEach(row => {
    const tr = document.createElement('tr');
    row.forEach(cell => {
      if (!cell.hidden) {
        const td = document.createElement('td');
        td.textContent = cell.value;
        if (cell.rowSpan > 1) td.setAttribute('rowspan', cell.rowSpan.toString());
        if (cell.colSpan > 1) td.setAttribute('colspan', cell.colSpan.toString());
        tr.appendChild(td);
      }
    });
    tbody.appendChild(tr);
  });
  
  tableElement.appendChild(tbody);
  return tableElement;
}

/**
 * Runs a single test case using a compiled function
 */
export async function runSingleTest(
  testCase: FlattenedTestCase,
  compiledFunction: CompiledFunction,
  index: number
): Promise<TestResult> {
  try {
    // Create a table element from the test case
    const tableElement = createTableFromTestCase(testCase);
    
    // Execute the compiled function
    const result = executeCompiledFunction(compiledFunction, tableElement, testCase.config);
    
    if (result.success && result.isTableElement) {
      // Parse the output table
      const parser = new DOMParser();
      const doc = parser.parseFromString(result.output || "", 'text/html');
      const outputTable = doc.querySelector('table') as HTMLTableElement;
      
      if (outputTable) {
        // Run the test
        const inputTableData = parseTable(tableElement);
        const passed = runTest(inputTableData, testCase.config, outputTable);
        
        return {
          testCase: testCase,
          passed,
          index: index,
        };
      } else {
        return {
          testCase: testCase,
          passed: false,
          error: "Output is not a valid table element",
          index: index,
        };
      }
    } else {
      return {
        testCase: testCase,
        passed: false,
        error: result.error || "Code execution failed",
        index: index,
      };
    }
  } catch (error) {
    return {
      testCase: testCase,
      passed: false,
      error: error instanceof Error ? error.message : "Unknown error",
      index: index,
    };
  }
}

/**
 * Runs a test on the current input table using a compiled function
 */
export async function runCurrentInputTest(
  table: HTMLTableElement,
  config: TransformConfig,
  compiledFunction: CompiledFunction
): Promise<TestResult> {
  try {
    // Execute the compiled function
    const result = executeCompiledFunction(compiledFunction, table, config);
    
    if (result.success && result.isTableElement) {
      // Parse the output table
      const parser = new DOMParser();
      const doc = parser.parseFromString(result.output || "", 'text/html');
      const outputTable = doc.querySelector('table') as HTMLTableElement;

      const inputTableData = parseTable(table);
      if (outputTable) {
        // Run the test
        const passed = runTest(inputTableData, config, outputTable);
        
        return {
          testCase: {
            table: inputTableData,
            config: config,
          },
          passed,
          index: 0,
        };
      } else {
        return {
          testCase: {
            table: parseTable(table),
            config: config,
          },
          passed: false,
          error: "Output is not a valid table element",
          index: 0,
        };
      }
    } else {
      return {
        testCase: {
          table: parseTable(table),
          config: config,
        },
        passed: false,
        error: result.error || "Code execution failed",
        index: 0,
      };
    }
  } catch (error) {
    return {
      testCase: {
        table: parseTable(table),
        config: config,
      },
      passed: false,
      error: error instanceof Error ? error.message : "Unknown error",
      index: 0,
    };
  }
}

/**
 * Runs all test cases using a compiled function
 */
export async function runAllTests(
  compiledFunction: CompiledFunction,
  onProgress?: (results: TestResult[]) => void
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  for (let i = 0; i < ALL_TEST_CASES.length; i++) {
    const testCase = ALL_TEST_CASES[i];
    const result = await runSingleTest(testCase, compiledFunction, i);
    results.push(result);
    
    // Update progress if callback provided
    if (onProgress) {
      onProgress([...results]);
    }
  }

  return results;
}

/**
 * Compiles code and runs all tests
 */
export async function compileAndRunAllTests(
  code: string,
  isTypeScript: boolean,
  onProgress?: (results: TestResult[]) => void
): Promise<{ success: boolean; results?: TestResult[]; error?: string }> {
  // Compile the code once
  const compilationResult = compileUserCode(code, isTypeScript);
  
  if (!compilationResult.success) {
    return {
      success: false,
      error: compilationResult.error,
    };
  }

  // Run all tests with the compiled function
  try {
    const results = await runAllTests(compilationResult.compiledFunction!, onProgress);
    return {
      success: true,
      results,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Compiles code and runs current input test
 */
export async function compileAndRunCurrentTest(
  table: HTMLTableElement,
  config: TransformConfig,
  code: string,
  isTypeScript: boolean
): Promise<{ success: boolean; result?: TestResult; error?: string }> {
  // Compile the code once
  const compilationResult = compileUserCode(code, isTypeScript);
  
  if (!compilationResult.success) {
    return {
      success: false,
      error: compilationResult.error,
    };
  }

  // Run the test with the compiled function
  try {
    const result = await runCurrentInputTest(table, config, compilationResult.compiledFunction!);
    return {
      success: true,
      result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
