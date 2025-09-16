"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Merge, RotateCcw, Split, TestTube, Settings } from "lucide-react";
import type { Cell, MergeBoundary, TransformConfig } from "@/lib/types";
import { adjustMergeBoundary, initializeTable } from "@/lib/utils";
import { transformTable } from "@/lib/transform";
import { appStorage } from "@/lib/storage";
import { ALL_TEST_CASES } from "@/lib/test-cases";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { Switch } from "@/components/ui/switch";

  interface InputAndProjectionProps {
  table: Cell[][];
  setTable: (table: Cell[][]) => void;
  config: TransformConfig;
  setConfig: (config: Partial<TransformConfig>) => void;
  className?: string;
}

export function InputAndProjection({
  table,
  setTable,
  config,
  setConfig,
  className,
}: InputAndProjectionProps) {
  // Load persisted table dimensions
  const persistedDimensions = appStorage.loadTableDimensions(3, 3);

  const [rows, setRows] = useState(persistedDimensions.rows);
  const [cols, setCols] = useState(persistedDimensions.cols);
  const [selection, setSelection] = useState<MergeBoundary | null>(null);
  const [currentCell, setCurrentCell] = useState<[number, number] | null>(null);
  const [editingCell, setEditingCell] = useState<[number, number] | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [showTestCases, setShowTestCases] = useState(false);
  const { transpose, repeatFirst, columnCount } = config;

  useEffect(() => {
    const evt = () => setCurrentCell(null);
    document.addEventListener("click", evt);
    return () => document.removeEventListener("click", evt);
  }, []);

  // Persist table data changes
  useEffect(() => {
    appStorage.saveTableData(table);
  }, [table]);

  // Persist table dimensions changes
  useEffect(() => {
    appStorage.saveTableDimensions(rows, cols);
  }, [rows, cols]);

  const handleCellMouseDown = (
    e: React.MouseEvent<HTMLTableCellElement>,
    row: number,
    col: number
  ) => {
    if (!currentCell || !e.shiftKey) {
      setSelection(null);
      setCurrentCell([row, col]);
    } else {
      const top = Math.min(currentCell[0], row);
      const right = Math.max(currentCell[1], col);
      const bottom = Math.max(currentCell[0], row);
      const left = Math.min(currentCell[1], col);
      setSelection(adjustMergeBoundary(table, { top, right, bottom, left }));
    }
  };

  const handleCellDoubleClick = (row: number, col: number) => {
    setEditingCell([row, col]);
    setEditingValue(table[row][col].value);
  };

  const handleCellEdit = (value: string) => {
    setEditingValue(value);
  };

  const handleCellEditComplete = () => {
    if (editingCell) {
      const [row, col] = editingCell;
      const newTable = [...table];
      newTable[row][col].value = editingValue;
      setTable(newTable);
    }
    setEditingCell(null);
    setEditingValue("");
  };

  const handleCellEditCancel = () => {
    setEditingCell(null);
    setEditingValue("");
  };

  const isSelected = useCallback(
    (row: number, col: number): boolean => {
      if (selection) {
        const { top, right, bottom, left } = selection;
        return row >= top && row <= bottom && col >= left && col <= right;
      }
      if (currentCell) {
        return currentCell[0] === row && currentCell[1] === col;
      }
      return false;
    },
    [selection, currentCell]
  );

  const mergeCells = useCallback(() => {
    if (!selection) return;

    const { top, right, bottom, left } = selection;

    const colspan = right - left + 1;
    const rowspan = bottom - top + 1;

    const newTable: Cell[][] = [];
    for (let i = 0; i < table.length; i++) {
      const newRow: Cell[] = [];
      for (let j = 0; j < table[i].length; j++) {
        const cell = { ...table[i][j] };
        if (cell.col === left && cell.row === top) {
          cell.colSpan = colspan;
          cell.rowSpan = rowspan;
        } else if (
          cell.row >= top &&
          cell.row <= bottom &&
          cell.col >= left &&
          cell.col <= right
        ) {
          cell.hidden = true;
        }
        newRow.push(cell);
      }
      newTable.push(newRow);
    }

    setTable(newTable);
    setSelection(null);
  }, [selection, table]);

  const splitCell = useCallback(() => {
    if (!currentCell) return;

    const [row, col] = currentCell;

    const cell = table[row][col];
    const { colSpan, rowSpan } = cell;

    cell.colSpan = 1;
    cell.rowSpan = 1;

    for (let c = col; c <= col + colSpan - 1; c++) {
      for (let r = row; r <= row + rowSpan - 1; r++) {
        table[r][c].hidden = false;
      }
    }

    setTable([...table]);
    setSelection(null);
  }, [currentCell, table]);

  const resizeTable = useCallback(
    (newRows: number, newCols: number) => {
      const newTable = initializeTable(newRows, newCols);

      for (let i = 0; i < Math.min(table.length, newRows); i++) {
        for (let j = 0; j < Math.min(table[i].length, newCols); j++) {
          const cell = table[i]?.[j];
          if (cell) {
            newTable[i][j] = { ...cell, value: newTable[i][j].value };
          }
        }
      }

      setTable(newTable);
      setRows(newRows);
      setCols(newCols);
      setSelection(null);
      setCurrentCell(null);
    },
    [table]
  );

  const resetTable = useCallback(() => {
    setTable(initializeTable(rows, cols));
    setSelection(null);
    setCurrentCell(null);
  }, [rows, cols]);

  const transformedTable = useMemo(() => {
    return transformTable(table, { columnCount, transpose, repeatFirst });
  }, [table, columnCount, transpose, repeatFirst]);

  // Group test cases by dimension
  const groupedTestCases = useMemo(() => {
    const groups: {
      [key: string]: ((typeof ALL_TEST_CASES)[0] & { index: number })[];
    } = {};

    ALL_TEST_CASES.forEach((testCase, index) => {
      const rows = testCase.table.length;
      const cols = testCase.table[0]?.length || 0;
      const hasMergedCells = testCase.table.some((row) =>
        row.some((cell) => cell.rowSpan > 1 || cell.colSpan > 1)
      );

      const dimensionKey = `${rows}x${cols}${
        hasMergedCells ? " (merged)" : ""
      }`;

      if (!groups[dimensionKey]) {
        groups[dimensionKey] = [];
      }
      groups[dimensionKey].push({ ...testCase, index });
    });

    return groups;
  }, []);

  const applyTestCase = useCallback(
    (testCase: (typeof ALL_TEST_CASES)[0]) => {
      setTable(testCase.table);
      setConfig(testCase.config);
      setRows(testCase.table.length);
      setCols(testCase.table[0]?.length || 0);
      setShowTestCases(false);
    },
    [setConfig]
  );

  const hasRepeatFirstError = repeatFirst && columnCount < 2;

  return (
    <Tabs
      defaultValue="input"
      className={`flex-1 flex flex-col overflow-hidden ${className}`}
    >
      <div className="px-4 py-1 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-[200px] grid-cols-2">
            <TabsTrigger value="input">Input</TabsTrigger>
            <TabsTrigger value="projection">Projection</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="rows" className="text-sm font-medium">
                Rows
              </Label>
              <Input
                id="rows"
                type="number"
                value={rows}
                onChange={(e) => {
                  const newRows = Math.max(
                    1,
                    Number.parseInt(e.target.value) || 1
                  );
                  setRows(newRows);
                  resizeTable(newRows, cols);
                }}
                className="w-16 h-8"
                min="1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="cols" className="text-sm font-medium">
                Cols
              </Label>
              <Input
                id="cols"
                type="number"
                value={cols}
                onChange={(e) => {
                  const newCols = Math.max(
                    1,
                    Number.parseInt(e.target.value) || 1
                  );
                  setCols(newCols);
                  resizeTable(rows, newCols);
                }}
                className="w-16 h-8"
                min="1"
              />
            </div>
            <Button onClick={resetTable} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      <TabsContent
        value="input"
        className="flex-1 flex flex-col overflow-hidden shadow px-4 py-2 m-0"
        forceMount
      >
        <div className="text-gray-900 mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Input Table</h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={mergeCells}
              disabled={!selection}
              variant="outline"
              size="sm"
            >
              <Merge className="w-4 h-4 mr-2" />
              Merge
            </Button>
            <Button
              onClick={splitCell}
              disabled={!currentCell}
              variant="outline"
              size="sm"
            >
              <Split className="w-4 h-4 mr-2" />
              Split
            </Button>
            <div className="w-px h-6 bg-gray-300"></div>
            <Popover open={showTestCases} onOpenChange={setShowTestCases}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <TestTube className="w-4 h-4 mr-2" />
                  Test Cases
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-96 max-h-96 overflow-auto p-4 bg-white shadow-lg rounded-lg"
                align="end"
              >
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">
                    Test Cases ({ALL_TEST_CASES.length} total)
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(groupedTestCases).map(
                      ([dimension, testCases]) => (
                        <div key={dimension} className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700 border-b pb-1">
                            {dimension} ({testCases.length} cases)
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {testCases.map((testCase, idx) => {
                              const overallIndex = testCase.index + 1;
                              const rows = testCase.table.length;
                              const cols = testCase.table[0]?.length || 0;
                              const dimension = `${rows}x${cols}`;

                              let title = `${overallIndex}. ${dimension}`;

                              if (
                                testCase.config.transpose &&
                                testCase.config.repeatFirst
                              ) {
                                title += ` - Transpose, Repeat, ${testCase.config.columnCount}`;
                              } else if (testCase.config.transpose) {
                                title += ` - Transpose, ${testCase.config.columnCount}`;
                              } else if (testCase.config.repeatFirst) {
                                title += ` - Repeat, ${testCase.config.columnCount}`;
                              } else {
                                title += ` - ${testCase.config.columnCount}`;
                              }

                              return (
                                <Button
                                  key={`${dimension}-${idx}`}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-8 justify-start"
                                  onClick={() => applyTestCase(testCase)}
                                >
                                  <div className="text-left">
                                    <div className="font-medium">{title}</div>
                                  </div>
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="flex-1 overflow-auto shadow-sm">
          <table
            className="border-collapse w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <tbody>
              {table.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => {
                    if (cell.hidden) return null;
                    return (
                      <td
                        key={j}
                        className={`border border-gray-300 p-3 min-w-[80px] h-[50px] text-center cursor-pointer select-none ${
                          isSelected(i, j)
                            ? "bg-blue-100 border-blue-400"
                            : "hover:bg-gray-50"
                        } ${
                          cell.rowSpan > 1 || cell.colSpan > 1
                            ? "bg-blue-50 border-blue-300"
                            : ""
                        }`}
                        rowSpan={cell.rowSpan}
                        colSpan={cell.colSpan}
                        onMouseDown={(e) => handleCellMouseDown(e, i, j)}
                        onDoubleClick={() => handleCellDoubleClick(i, j)}
                      >
                        {editingCell &&
                        editingCell[0] === i &&
                        editingCell[1] === j ? (
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => handleCellEdit(e.target.value)}
                            onBlur={handleCellEditComplete}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleCellEditComplete();
                              } else if (e.key === "Escape") {
                                handleCellEditCancel();
                              }
                            }}
                            className="w-full h-full text-center border-none outline-none bg-transparent"
                            autoFocus
                          />
                        ) : (
                          cell.value
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabsContent>

      <TabsContent
        value="projection"
        className="flex-1 flex flex-col overflow-hidden shadow-sm px-4 py-2 m-0"
        forceMount
      >
        <div className="text-gray-900 mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Projection Table</h2>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Transform Settings
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80 p-4 bg-white shadow-lg rounded-lg"
              align="end"
            >
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">
                  Transformation Controls
                </h3>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="transform"
                    checked={transpose}
                    onCheckedChange={() => setConfig({ transpose: !transpose })}
                  />
                  <Label htmlFor="transform">Transform (Transpose)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="repeat-first"
                    checked={repeatFirst}
                    onCheckedChange={() =>
                      setConfig({ repeatFirst: !repeatFirst })
                    }
                  />
                  <Label htmlFor="repeat-first">Repeat First</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="column-count">Column Count</Label>
                  <Input
                    id="column-count"
                    type="number"
                    value={columnCount}
                    onChange={(e) =>
                      setConfig({
                        columnCount: Math.max(
                          1,
                          Number.parseInt(e.target.value) || 1
                        ),
                      })
                    }
                    className="w-full"
                    min="1"
                  />
                  {hasRepeatFirstError && (
                    <p className="text-sm text-red-600">
                      Column count should be ≥ 2 when repeat first is enabled
                    </p>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        {hasRepeatFirstError ? (
          <div className="flex-1 text-center py-8 text-gray-500 bg-gray-50 rounded-lg flex items-center justify-center">
            Fix the error in transformation settings to see the preview
          </div>
        ) : (
          <div className="flex-1 overflow-auto shadow-sm">
            <table className="border-collapse w-full">
              <tbody>
                {transformedTable.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => {
                      if (cell.hidden) return null;
                      return (
                        <td
                          key={j}
                          className={`border border-gray-300 p-3 min-w-[80px] h-[50px] text-center bg-gray-50 ${
                            cell.shadow ? "opacity-25" : ""
                          }`}
                          rowSpan={cell.rowSpan}
                          colSpan={cell.colSpan}
                        >
                          {cell.value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

export default InputAndProjection;
