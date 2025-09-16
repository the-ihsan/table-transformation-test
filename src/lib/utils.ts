import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Cell, MergeBoundary } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const initializeTable = (rows: number, cols: number): Cell[][] => {
  const table: Cell[][] = []
  let counter = 1
  for (let i = 0; i < rows; i++) {
    const row: Cell[] = []
    for (let j = 0; j < cols; j++) {
      row.push({
        value: counter.toString(),
        rowSpan: 1,
        colSpan: 1,
        hidden: false,
        col: j,
        row: i,
      })
      counter++
    }
    table.push(row)
  }
  return table
}


export const adjustMergeBoundary = (
  table: Cell[][],
  boundary: MergeBoundary
) => {
  loop1: for (let r = 0; r < table.length; r++) {
    const cells = table[r];
    for (let c = 0; c < cells.length; c++) {
      const cellId = cells[c];
      const { col, rowSpan, colSpan, hidden } = cellId

      if (hidden) {
        continue;
      }

      const colEnd = col + colSpan - 1;
      const rowEnd = r + rowSpan - 1;

      const colStartsInside = col >= boundary.left && col <= boundary.right;
      const colEndsInside = colEnd >= boundary.left && colEnd <= boundary.right;
      const rowStartsInside = r >= boundary.top && r <= boundary.bottom;
      const rowEndsInside = rowEnd >= boundary.top && rowEnd <= boundary.bottom;

      if (
        !(colStartsInside || colEndsInside) ||
        !(rowStartsInside || rowEndsInside)
      ) {
        continue;
      }

      let restart = false;

      if (!colStartsInside && colEndsInside) {
        boundary.left = col;
        restart = true;
      } else if (colStartsInside && !colEndsInside) {
        boundary.right = colEnd;
        restart = true;
      }

      if (!rowStartsInside && rowEndsInside) {
        boundary.top = r;
        restart = true;
      } else if (rowStartsInside && !rowEndsInside) {
        boundary.bottom = rowEnd;
        restart = true;
      }

      if (restart) {
        r = -1;
        continue loop1;
      }
    }
  }
  return boundary;
};


export const parseTable = (table: HTMLTableElement): Cell[][] => {
  const rows = table.querySelectorAll("tr");
  const rowCount = rows.length;
  let colCount = 0;
  for (let i = 0; i < rows[0].children.length; i++) {
    colCount+= (rows[0].children[i] as HTMLTableCellElement).colSpan;
  }
  const tableData: Cell[][] = Array.from({ length: rowCount }, (_, j) => Array.from({ length: colCount }, (_, i) => ({
    value: "",
    rowSpan: 1,
    colSpan: 1,
    hidden: false,
    col: i,
    row: j,
  })));

  const hasFilled: Record<number, Record<number, boolean>> = {};

  for (let i = 0; i < rowCount; i++) {
    const row = rows[i];

    const cellCount = row.cells.length;
    const cellOrder = tableData[i];
    let col = 0;

    for (let j = 0; j < cellCount; j++) {
      while (hasFilled[i]?.[col]) col++;
      const cell = row.cells[j];
      const cellData = cellOrder[col];

      

      const colSpan = cell.colSpan || 1;
      const rowSpan = cell.rowSpan || 1;
      

      // If the current cell is merged into later columns, we need to add the blank cells to the cell order
      if (colSpan > 1) {
        hasFilled[i] ||= {};
        for (let k = 1; k < colSpan; k++) {
          const bCol = col + k;
          const blankCell = cellOrder[bCol];
          blankCell.hidden = true;
          blankCell.value = cellData.value;
          hasFilled[i][bCol] = true;
        }
      }

      // If this cell is merged into later rows, we need to add the blank cells to the cell order
      for (let k = 1; k < rowSpan; k++) {
        const bRow = i + k;
        const blankCellOrder = tableData[bRow];
        hasFilled[bRow] ||= {};
        for (let l = 0; l < colSpan; l++) {
          const bCol = col + l;
          const blankCell = blankCellOrder[bCol];
          blankCell.hidden = true;
          blankCell.value = cellData.value;
          hasFilled[bRow][bCol] = true;
        }
      }

      col += colSpan;
    }
  }

  return tableData;
};