// headbreaker 3.0.0 declares "types": "dist/headbreaker.d.ts" but does not ship
// that file, so these declarations cover the part of its API the jigsaw puzzle
// uses. Pieces and the stage are drawn by the Konva painter, whose own types
// come from the konva package.
declare module 'headbreaker' {
  import type Konva from 'konva';

  export interface Anchor {
    x: number;
    y: number;
  }

  export function anchor(x: number, y: number): Anchor;

  export class Manufacturer {
    withDimensions(width: number, height: number): void;
    withHeadAt(anchor: Anchor): void;
  }

  export interface Piece {
    /** The Konva node this piece is drawn as (set by the Konva painter). */
    shape?: Konva.Node;
    /** Move the piece (and its model) by a delta, keeping snapping in sync. */
    translate(dx: number, dy: number): void;
  }

  export interface Puzzle {
    pieces: Piece[];
  }

  export interface CanvasOptions {
    width: number;
    height: number;
    pieceSize: number;
    proximity: number;
    borderFill?: number;
    strokeColor?: string;
    lineSoftness?: number;
    image?: CanvasImageSource;
    painter?: Painter;
    fixed?: boolean;
    preventOffstageDrag?: boolean;
  }

  export type Painter = object;

  export class Canvas {
    constructor(containerId: string, options: CanvasOptions);
    autogenerateWithManufacturer(manufacturer: Manufacturer): void;
    shuffle(farness: number): void;
    draw(): void;
    attachSolvedValidator(): void;
    onValid(callback: (valid: boolean) => void): void;
    readonly puzzle?: Puzzle;
    /** The Konva layer the Konva painter draws into. */
    readonly __konvaLayer__?: Konva.Layer;
  }

  export const painters: {
    Konva: new () => Painter;
    Dummy: new () => Painter;
  };

  const headbreaker: {
    anchor: typeof anchor;
    Manufacturer: typeof Manufacturer;
    Canvas: typeof Canvas;
    painters: typeof painters;
  };
  export default headbreaker;
}
