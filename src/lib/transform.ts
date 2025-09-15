import type { Cell } from "./types";

export const transformTable = (
  table: Cell[][],
  colCount: number,
  transpose: boolean,
  repeatFirst: boolean
): Cell[][] => {
  if (transpose) {
    const newTable: Cell[][] = Array.from({ length: table[0].length }, () => []);
    for (let r = 0; r < table[0].length; r++) {
      for (let c = 0; c < table.length; c++) {
        newTable[r][c] = table[c][r];
        const rowSpan = newTable[r][c].rowSpan;
        const colSpan = newTable[r][c].colSpan;
        newTable[r][c].rowSpan = colSpan;
        newTable[r][c].colSpan = rowSpan;
      }
    }
    table = newTable;
  }

  table = JSON.parse(JSON.stringify(table)) as Cell[][];

  if (colCount >= table[0].length) {
    return table;
  }

  const heads: Record<
    number,
    {
      cell: Cell;
      colspan: number;
    }
  > = {};
  let loopInit = 0;

  const isHeadActive = repeatFirst && table.length > 1;

  if (isHeadActive) {
    let maxColspan = 0;
    loopInit = 1;
    table.forEach((cells, idx) => {
      const cell = cells[0];
      heads[idx] = {
        cell,
        colspan: cell.colSpan,
      };
      maxColspan = Math.max(maxColspan, cell.colSpan);
    });
    if (maxColspan >= colCount) {
      return table;
    }
  }

  const subRowOfRow: Record<
    number,
    {
      filled: number;
      rows: Cell[][];
    }
  > = {};

  for (let r = 0; r < table.length; r++) {
    if (!isHeadActive) {
      subRowOfRow[r] = { filled: 0, rows: [[]] };
    } else {
      subRowOfRow[r] = { filled: heads[r].colspan, rows: [[heads[r].cell]] };
    }
  }

  for (let r = 0; r < table.length; r++) {
    const cells = table[r];
    const subRowObj = subRowOfRow[r];
    let subRow = subRowObj.rows[0];
    for (let c = loopInit; c < cells.length; c++) {
      const cell = cells[c];
      subRow.push(cell);

      const colspan = cell.colSpan;
      const left = colCount - subRowOfRow[r].filled;
      const spaceUsed = Math.min(colspan, left);
      subRowObj.filled += 1;
      if (spaceUsed < colspan) {
        cell.colSpan = spaceUsed;
        const fCell = table[r][c + spaceUsed];
        const fillerProps = {
          ...fCell,
          colSpan: colspan - spaceUsed,
          rowSpan: cell.rowSpan,
          hidden: false,
          value: cell.value,
          shadow: true,
        };
        table[r][c + spaceUsed] = fillerProps;
      }

      if (subRow.length === colCount) {
        subRow = [];
        subRowObj.filled = 0;
        subRowObj.rows.push(subRow);
        if (isHeadActive) {
          subRowObj.filled = heads[r].colspan;
          subRow.push(heads[r].cell);
        }
      }
    }
  }

  const isEdgeRow: Record<number, boolean> = {};
  const newTable: Cell[][] = [];

  const subRowCount = subRowOfRow[0].rows.length;
  for (let sr = 0; sr < subRowCount; sr++) {
    for (let r = 0; r < table.length; r++) {
      const subRow = subRowOfRow[r].rows[sr];
      if (subRow.length > 1 || !isHeadActive) {
        newTable.push(subRow);
      }
      if (newTable.length % table.length === 0 && newTable.length > 0) {
        isEdgeRow[newTable.length - 1] = true;
      }
    }
  }

  console.log(newTable);
  
  return newTable;
};
