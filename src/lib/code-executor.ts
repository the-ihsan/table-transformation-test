import * as ts from "typescript";
import type { Cell, TransformConfig } from "./types";
import { buildTableFromCells } from "./utils";

export type CodeExecutionResult =
  | {
      success: false;
      error: string;
    }
  | {
      success: true;
      output: HTMLTableElement;
    };

export interface CompiledFunction {
  (table: HTMLTableElement, config: TransformConfig): any;
}

export type CompilationResult =
  | {
      success: false;
      error: string;
    }
  | {
      success: true;
      compiledFunction: CompiledFunction;
    };

/**
 * Transpiles TypeScript code to JavaScript
 */
function transpileTypeScript(code: string): {
  success: boolean;
  jsCode?: string;
  error?: string;
} {
  try {
    const result = ts.transpile(code, {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.None,
      strict: false,
      skipLibCheck: true,
    });

    return { success: true, jsCode: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown transpilation error",
    };
  }
}

/**
 * Executes JavaScript code and returns the result
 */
export function complileCode(
  code: string,
  isTypeScript: boolean
): CompilationResult {
  try {
    const jsCode = isTypeScript ? transpileTypeScript(code).jsCode : code;
    // Create a safe execution environment
    const func = new Function(
      "table",
      "config",
      `
      ${jsCode}
      
      // Try to call main function if it exists
      if (typeof main === 'function') {
        return main(table, config);
      }
      
      // If no main function found, return undefined
      return undefined;
    `
    );

    return { success: true, compiledFunction: func as CompiledFunction };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown execution error",
    };
  }
}

/**
 * Executes a compiled function with validation
 */
export function executeCompiledFunction(
  compiledFunction: CompiledFunction,
  table: HTMLTableElement,
  config: TransformConfig
): CodeExecutionResult {
  try {
    const result = compiledFunction(table, config);
    if (result && result.tagName === "TABLE") {
      return {
        success: true,
        output: result,
      };
    }
    return {
      success: false,
      error: `Expected a table element, but got ${result}`,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      error: `Execution Error: ${
        error instanceof Error ? error.message : "Unknown execution error"
      }`,
    };
  }
}

export function executeUserCode(
  code: string,
  isTypeScript: boolean,
  table: Cell[][],
  config: TransformConfig
): CodeExecutionResult {
  const compilationResult = complileCode(code, isTypeScript);
  if (!compilationResult.success) {
    return {
      success: false,
      error: compilationResult.error,
    };
  }
  const result = executeCompiledFunction(
    compilationResult.compiledFunction!,
    buildTableFromCells(table),
    config
  );
  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }
  return {
    success: true,
    output: result.output,
  };
}
