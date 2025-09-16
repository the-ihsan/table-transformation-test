"use client";

import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/header";
import InputAndProjection from "@/components/input-and-projection";
import { CodeEditor } from "@/components/code-editor";
import { TestResultsModal } from "@/components/test-results-modal";
import type { TransformConfig } from "@/lib/types";
import { executeUserCode } from "@/lib/code-executor";
import { appStorage } from "@/lib/storage";
import Output from "./output";
import { cn } from "@/lib/utils";

const defaultCode = {
  typescript: `interface Config {
    transpose: boolean;
    repeatFirst: boolean;
    columnCount: number;
}
function transformTable(table: HTMLTableElement, config: Config): HTMLTableElement {
  return table;
}`,
  javascript: `function transformTable(table) {
  return table;
}`,
};

export function TableEditor() {
  // Load persisted data on component mount
  const [code, setCode] = useState(() => {
    const savedLanguage = appStorage.loadLanguage(true);
    const defaultCodeToUse = savedLanguage
      ? defaultCode.typescript
      : defaultCode.javascript;
    return appStorage.loadCode(defaultCodeToUse);
  });

  const [isTypeScript, setIsTypeScript] = useState(() =>
    appStorage.loadLanguage(true)
  );
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [config, setConfig] = useState<TransformConfig>(() =>
    appStorage.loadConfig({
      transpose: false,
      repeatFirst: false,
      columnCount: 3,
    })
  );
  const [output, setOutput] = useState("");

  // Test state
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testModalTitle, setTestModalTitle] = useState("");
  const [testType, setTestType] = useState<'current' | 'all'>('current');

  // Visibility state for different sections
  const [showInput, setShowInput] = useState(true);
  const [showOutput, setShowOutput] = useState(true);
  const [showCodeEditor, setShowCodeEditor] = useState(true);

  // Check if screen width is less than 800px
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 800);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Persist code changes
  useEffect(() => {
    appStorage.saveCode(code);
  }, [code]);

  // Persist language changes
  useEffect(() => {
    appStorage.saveLanguage(isTypeScript);
  }, [isTypeScript]);

  // Persist config changes
  useEffect(() => {
    appStorage.saveConfig(config);
  }, [config]);

  if (isSmallScreen) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">📱</div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Screen Too Small
          </h2>
          <p className="text-gray-500">
            Please use a screen width of at least 800px to use this application.
          </p>
        </div>
      </div>
    );
  }

  const onTypeScriptChange = (isTypeScript: boolean) => {
    setIsTypeScript(isTypeScript);
    if (isTypeScript && code === defaultCode.javascript) {
      setCode(defaultCode.typescript);
    } else if (!isTypeScript && code === defaultCode.typescript) {
      setCode(defaultCode.javascript);
    }
  };

  const onRunCode = () => {
    const table = tableRef.current?.cloneNode(true) as HTMLTableElement;
    if (!table) {
      return;
    }

    console.log("Running code", table);

    try {
      const result = executeUserCode(code, isTypeScript, table, config);

      if (result.success) {
        if (result.isTableElement) {
          // Output is a valid table element
          setOutput(result.output || "");
          console.log(
            "✅ Code executed successfully - output is a table element"
          );
        } else {
          // Output is not a table element
          setOutput(`⚠️ Output is not a table element:\n\n${result.output}`);
          console.log(
            "⚠️ Code executed but output is not a table element:",
            result.output
          );
        }
      } else {
        // Error occurred (transpilation or execution)
        setOutput(`❌ Error: ${result.error}`);
        console.error("❌ Code execution failed:", result.error);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setOutput(`❌ Unexpected Error: ${errorMessage}`);
      console.error("❌ Unexpected error:", error);
    }
  };

  const onConfigChange = (cfg: Partial<TransformConfig>) => {
    setConfig({ ...config, ...cfg });
  };

  const runCurrentTest = () => {
    const table = tableRef.current?.cloneNode(true) as HTMLTableElement;
    if (!table) {
      return;
    }

    setTestType('current');
    setTestModalTitle("Current Input Test");
    setIsTestModalOpen(true);
  };

  const runAllTestsHandler = () => {
    setTestType('all');
    setTestModalTitle("All Tests");
    setIsTestModalOpen(true);
  };

  const halfCodeEditor = showInput || showOutput;

  return (
    <div className="h-screen flex flex-col bg-white">
      <Header
        showInput={showInput}
        setShowInput={setShowInput}
        showOutput={showOutput}
        setShowOutput={setShowOutput}
        showCodeEditor={showCodeEditor}
        setShowCodeEditor={setShowCodeEditor}
      />

      <div className="flex-1 flex overflow-hidden">
        <div
          className={`flex-1 flex flex-col border-r border-gray-200 ${
            !showInput && !showOutput ? "hidden" : ""
          }`}
        >
          <InputAndProjection
            tableRef={tableRef}
            setConfig={onConfigChange}
            config={config}
            className={showInput ? "" : "hidden"}
          />
          <Output output={output} className={showOutput ? "" : "hidden"} />
        </div>
        {showCodeEditor && (
          <CodeEditor
            code={code}
            onCodeChange={setCode}
            isTypeScript={isTypeScript}
            onTypeScriptChange={onTypeScriptChange}
            onRunCode={onRunCode}
            onRunCurrentTest={runCurrentTest}
            onRunAllTests={runAllTestsHandler}
            className={cn({
              hidden: !showCodeEditor,
              "w-1/2": halfCodeEditor,
              "w-full": !halfCodeEditor,
            })}
          />
        )}
      </div>
      
      <TestResultsModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title={testModalTitle}
        testType={testType}
        code={code}
        isTypeScript={isTypeScript}
        config={config}
        table={testType === 'current' ? tableRef.current?.cloneNode(true) as HTMLTableElement : undefined}
      />
    </div>
  );
}
