"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { RotateCcw, Merge, Split } from "lucide-react";
import type { Cell, MergeBoundary } from "@/lib/types";
import { adjustMergeBoundary, initializeTable } from "@/lib/utils";
import { transformTable } from "@/lib/transform";

export function TableEditor() {
  const [table, setTable] = useState<Cell[][]>(() => initializeTable(3, 3));
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [selection, setSelection] = useState<MergeBoundary | null>(null);
  const [currentCell, setCurrentCell] = useState<[number, number] | null>(null);

  const [transform, setTransform] = useState(false);
  const [repeatFirst, setRepeatFirst] = useState(false);
  const [columnCount, setColumnCount] = useState(3);

  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    const evt = () => setCurrentCell(null);
    document.addEventListener("click", evt);
    return () => document.removeEventListener("click", evt);
  }, []);

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

      // Copy existing data
      for (let i = 0; i < Math.min(table.length, newRows); i++) {
        for (let j = 0; j < Math.min(table[i].length, newCols); j++) {
          if (table[i][j] && !table[i][j].hidden) {
            newTable[i][j] = { ...table[i][j] };
          }
        }
      }

      setTable(newTable);
      setRows(newRows);
      setCols(newCols);
      setSelection(null);
    },
    [table]
  );

  const resetTable = useCallback(() => {
    setTable(initializeTable(rows, cols));
    setSelection(null);
  }, [rows, cols]);

  const transformedTable = useMemo(() => {
    return transformTable(table, columnCount, transform, repeatFirst);
  }, [table, columnCount, transform, repeatFirst]);
  const hasRepeatFirstError = repeatFirst && columnCount < 2;

  return (
    <div className="space-y-6">
      {/* Table Editor Card */}
      <Card>
        <CardHeader>
          <CardTitle>Table Editor</CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={mergeCells}
              disabled={!selection}
              size="sm"
              variant="outline"
            >
              <Merge className="w-4 h-4 mr-2" />
              Merge Cells
            </Button>
            <Button
              onClick={splitCell}
              disabled={
                !currentCell ||
                (table[currentCell[0]][currentCell[1]].colSpan === 1 &&
                  table[currentCell[0]][currentCell[1]].rowSpan === 1)
              }
              size="sm"
              variant="outline"
            >
              <Split className="w-4 h-4 mr-2" />
              Split Cell
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table
              ref={tableRef}
              className="border-collapse border border-border"
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
                          className={`border border-border p-2 min-w-[60px] h-[40px] text-center cursor-pointer select-none ${
                            isSelected(i, j)
                              ? "bg-primary/20 border-primary/50"
                              : "hover:bg-muted/50"
                          } ${
                            cell.rowSpan > 1 || cell.colSpan > 1
                              ? "bg-blue-50 border-blue-300"
                              : ""
                          }`}
                          rowSpan={cell.rowSpan}
                          colSpan={cell.colSpan}
                          onMouseDown={(e) => handleCellMouseDown(e, i, j)}
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

          <Separator className="my-4" />

          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="rows">Rows</Label>
              <Input
                id="rows"
                type="number"
                value={rows}
                onChange={(e) => {
                  const newRows = Math.max(
                    1,
                    Number.parseInt(e.target.value) || 1
                  );
                  resizeTable(newRows, cols);
                }}
                className="w-20"
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cols">Columns</Label>
              <Input
                id="cols"
                type="number"
                value={cols}
                onChange={(e) => {
                  const newCols = Math.max(
                    1,
                    Number.parseInt(e.target.value) || 1
                  );
                  resizeTable(rows, newCols);
                }}
                className="w-20"
                min="1"
              />
            </div>
            <Button onClick={resetTable} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Table
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transformation Controls Card */}
      <Card>
        <CardHeader>
          <CardTitle>Transformation Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="transform"
                checked={transform}
                onCheckedChange={setTransform}
              />
              <Label htmlFor="transform">Transform (Transpose)</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="repeat-first"
                checked={repeatFirst}
                onCheckedChange={setRepeatFirst}
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
                  setColumnCount(
                    Math.max(1, Number.parseInt(e.target.value) || 1)
                  )
                }
                className="w-32"
                min="1"
              />
              {hasRepeatFirstError && (
                <p className="text-sm text-destructive">
                  Column count should be ≥ 2 when repeat first is enabled
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transformed Table Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Transformed Table Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {hasRepeatFirstError ? (
            <div className="text-center py-8 text-muted-foreground">
              Fix the error above to see the preview
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="border-collapse border border-border">
                <tbody>
                  {transformedTable.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => {
                        if (cell.hidden) return null;
                        return (
                          <td
                            key={j}
                            className={`border border-border p-2 min-w-[60px] h-[40px] text-center bg-muted/30 ${cell.shadow ? "opacity-25" : ""}`}
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
        </CardContent>
      </Card>
    </div>
  );
}
