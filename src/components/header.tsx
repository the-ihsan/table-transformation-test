"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HelpCircle, Trash2 } from "lucide-react";
import { appStorage } from "@/lib/storage";
import Help from "./help";
import { useState } from "react";

export function Header() {
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
