import * as ts from 'typescript';
import type { TransformConfig } from './types';

export interface CodeExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  isTableElement?: boolean;
}

export interface CodeExecutionError {
  type: 'transpilation' | 'execution' | 'output';
  message: string;
}

export interface CompiledFunction {
  (table: HTMLTableElement, config: TransformConfig): any;
}

export interface CompilationResult {
  success: boolean;
  compiledFunction?: CompiledFunction;
  error?: string;
}

/**
 * Transpiles TypeScript code to JavaScript
 */
function transpileTypeScript(code: string): { success: boolean; jsCode?: string; error?: string } {
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
      error: error instanceof Error ? error.message : 'Unknown transpilation error' 
    };
  }
}

/**
 * Executes JavaScript code and returns the result
 */
function executeCode(jsCode: string, table: HTMLTableElement, config: TransformConfig): { success: boolean; result?: any; error?: string } {
  try {
    // Create a safe execution environment
    const func = new Function('table', 'config', `
      ${jsCode}
      
      // Try to call main function if it exists
      if (typeof main === 'function') {
        return main(table, config);
      }
      
      // Try to call transformTable function if it exists
      if (typeof transformTable === 'function') {
        return transformTable(table, config);
      }
      
      // If no main function found, return undefined
      return undefined;
    `);
    
    const result = func(table, config);
    return { success: true, result };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown execution error' 
    };
  }
}

/**
 * Validates if the output is a table element
 */
function validateTableOutput(result: any): { isTable: boolean; html?: string } {
  if (result instanceof HTMLTableElement) {
    return { isTable: true, html: result.outerHTML };
  }
  
  if (result && typeof result === 'object' && result.tagName === 'TABLE') {
    return { isTable: true, html: result.outerHTML };
  }
  
  if (typeof result === 'string' && result.includes('<table')) {
    // Try to parse as HTML and check if it's a table
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(result, 'text/html');
      const tableElement = doc.querySelector('table');
      if (tableElement) {
        return { isTable: true, html: tableElement.outerHTML };
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }
  
  return { isTable: false };
}

/**
 * Compiles user code once and returns a reusable function
 */
export function compileUserCode(
  code: string, 
  isTypeScript: boolean
): CompilationResult {
  // Step 1: Transpile TypeScript if needed
  let jsCode = code;
  if (isTypeScript) {
    const transpileResult = transpileTypeScript(code);
    if (!transpileResult.success) {
      return {
        success: false,
        error: `Transpilation Error: ${transpileResult.error}`,
      };
    }
    jsCode = transpileResult.jsCode!;
  }
  
  // Step 2: Create the compiled function
  try {
    const compiledFunction: CompiledFunction = new Function('table', 'config', `
      ${jsCode}
      
      // Try to call main function if it exists
      if (typeof main === 'function') {
        return main(table, config);
      }
      
      // Try to call transformTable function if it exists
      if (typeof transformTable === 'function') {
        return transformTable(table, config);
      }
      
      // If no main function found, return undefined
      return undefined;
    `) as CompiledFunction;
    
    return {
      success: true,
      compiledFunction,
    };
  } catch (error) {
    return {
      success: false,
      error: `Compilation Error: ${error instanceof Error ? error.message : 'Unknown compilation error'}`,
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
    
    // Validate output
    const validation = validateTableOutput(result);
    
    if (validation.isTable) {
      return {
        success: true,
        output: validation.html,
        isTableElement: true,
      };
    } else {
      // Output is not a table element
      return {
        success: true,
        output: String(result || 'No output'),
        isTableElement: false,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Execution Error: ${error instanceof Error ? error.message : 'Unknown execution error'}`,
    };
  }
}

/**
 * Main function to execute user code with proper error handling
 */
export function executeUserCode(
  code: string, 
  isTypeScript: boolean, 
  table: HTMLTableElement, 
  config: TransformConfig
): CodeExecutionResult {
  // Step 1: Transpile TypeScript if needed
  let jsCode = code;
  if (isTypeScript) {
    const transpileResult = transpileTypeScript(code);
    if (!transpileResult.success) {
      return {
        success: false,
        error: `Transpilation Error: ${transpileResult.error}`,
      };
    }
    jsCode = transpileResult.jsCode!;
  }
  
  // Step 2: Execute the code
  const executionResult = executeCode(jsCode, table, config);
  if (!executionResult.success) {
    return {
      success: false,
      error: `Execution Error: ${executionResult.error}`,
    };
  }
  
  // Step 3: Validate output
  const validation = validateTableOutput(executionResult.result);
  
  if (validation.isTable) {
    return {
      success: true,
      output: validation.html,
      isTableElement: true,
    };
  } else {
    // Output is not a table element
    return {
      success: true,
      output: String(executionResult.result || 'No output'),
      isTableElement: false,
    };
  }
}
