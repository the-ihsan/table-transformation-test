"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { LeftPanel } from "@/components/left-panel";
import { CodeEditor } from "@/components/code-editor";

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
  const [code, setCode] = useState(defaultCode.typescript);
  const [isTypeScript, setIsTypeScript] = useState(true);

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

  return (
    <div className="h-screen flex flex-col bg-white">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <LeftPanel />
        <CodeEditor
          code={code}
          onCodeChange={setCode}
          isTypeScript={isTypeScript}
          onTypeScriptChange={onTypeScriptChange}
        />
      </div>
    </div>
  );
}
