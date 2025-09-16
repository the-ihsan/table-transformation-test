import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Loader2, TestTube } from "lucide-react";
import { useEffect, useState } from "react";
import { compileAndRunCurrentTest, compileAndRunAllTests, type TestResult } from "@/lib/test-cases";
import type { TransformConfig } from "@/lib/types";

interface TestResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  // Test parameters
  testType: 'current' | 'all';
  code: string;
  isTypeScript: boolean;
  config: TransformConfig;
  table?: HTMLTableElement; // Only needed for current test
}

export function TestResultsModal({
  isOpen,
  onClose,
  title,
  testType,
  code,
  isTypeScript,
  config,
  table,
}: TestResultsModalProps) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Run tests after modal is rendered
  useEffect(() => {
    if (!isOpen) {
      setResults([]);
      return;
    }

    const runTests = async () => {
      setIsLoading(true);
      setResults([]);

      try {
        if (testType === 'current' && table) {
          const result = await compileAndRunCurrentTest(table, config, code, isTypeScript);
          
          if (result.success && result.result) {
            setResults([result.result]);
          } else {
            const errorResult: TestResult = {
              testCase: {
                table: [],
                config: config,
              },
              passed: false,
              error: result.error || "Compilation failed",
              index: 0,
            };
            setResults([errorResult]);
          }
        } else if (testType === 'all') {
          const result = await compileAndRunAllTests(code, isTypeScript, (progressResults) => {
            setResults(progressResults);
          });
          
          if (result.success && result.results) {
            setResults(result.results);
          } else {
            const errorResult: TestResult = {
              testCase: {
                table: [],
                config: config,
              },
              passed: false,
              error: result.error || "Compilation failed",
              index: 0,
            };
            setResults([errorResult]);
          }
        }
      } catch (error) {
        const errorResult: TestResult = {
          testCase: {
            table: [],
            config: config,
          },
          passed: false,
          error: error instanceof Error ? error.message : "Unknown error",
          index: 0,
        };
        setResults([errorResult]);
      } finally {
        setIsLoading(false);
      }
    };

    // Use setTimeout to ensure modal is fully rendered before starting tests
    const timeoutId = setTimeout(runTests, 100);
    return () => clearTimeout(timeoutId);
  }, [isOpen, testType, code, isTypeScript, config, table]);

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  const totalCount = results.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <TestTube className="w-5 h-5" />
                {title}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Running tests...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Summary */}
            <div className="flex items-center gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium">{passedCount} Passed</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium">{failedCount} Failed</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-600" />
                <span className="font-medium">{totalCount} Total</span>
              </div>
              <div className="ml-auto">
                <Badge variant={passedCount === totalCount ? "default" : "destructive"}>
                  {totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0}% Pass Rate
                </Badge>
              </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-auto">
              <div className="space-y-2">
                {results.map((result, index) => {
                  const { testCase, passed, error } = result;
                  const rows = testCase.table.length;
                  const cols = testCase.table[0]?.length || 0;
                  const hasMergedCells = testCase.table.some((row: any[]) =>
                    row.some((cell: any) => cell.rowSpan > 1 || cell.colSpan > 1)
                  );

                  let configDesc = `${testCase.config.columnCount} cols`;
                  if (testCase.config.transpose && testCase.config.repeatFirst) {
                    configDesc += " - Transpose, Repeat";
                  } else if (testCase.config.transpose) {
                    configDesc += " - Transpose";
                  } else if (testCase.config.repeatFirst) {
                    configDesc += " - Repeat";
                  }

                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        passed
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {passed ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          <div>
                            <div className="font-medium">
                              Test #{result.index + 1}: {rows}x{cols}
                              {hasMergedCells ? " (merged)" : ""}
                            </div>
                            <div className="text-sm text-gray-600">{configDesc}</div>
                          </div>
                        </div>
                        <Badge variant={passed ? "default" : "destructive"}>
                          {passed ? "PASSED" : "FAILED"}
                        </Badge>
                      </div>
                      {error && (
                        <div className="mt-2 p-2 bg-red-100 rounded text-sm text-red-800 font-mono">
                          {error}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
