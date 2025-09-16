"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HelpCircle, Trash2, Eye, EyeOff } from "lucide-react";
import { appStorage } from "@/lib/storage";
import Help from "./help";
import { useState } from "react";

interface HeaderProps {
  showInput: boolean;
  setShowInput: (show: boolean) => void;
  showOutput: boolean;
  setShowOutput: (show: boolean) => void;
  showCodeEditor: boolean;
  setShowCodeEditor: (show: boolean) => void;
}

export function Header({ showInput, setShowInput, showOutput, setShowOutput, showCodeEditor, setShowCodeEditor }: HeaderProps) {
  const [showHelp, setShowHelp] = useState(false);

  const handleClearData = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all saved data? This will reset your code, table, and settings."
      )
    ) {
      appStorage.clearAll();
      window.location.reload();
    }
  };

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Table Transformation Editor
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInput(!showInput)}
              className={showInput ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}
            >
              {showInput ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              Input
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOutput(!showOutput)}
              className={showOutput ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}
            >
              {showOutput ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              Output
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCodeEditor(!showCodeEditor)}
              className={showCodeEditor ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}
            >
              {showCodeEditor ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              Code Editor
            </Button>
          </div>
          <div className="w-px h-6 bg-gray-300"></div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearData}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            Clear Data
          </Button>
          <Dialog open={showHelp} onOpenChange={setShowHelp}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <HelpCircle className="w-4 h-4" />
                What to do?
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] bg-gray-900" onInteractOutside={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle className="text-white">What to do?</DialogTitle>
              </DialogHeader>
              <div className="max-h-[80vh] overflow-y-auto">
                <Help onStartContest={() => setShowHelp(false)} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
