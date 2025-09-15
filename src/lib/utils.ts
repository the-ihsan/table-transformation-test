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