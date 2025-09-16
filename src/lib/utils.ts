import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Cell, MergeBoundary, TransformConfig } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const initializeTable = (rows: number, cols: number): Cell[][] => {
  const table: Cell[][] = [];
  let counter = 1;
  for (let i = 0; i < rows; i++) {
    const row: Cell[] = [];
    for (let j = 0; j < cols; j++) {
      row.push({
        value: counter.toString(),
        rowSpan: 1,
        colSpan: 1,
        hidden: false,
        col: j,
        row: i,
        shadow: false,
      });
      counter++;
    }
    table.push(row);
  }
  return table;
};

export const adjustMergeBoundary = (
  table: Cell[][],
  boundary: MergeBoundary
) => {
  loop1: for (let r = 0; r < table.length; r++) {
    const cells = table[r];
    for (let c = 0; c < cells.length; c++) {
      const cellId = cells[c];
      const { col, rowSpan, colSpan, hidden } = cellId;

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
    colCount += (rows[0].children[i] as HTMLTableCellElement).colSpan;
  }

  const tableRec: Record<number, Record<number, Cell>> = {};
  const futColInit: Record<number, number> = {};

  for (let i = 0; i < rowCount; i++) {
    const row = rows[i];
    tableRec[i] = tableRec[i] || {};
    let col = futColInit[i] || 0;
    for (let j = 0; j < row.children.length; j++) {
      const cell = row.children[j] as HTMLTableCellElement;
      tableRec[i][col] = {
        value: cell.textContent!,
        rowSpan: cell.rowSpan,
        colSpan: cell.colSpan,
        hidden: false,
        col: col,
        row: i,
        shadow: false,
      };

      const colSpan = cell.colSpan;
      const rowSpan = cell.rowSpan;
      if (colSpan > 1 || rowSpan > 1) {
        for (let l = 0; l < rowSpan; l++) {
          for (let k = 0; k < colSpan; k++) {
            if (l === 0 && k === 0) continue;
            tableRec[i + l] = tableRec[i + l] || {};
            tableRec[i + l][col + k] = {
              value: cell.textContent!,
              rowSpan: 1,
              colSpan: 1,
              hidden: true,
              col: col + k,
              row: i + l,
              shadow: false,
            };
          }
        }
      }

      if (rowSpan > 1 && col === 0) {
        for (let l = 1; l < rowSpan; l++) {
          futColInit[i + l] = colSpan;
        }
      }

      col += colSpan;
    }
  }
  const finalTable: Cell[][] = [];
  for (let i = 0; i < rowCount; i++) {
    const row: Cell[] = [];
    for (let j = 0; j < colCount; j++) {
      row.push(tableRec[i][j]);
    }
    finalTable.push(row);
  }
  return finalTable;
};
export const formatTestCaseTitle = (
  inputData: Cell[][],
  config: TransformConfig
) => {
  return `${inputData.length}x${inputData[0].length} ${
    config.transpose ? " - Transposed" : ""
  } ${config.repeatFirst ? " - Repeated" : ""} - ${config.columnCount}`;
};

export const buildTableFromCells = (tableData: Cell[][]): HTMLTableElement => {
  const table = document.createElement("table");
  for (let i = 0; i < tableData.length; i++) {
    const row = document.createElement("tr");
    for (let j = 0; j < tableData[i].length; j++) {
      const cellData = tableData[i][j];
      if (cellData.hidden) {
        continue;
      }
      const cell = document.createElement("td");
      cell.textContent = cellData.value;
      cell.colSpan = cellData.colSpan;
      cell.rowSpan = cellData.rowSpan;
      row.appendChild(cell);
    }
    table.appendChild(row);
  }
  return table;
};
