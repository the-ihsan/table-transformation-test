export interface Cell {
  value: string;
  rowSpan: number;
  colSpan: number;
  hidden: boolean;
  col: number;
  row: number;
  shadow: boolean;
}

export interface CellPos {
  row: number;
  col: number;
}

export interface MergeBoundary {
  top: number;
  right: number;
  bottom: number;
  left: number;
}


export interface TransformConfig {
  transpose: boolean;
  repeatFirst: boolean;
  columnCount: number;
}