import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Loader2, TestTube } from "lucide-react";
import { useEffect, useState } from "react";
import {
  compileAndRunCurrentTest,
  compileAndRunAllTests,
  type FlattenedTestCase,
} from "@/lib/test-cases";

// Local interface for resolved test results with pending state
interface ResolvedTestResult {
  testCase: string;
  passed?: boolean;
  error?: string;
  index: number;
  isPending: boolean;
  hasMergedCells: boolean;
}

interface TestResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  code: string;
  isTypeScript: boolean;
  testCase?: FlattenedTestCase;
}

export function TestResultsModal({
  isOpen,
  onClose,
  title,
  code,
  isTypeScript,
  testCase,
}: TestResultsModalProps) {
  const [results, setResults] = useState<ResolvedTestResult[]>([]);
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
        if (testCase) {
          // Single test case
          const testResult = compileAndRunCurrentTest({
            code,
            isTypeScript,
            testCase,
          });

          // Show pending state immediately
          setResults([
            {
              testCase: testResult.testCase,
              index: 0,
              isPending: true,
              hasMergedCells: testResult.hasMergedCells,
            },
          ]);

          // Resolve the result and update
          const result = await testResult.result;
          setResults([
            {
              testCase: testResult.testCase,
              passed: result.passed,
              error: result.error,
              index: 0,
              isPending: false,
              hasMergedCells: testResult.hasMergedCells,
            },
          ]);
        } else {
          // All test cases
          const allTestsResult = await compileAndRunAllTests({
            code,
            isTypeScript,
          });
          if (!allTestsResult.success) {
            // Show error state
            setResults([
              {
                testCase: "Compilation",
                passed: false,
                error: allTestsResult.error,
                index: 0,
                isPending: false,
                hasMergedCells: false,
              },
            ]);
          } else {
            // Initialize all tests as pending
            const initialResults: ResolvedTestResult[] =
              allTestsResult.results.map((res, index) => ({
                testCase: res.testCase,
                index,
                isPending: true,
                hasMergedCells: res.hasMergedCells,
              }));
            setResults(initialResults);

            // Resolve each test result as it completes
            allTestsResult.results.forEach(async (testResult, index) => {
              try {
                const result = await testResult.result;
                setResults((prev) =>
                  prev.map((r, i) =>
                    i === index
                      ? {
                          ...r,
                          passed: result.passed,
                          error: result.error,
                          isPending: false,
                        }
                      : r
                  )
                );
              } catch (error) {
                setResults((prev) =>
                  prev.map((r, i) =>
                    i === index
                      ? {
                          ...r,
                          passed: false,
                          error:
                            error instanceof Error
                              ? error.message
                              : "Unknown error",
                          isPending: false,
                        }
                      : r
                  )
                );
              }
            });
          }
        }
      } catch (error) {
        setResults([
          {
            testCase: "Compilation",
            passed: false,
            error:
              error instanceof Error ? error.message : "Unknown error occurred",
            index: 0,
            isPending: false,
            hasMergedCells: false,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    // Use setTimeout to ensure modal is fully rendered before starting tests
    const timeoutId = setTimeout(runTests, 100);
    return () => clearTimeout(timeoutId);
  }, [isOpen, code, isTypeScript, testCase]);

  const passedCount = results.filter((r) => r.passed === true).length;
  const failedCount = results.filter((r) => r.passed === false).length;
  const pendingCount = results.filter((r) => r.isPending).length;
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
              <p className="text-gray-600">
                {testCase ? "Running single test..." : "Running all tests..."}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {testCase
                  ? "Testing your transformation function"
                  : "Testing against all test cases"}
              </p>
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
              {pendingCount > 0 && (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="font-medium">{pendingCount} Pending</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-600" />
                <span className="font-medium">{totalCount} Total</span>
              </div>
              <div className="ml-auto">
                {pendingCount > 0 ? (
                  <Badge variant="secondary">Running...</Badge>
                ) : (
                  <Badge
                    variant={
                      passedCount === totalCount && failedCount === 0
                        ? "default"
                        : "destructive"
                    }
                  >
                    {totalCount > 0
                      ? Math.round(
                          (passedCount / (passedCount + failedCount)) * 100
                        )
                      : 0}
                    % Pass Rate
                  </Badge>
                )}
              </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-auto">
              {results.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <TestTube className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">
                      No test results available
                    </p>
                    <p className="text-sm">
                      Tests may have failed to run or no tests were executed.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {results.map((result, index) => {
                    const {
                      testCase,
                      passed,
                      error,
                      isPending,
                      hasMergedCells,
                    } = result;

                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          isPending
                            ? "bg-blue-50 border-blue-200"
                            : passed
                            ? "bg-green-50 border-green-200"
                            : "bg-red-50 border-red-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isPending ? (
                              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                            ) : passed ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                            <div>
                              <div className="font-medium">
                                {testCase}
                                {hasMergedCells ? " (merged)" : ""}
                              </div>
                              {error && (
                                <div className="font-medium mb-1 text-red-800">
                                  Error: {error}
                                </div>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant={
                              isPending
                                ? "secondary"
                                : passed
                                ? "default"
                                : "destructive"
                            }
                          >
                            {isPending
                              ? "RUNNING"
                              : passed
                              ? "PASSED"
                              : "FAILED"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
