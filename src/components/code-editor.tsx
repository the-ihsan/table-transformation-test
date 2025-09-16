import Editor from "@monaco-editor/react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  isTypeScript: boolean;
  onTypeScriptChange: (isTypeScript: boolean) => void;
}

export function CodeEditor({
  code,
  onCodeChange,
  isTypeScript,
  onTypeScriptChange,
}: CodeEditorProps) {
  const handleCodeChange = (value: string | undefined) => {
    onCodeChange(value || "");
  };

  return (
    <div className="w-1/2 flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Transformation Code
        </h2>
        <div className="flex items-center space-x-2">
          <Label htmlFor="typescript-switch" className="text-sm font-medium">
            TypeScript
          </Label>
          <Switch
            id="typescript-switch"
            checked={isTypeScript}
            onCheckedChange={onTypeScriptChange}
          />
        </div>
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage={isTypeScript ? "typescript" : "javascript"}
          language={isTypeScript ? "typescript" : "javascript"}
          value={code}
          onChange={handleCodeChange}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: "on",
          }}
        />
      </div>
    </div>
  );
}
