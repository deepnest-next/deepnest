/* eslint-disable @typescript-eslint/no-explicit-any */

// SVGPathSeg API polyfill
// https://github.com/progers/pathseg
//
// This is a drop-in replacement for the SVGPathSeg and SVGPathSegList APIs that were removed from
// SVG2 (https://lists.w3.org/Archives/Public/www-svg/2015Jun/0044.html), including the latest spec
// changes which were implemented in Firefox 43 and Chrome 46.

// Ensure this file is treated as a module.
export {};

declare global {
  interface SVGPathSeg {
    readonly pathSegType: number;
    readonly pathSegTypeAsLetter: string;
    _owningPathSegList: SVGPathSegList | null | undefined;
    _segmentChanged(): void;
    _asPathString(): string;
    clone(): SVGPathSeg;
  }

  interface SVGPathSegClosePath extends SVGPathSeg {
    clone(): SVGPathSegClosePath;
  }

  interface SVGPathSegMovetoAbs extends SVGPathSeg {
    x: number;
    y: number;
    clone(): SVGPathSegMovetoAbs;
  }

  interface SVGPathSegMovetoRel extends SVGPathSeg {
    x: number;
    y: number;
    clone(): SVGPathSegMovetoRel;
  }

  interface SVGPathSegLinetoAbs extends SVGPathSeg {
    x: number;
    y: number;
    clone(): SVGPathSegLinetoAbs;
  }

  interface SVGPathSegLinetoRel extends SVGPathSeg {
    x: number;
    y: number;
    clone(): SVGPathSegLinetoRel;
  }

  interface SVGPathSegCurvetoCubicAbs extends SVGPathSeg {
    x: number;
    y: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    clone(): SVGPathSegCurvetoCubicAbs;
  }

  interface SVGPathSegCurvetoCubicRel extends SVGPathSeg {
    x: number;
    y: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    clone(): SVGPathSegCurvetoCubicRel;
  }

  interface SVGPathSegCurvetoQuadraticAbs extends SVGPathSeg {
    x: number;
    y: number;
    x1: number;
    y1: number;
    clone(): SVGPathSegCurvetoQuadraticAbs;
  }

  interface SVGPathSegCurvetoQuadraticRel extends SVGPathSeg {
    x: number;
    y: number;
    x1: number;
    y1: number;
    clone(): SVGPathSegCurvetoQuadraticRel;
  }

  interface SVGPathSegArcAbs extends SVGPathSeg {
    x: number;
    y: number;
    r1: number;
    r2: number;
    angle: number;
    largeArcFlag: boolean;
    sweepFlag: boolean;
    clone(): SVGPathSegArcAbs;
  }

  interface SVGPathSegArcRel extends SVGPathSeg {
    x: number;
    y: number;
    r1: number;
    r2: number;
    angle: number;
    largeArcFlag: boolean;
    sweepFlag: boolean;
    clone(): SVGPathSegArcRel;
  }

  interface SVGPathSegLinetoHorizontalAbs extends SVGPathSeg {
    x: number;
    clone(): SVGPathSegLinetoHorizontalAbs;
  }

  interface SVGPathSegLinetoHorizontalRel extends SVGPathSeg {
    x: number;
    clone(): SVGPathSegLinetoHorizontalRel;
  }

  interface SVGPathSegLinetoVerticalAbs extends SVGPathSeg {
    y: number;
    clone(): SVGPathSegLinetoVerticalAbs;
  }

  interface SVGPathSegLinetoVerticalRel extends SVGPathSeg {
    y: number;
    clone(): SVGPathSegLinetoVerticalRel;
  }

  interface SVGPathSegCurvetoCubicSmoothAbs extends SVGPathSeg {
    x: number;
    y: number;
    x2: number;
    y2: number;
    clone(): SVGPathSegCurvetoCubicSmoothAbs;
  }

  interface SVGPathSegCurvetoCubicSmoothRel extends SVGPathSeg {
    x: number;
    y: number;
    x2: number;
    y2: number;
    clone(): SVGPathSegCurvetoCubicSmoothRel;
  }

  interface SVGPathSegCurvetoQuadraticSmoothAbs extends SVGPathSeg {
    x: number;
    y: number;
    clone(): SVGPathSegCurvetoQuadraticSmoothAbs;
  }

  interface SVGPathSegCurvetoQuadraticSmoothRel extends SVGPathSeg {
    x: number;
    y: number;
    clone(): SVGPathSegCurvetoQuadraticSmoothRel;
  }

  type AnySVGPathSeg =
    | SVGPathSegClosePath
    | SVGPathSegMovetoAbs
    | SVGPathSegMovetoRel
    | SVGPathSegLinetoAbs
    | SVGPathSegLinetoRel
    | SVGPathSegCurvetoCubicAbs
    | SVGPathSegCurvetoCubicRel
    | SVGPathSegCurvetoQuadraticAbs
    | SVGPathSegCurvetoQuadraticRel
    | SVGPathSegArcAbs
    | SVGPathSegArcRel
    | SVGPathSegLinetoHorizontalAbs
    | SVGPathSegLinetoHorizontalRel
    | SVGPathSegLinetoVerticalAbs
    | SVGPathSegLinetoVerticalRel
    | SVGPathSegCurvetoCubicSmoothAbs
    | SVGPathSegCurvetoCubicSmoothRel
    | SVGPathSegCurvetoQuadraticSmoothAbs
    | SVGPathSegCurvetoQuadraticSmoothRel;

  interface SVGPathSegList {
    readonly numberOfItems: number;
    clear(): void;
    initialize(newItem: AnySVGPathSeg): AnySVGPathSeg;
    getItem(index: number): AnySVGPathSeg;
    insertItemBefore(newItem: AnySVGPathSeg, index: number): AnySVGPathSeg;
    replaceItem(newItem: AnySVGPathSeg, index: number): AnySVGPathSeg;
    removeItem(index: number): AnySVGPathSeg;
    appendItem(newItem: AnySVGPathSeg): AnySVGPathSeg;
    segmentChanged(pathSeg: AnySVGPathSeg): void;
  }

  const SVGPathSeg: {
    new (
      type: number,
      typeAsLetter: string,
      owningPathSegList: SVGPathSegList | undefined,
    ): SVGPathSeg;
    prototype: SVGPathSeg;
    readonly PATHSEG_UNKNOWN: 0;
    readonly PATHSEG_CLOSEPATH: 1;
    readonly PATHSEG_MOVETO_ABS: 2;
    readonly PATHSEG_MOVETO_REL: 3;
    readonly PATHSEG_LINETO_ABS: 4;
    readonly PATHSEG_LINETO_REL: 5;
    readonly PATHSEG_CURVETO_CUBIC_ABS: 6;
    readonly PATHSEG_CURVETO_CUBIC_REL: 7;
    readonly PATHSEG_CURVETO_QUADRATIC_ABS: 8;
    readonly PATHSEG_CURVETO_QUADRATIC_REL: 9;
    readonly PATHSEG_ARC_ABS: 10;
    readonly PATHSEG_ARC_REL: 11;
    readonly PATHSEG_LINETO_HORIZONTAL_ABS: 12;
    readonly PATHSEG_LINETO_HORIZONTAL_REL: 13;
    readonly PATHSEG_LINETO_VERTICAL_ABS: 14;
    readonly PATHSEG_LINETO_VERTICAL_REL: 15;
    readonly PATHSEG_CURVETO_CUBIC_SMOOTH_ABS: 16;
    readonly PATHSEG_CURVETO_CUBIC_SMOOTH_REL: 17;
    readonly PATHSEG_CURVETO_QUADRATIC_SMOOTH_ABS: 18;
    readonly PATHSEG_CURVETO_QUADRATIC_SMOOTH_REL: 19;
  };

  const SVGPathSegClosePath: {
    new (owningPathSegList: SVGPathSegList | undefined): SVGPathSegClosePath;
    prototype: SVGPathSegClosePath;
  };
  const SVGPathSegMovetoAbs: {
    new (
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
    ): SVGPathSegMovetoAbs;
    prototype: SVGPathSegMovetoAbs;
  };
  const SVGPathSegMovetoRel: {
    new (
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
    ): SVGPathSegMovetoRel;
    prototype: SVGPathSegMovetoRel;
  };
  const SVGPathSegLinetoAbs: {
    new (
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
    ): SVGPathSegLinetoAbs;
    prototype: SVGPathSegLinetoAbs;
  };
  const SVGPathSegLinetoRel: {
    new (
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
    ): SVGPathSegLinetoRel;
    prototype: SVGPathSegLinetoRel;
  };
  const SVGPathSegCurvetoCubicAbs: {
    new (
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
    ): SVGPathSegCurvetoCubicAbs;
    prototype: SVGPathSegCurvetoCubicAbs;
  };
  const SVGPathSegCurvetoCubicRel: {
    new (
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
    ): SVGPathSegCurvetoCubicRel;
    prototype: SVGPathSegCurvetoCubicRel;
  };
  const SVGPathSegCurvetoQuadraticAbs: {
    new (
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
      x1: number,
      y1: number,
    ): SVGPathSegCurvetoQuadraticAbs;
    prototype: SVGPathSegCurvetoQuadraticAbs;
  };
  const SVGPathSegCurvetoQuadraticRel: {
    new (
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
      x1: number,
      y1: number,
    ): SVGPathSegCurvetoQuadraticRel;
    prototype: SVGPathSegCurvetoQuadraticRel;
  };
  const SVGPathSegArcAbs: {
    new (
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
      r1: number,
      r2: number,
      angle: number,
      largeArcFlag: boolean,
      sweepFlag: boolean,
    ): SVGPathSegArcAbs;
    prototype: SVGPathSegArcAbs;
  };
  const SVGPathSegArcRel: {
    new (
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
      r1: number,
      r2: number,
      angle: number,
      largeArcFlag: boolean,
      sweepFlag: boolean,
    ): SVGPathSegArcRel;
    prototype: SVGPathSegArcRel;
  };
  const SVGPathSegLinetoHorizontalAbs: {
    new (
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
    ): SVGPathSegLinetoHorizontalAbs;
    prototype: SVGPathSegLinetoHorizontalAbs;
  };
  const SVGPathSegLinetoHorizontalRel: {
    new (
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
    ): SVGPathSegLinetoHorizontalRel;
    prototype: SVGPathSegLinetoHorizontalRel;
  };
  const SVGPathSegLinetoVerticalAbs: {
    new (
      owningPathSegList: SVGPathSegList | undefined,
      y: number,
    ): SVGPathSegLinetoVerticalAbs;
    prototype: SVGPathSegLinetoVerticalAbs;
  };
  const SVGPathSegLinetoVerticalRel: {
    new (
      owningPathSegList: SVGPathSegList | undefined,
      y: number,
    ): SVGPathSegLinetoVerticalRel;
    prototype: SVGPathSegLinetoVerticalRel;
  };
  const SVGPathSegCurvetoCubicSmoothAbs: {
    new (
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
      x2: number,
      y2: number,
    ): SVGPathSegCurvetoCubicSmoothAbs;
    prototype: SVGPathSegCurvetoCubicSmoothAbs;
  };
  const SVGPathSegCurvetoCubicSmoothRel: {
    new (
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
      x2: number,
      y2: number,
    ): SVGPathSegCurvetoCubicSmoothRel;
    prototype: SVGPathSegCurvetoCubicSmoothRel;
  };
  const SVGPathSegCurvetoQuadraticSmoothAbs: {
    new (
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
    ): SVGPathSegCurvetoQuadraticSmoothAbs;
    prototype: SVGPathSegCurvetoQuadraticSmoothAbs;
  };
  const SVGPathSegCurvetoQuadraticSmoothRel: {
    new (
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
    ): SVGPathSegCurvetoQuadraticSmoothRel;
    prototype: SVGPathSegCurvetoQuadraticSmoothRel;
  };

  const SVGPathSegList: {
    new (pathElement: SVGPathElement): SVGPathSegList;
    prototype: SVGPathSegList;
  };

  interface Window {
    SVGPathSeg: typeof SVGPathSeg;
    SVGPathSegClosePath: typeof SVGPathSegClosePath;
    SVGPathSegMovetoAbs: typeof SVGPathSegMovetoAbs;
    SVGPathSegMovetoRel: typeof SVGPathSegMovetoRel;
    SVGPathSegLinetoAbs: typeof SVGPathSegLinetoAbs;
    SVGPathSegLinetoRel: typeof SVGPathSegLinetoRel;
    SVGPathSegCurvetoCubicAbs: typeof SVGPathSegCurvetoCubicAbs;
    SVGPathSegCurvetoCubicRel: typeof SVGPathSegCurvetoCubicRel;
    SVGPathSegCurvetoQuadraticAbs: typeof SVGPathSegCurvetoQuadraticAbs;
    SVGPathSegCurvetoQuadraticRel: typeof SVGPathSegCurvetoQuadraticRel;
    SVGPathSegArcAbs: typeof SVGPathSegArcAbs;
    SVGPathSegArcRel: typeof SVGPathSegArcRel;
    SVGPathSegLinetoHorizontalAbs: typeof SVGPathSegLinetoHorizontalAbs;
    SVGPathSegLinetoHorizontalRel: typeof SVGPathSegLinetoHorizontalRel;
    SVGPathSegLinetoVerticalAbs: typeof SVGPathSegLinetoVerticalAbs;
    SVGPathSegLinetoVerticalRel: typeof SVGPathSegLinetoVerticalRel;
    SVGPathSegCurvetoCubicSmoothAbs: typeof SVGPathSegCurvetoCubicSmoothAbs;
    SVGPathSegCurvetoCubicSmoothRel: typeof SVGPathSegCurvetoCubicSmoothRel;
    SVGPathSegCurvetoQuadraticSmoothAbs: typeof SVGPathSegCurvetoQuadraticSmoothAbs;
    SVGPathSegCurvetoQuadraticSmoothRel: typeof SVGPathSegCurvetoQuadraticSmoothRel;
    SVGPathSegList: typeof SVGPathSegList;
  }

  interface SVGPathElement {
    readonly pathSegList: SVGPathSegList;
    readonly normalizedPathSegList: SVGPathSegList;
    readonly animatedPathSegList: SVGPathSegList;
    readonly animatedNormalizedPathSegList: SVGPathSegList;

    createSVGPathSegClosePath(): SVGPathSegClosePath;
    createSVGPathSegMovetoAbs(x: number, y: number): SVGPathSegMovetoAbs;
    createSVGPathSegMovetoRel(x: number, y: number): SVGPathSegMovetoRel;
    createSVGPathSegLinetoAbs(x: number, y: number): SVGPathSegLinetoAbs;
    createSVGPathSegLinetoRel(x: number, y: number): SVGPathSegLinetoRel;
    createSVGPathSegCurvetoCubicAbs(
      x: number,
      y: number,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
    ): SVGPathSegCurvetoCubicAbs;
    createSVGPathSegCurvetoCubicRel(
      x: number,
      y: number,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
    ): SVGPathSegCurvetoCubicRel;
    createSVGPathSegCurvetoQuadraticAbs(
      x: number,
      y: number,
      x1: number,
      y1: number,
    ): SVGPathSegCurvetoQuadraticAbs;
    createSVGPathSegCurvetoQuadraticRel(
      x: number,
      y: number,
      x1: number,
      y1: number,
    ): SVGPathSegCurvetoQuadraticRel;
    createSVGPathSegArcAbs(
      x: number,
      y: number,
      r1: number,
      r2: number,
      angle: number,
      largeArcFlag: boolean,
      sweepFlag: boolean,
    ): SVGPathSegArcAbs;
    createSVGPathSegArcRel(
      x: number,
      y: number,
      r1: number,
      r2: number,
      angle: number,
      largeArcFlag: boolean,
      sweepFlag: boolean,
    ): SVGPathSegArcRel;
    createSVGPathSegLinetoHorizontalAbs(
      x: number,
    ): SVGPathSegLinetoHorizontalAbs;
    createSVGPathSegLinetoHorizontalRel(
      x: number,
    ): SVGPathSegLinetoHorizontalRel;
    createSVGPathSegLinetoVerticalAbs(y: number): SVGPathSegLinetoVerticalAbs;
    createSVGPathSegLinetoVerticalRel(y: number): SVGPathSegLinetoVerticalRel;
    createSVGPathSegCurvetoCubicSmoothAbs(
      x: number,
      y: number,
      x2: number,
      y2: number,
    ): SVGPathSegCurvetoCubicSmoothAbs;
    createSVGPathSegCurvetoCubicSmoothRel(
      x: number,
      y: number,
      x2: number,
      y2: number,
    ): SVGPathSegCurvetoCubicSmoothRel;
    createSVGPathSegCurvetoQuadraticSmoothAbs(
      x: number,
      y: number,
    ): SVGPathSegCurvetoQuadraticSmoothAbs;
    createSVGPathSegCurvetoQuadraticSmoothRel(
      x: number,
      y: number,
    ): SVGPathSegCurvetoQuadraticSmoothRel;
  }
}

if (!("SVGPathSeg" in window)) {
  class SVGPathSegImpl implements SVGPathSeg {
    public readonly pathSegType: number;
    public readonly pathSegTypeAsLetter: string;
    public _owningPathSegList: SVGPathSegList | null | undefined;

    constructor(
      type: number,
      typeAsLetter: string,
      owningPathSegList: SVGPathSegList | undefined,
    ) {
      this.pathSegType = type;
      this.pathSegTypeAsLetter = typeAsLetter;
      this._owningPathSegList = owningPathSegList;
    }

    _segmentChanged(): void {
      if (this._owningPathSegList) {
        this._owningPathSegList.segmentChanged(this as AnySVGPathSeg);
      }
    }

    _asPathString(): string {
      // This method should be overridden by subclasses
      return "";
    }

    clone(): SVGPathSeg {
      // This method should be overridden by subclasses
      throw new Error("Clone method not implemented.");
    }

    static PATHSEG_UNKNOWN = 0;
    static PATHSEG_CLOSEPATH = 1;
    static PATHSEG_MOVETO_ABS = 2;
    static PATHSEG_MOVETO_REL = 3;
    static PATHSEG_LINETO_ABS = 4;
    static PATHSEG_LINETO_REL = 5;
    static PATHSEG_CURVETO_CUBIC_ABS = 6;
    static PATHSEG_CURVETO_CUBIC_REL = 7;
    static PATHSEG_CURVETO_QUADRATIC_ABS = 8;
    static PATHSEG_CURVETO_QUADRATIC_REL = 9;
    static PATHSEG_ARC_ABS = 10;
    static PATHSEG_ARC_REL = 11;
    static PATHSEG_LINETO_HORIZONTAL_ABS = 12;
    static PATHSEG_LINETO_HORIZONTAL_REL = 13;
    static PATHSEG_LINETO_VERTICAL_ABS = 14;
    static PATHSEG_LINETO_VERTICAL_REL = 15;
    static PATHSEG_CURVETO_CUBIC_SMOOTH_ABS = 16;
    static PATHSEG_CURVETO_CUBIC_SMOOTH_REL = 17;
    static PATHSEG_CURVETO_QUADRATIC_SMOOTH_ABS = 18;
    static PATHSEG_CURVETO_QUADRATIC_SMOOTH_REL = 19;
  }
  (window as any).SVGPathSeg = SVGPathSegImpl;

  class SVGPathSegClosePathImpl
    extends SVGPathSegImpl
    implements SVGPathSegClosePath
  {
    constructor(owningPathSegList: SVGPathSegList | undefined) {
      super(SVGPathSegImpl.PATHSEG_CLOSEPATH, "z", owningPathSegList);
    }

    toString(): string {
      return "[object SVGPathSegClosePath]";
    }

    _asPathString(): string {
      return this.pathSegTypeAsLetter;
    }

    clone(): SVGPathSegClosePath {
      return new SVGPathSegClosePathImpl(undefined);
    }
  }
  (window as any).SVGPathSegClosePath = SVGPathSegClosePathImpl;

  abstract class SVGPathSegWithCoordinates extends SVGPathSegImpl {
    protected _x: number;
    protected _y: number;

    constructor(
      type: number,
      typeAsLetter: string,
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
    ) {
      super(type, typeAsLetter, owningPathSegList);
      this._x = x;
      this._y = y;
    }

    get x(): number {
      return this._x;
    }
    set x(value: number) {
      this._x = value;
      this._segmentChanged();
    }

    get y(): number {
      return this._y;
    }
    set y(value: number) {
      this._y = value;
      this._segmentChanged();
    }
  }

  class SVGPathSegMovetoAbsImpl
    extends SVGPathSegWithCoordinates
    implements SVGPathSegMovetoAbs
  {
    constructor(
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
    ) {
      super(SVGPathSegImpl.PATHSEG_MOVETO_ABS, "M", owningPathSegList, x, y);
    }

    toString(): string {
      return "[object SVGPathSegMovetoAbs]";
    }

    _asPathString(): string {
      return `${this.pathSegTypeAsLetter} ${this.x} ${this.y}`;
    }

    clone(): SVGPathSegMovetoAbs {
      return new SVGPathSegMovetoAbsImpl(undefined, this.x, this.y);
    }
  }
  (window as any).SVGPathSegMovetoAbs = SVGPathSegMovetoAbsImpl;

  class SVGPathSegMovetoRelImpl
    extends SVGPathSegWithCoordinates
    implements SVGPathSegMovetoRel
  {
    constructor(
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
    ) {
      super(SVGPathSegImpl.PATHSEG_MOVETO_REL, "m", owningPathSegList, x, y);
    }

    toString(): string {
      return "[object SVGPathSegMovetoRel]";
    }

    _asPathString(): string {
      return `${this.pathSegTypeAsLetter} ${this.x} ${this.y}`;
    }

    clone(): SVGPathSegMovetoRel {
      return new SVGPathSegMovetoRelImpl(undefined, this.x, this.y);
    }
  }
  (window as any).SVGPathSegMovetoRel = SVGPathSegMovetoRelImpl;

  class SVGPathSegLinetoAbsImpl
    extends SVGPathSegWithCoordinates
    implements SVGPathSegLinetoAbs
  {
    constructor(
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
    ) {
      super(SVGPathSegImpl.PATHSEG_LINETO_ABS, "L", owningPathSegList, x, y);
    }

    toString(): string {
      return "[object SVGPathSegLinetoAbs]";
    }

    _asPathString(): string {
      return `${this.pathSegTypeAsLetter} ${this.x} ${this.y}`;
    }

    clone(): SVGPathSegLinetoAbs {
      return new SVGPathSegLinetoAbsImpl(undefined, this.x, this.y);
    }
  }
  (window as any).SVGPathSegLinetoAbs = SVGPathSegLinetoAbsImpl;

  class SVGPathSegLinetoRelImpl
    extends SVGPathSegWithCoordinates
    implements SVGPathSegLinetoRel
  {
    constructor(
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
    ) {
      super(SVGPathSegImpl.PATHSEG_LINETO_REL, "l", owningPathSegList, x, y);
    }

    toString(): string {
      return "[object SVGPathSegLinetoRel]";
    }

    _asPathString(): string {
      return `${this.pathSegTypeAsLetter} ${this.x} ${this.y}`;
    }

    clone(): SVGPathSegLinetoRel {
      return new SVGPathSegLinetoRelImpl(undefined, this.x, this.y);
    }
  }
  (window as any).SVGPathSegLinetoRel = SVGPathSegLinetoRelImpl;

  abstract class SVGPathSegCurveCubicBase extends SVGPathSegWithCoordinates {
    protected _x1: number;
    protected _y1: number;
    protected _x2: number;
    protected _y2: number;

    constructor(
      type: number,
      typeAsLetter: string,
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
    ) {
      super(type, typeAsLetter, owningPathSegList, x, y);
      this._x1 = x1;
      this._y1 = y1;
      this._x2 = x2;
      this._y2 = y2;
    }

    get x1(): number {
      return this._x1;
    }
    set x1(value: number) {
      this._x1 = value;
      this._segmentChanged();
    }

    get y1(): number {
      return this._y1;
    }
    set y1(value: number) {
      this._y1 = value;
      this._segmentChanged();
    }

    get x2(): number {
      return this._x2;
    }
    set x2(value: number) {
      this._x2 = value;
      this._segmentChanged();
    }

    get y2(): number {
      return this._y2;
    }
    set y2(value: number) {
      this._y2 = value;
      this._segmentChanged();
    }

    _asPathString(): string {
      return `${this.pathSegTypeAsLetter} ${this._x1} ${this._y1}, ${this._x2} ${this._y2}, ${this.x} ${this.y}`;
    }
  }

  class SVGPathSegCurvetoCubicAbsImpl
    extends SVGPathSegCurveCubicBase
    implements SVGPathSegCurvetoCubicAbs
  {
    constructor(
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
    ) {
      super(
        SVGPathSegImpl.PATHSEG_CURVETO_CUBIC_ABS,
        "C",
        owningPathSegList,
        x,
        y,
        x1,
        y1,
        x2,
        y2,
      );
    }

    toString(): string {
      return "[object SVGPathSegCurvetoCubicAbs]";
    }

    clone(): SVGPathSegCurvetoCubicAbs {
      return new SVGPathSegCurvetoCubicAbsImpl(
        undefined,
        this.x,
        this.y,
        this.x1,
        this.y1,
        this.x2,
        this.y2,
      );
    }
  }
  (window as any).SVGPathSegCurvetoCubicAbs = SVGPathSegCurvetoCubicAbsImpl;

  class SVGPathSegCurvetoCubicRelImpl
    extends SVGPathSegCurveCubicBase
    implements SVGPathSegCurvetoCubicRel
  {
    constructor(
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
    ) {
      super(
        SVGPathSegImpl.PATHSEG_CURVETO_CUBIC_REL,
        "c",
        owningPathSegList,
        x,
        y,
        x1,
        y1,
        x2,
        y2,
      );
    }

    toString(): string {
      return "[object SVGPathSegCurvetoCubicRel]";
    }

    clone(): SVGPathSegCurvetoCubicRel {
      return new SVGPathSegCurvetoCubicRelImpl(
        undefined,
        this.x,
        this.y,
        this.x1,
        this.y1,
        this.x2,
        this.y2,
      );
    }
  }
  (window as any).SVGPathSegCurvetoCubicRel = SVGPathSegCurvetoCubicRelImpl;

  abstract class SVGPathSegCurveQuadraticBase extends SVGPathSegWithCoordinates {
    protected _x1: number;
    protected _y1: number;

    constructor(
      type: number,
      typeAsLetter: string,
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
      x1: number,
      y1: number,
    ) {
      super(type, typeAsLetter, owningPathSegList, x, y);
      this._x1 = x1;
      this._y1 = y1;
    }

    get x1(): number {
      return this._x1;
    }
    set x1(value: number) {
      this._x1 = value;
      this._segmentChanged();
    }

    get y1(): number {
      return this._y1;
    }
    set y1(value: number) {
      this._y1 = value;
      this._segmentChanged();
    }

    _asPathString(): string {
      return `${this.pathSegTypeAsLetter} ${this._x1} ${this._y1}, ${this.x} ${this.y}`;
    }
  }

  class SVGPathSegCurvetoQuadraticAbsImpl
    extends SVGPathSegCurveQuadraticBase
    implements SVGPathSegCurvetoQuadraticAbs
  {
    constructor(
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
      x1: number,
      y1: number,
    ) {
      super(
        SVGPathSegImpl.PATHSEG_CURVETO_QUADRATIC_ABS,
        "Q",
        owningPathSegList,
        x,
        y,
        x1,
        y1,
      );
    }

    toString(): string {
      return "[object SVGPathSegCurvetoQuadraticAbs]";
    }

    clone(): SVGPathSegCurvetoQuadraticAbs {
      return new SVGPathSegCurvetoQuadraticAbsImpl(
        undefined,
        this.x,
        this.y,
        this.x1,
        this.y1,
      );
    }
  }
  (window as any).SVGPathSegCurvetoQuadraticAbs =
    SVGPathSegCurvetoQuadraticAbsImpl;

  class SVGPathSegCurvetoQuadraticRelImpl
    extends SVGPathSegCurveQuadraticBase
    implements SVGPathSegCurvetoQuadraticRel
  {
    constructor(
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
      x1: number,
      y1: number,
    ) {
      super(
        SVGPathSegImpl.PATHSEG_CURVETO_QUADRATIC_REL,
        "q",
        owningPathSegList,
        x,
        y,
        x1,
        y1,
      );
    }

    toString(): string {
      return "[object SVGPathSegCurvetoQuadraticRel]";
    }

    clone(): SVGPathSegCurvetoQuadraticRel {
      return new SVGPathSegCurvetoQuadraticRelImpl(
        undefined,
        this.x,
        this.y,
        this.x1,
        this.y1,
      );
    }
  }
  (window as any).SVGPathSegCurvetoQuadraticRel =
    SVGPathSegCurvetoQuadraticRelImpl;

  abstract class SVGPathSegArcBase extends SVGPathSegWithCoordinates {
    protected _r1: number;
    protected _r2: number;
    protected _angle: number;
    protected _largeArcFlag: boolean;
    protected _sweepFlag: boolean;

    constructor(
      type: number,
      typeAsLetter: string,
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
      r1: number,
      r2: number,
      angle: number,
      largeArcFlag: boolean,
      sweepFlag: boolean,
    ) {
      super(type, typeAsLetter, owningPathSegList, x, y);
      this._r1 = r1;
      this._r2 = r2;
      this._angle = angle;
      this._largeArcFlag = largeArcFlag;
      this._sweepFlag = sweepFlag;
    }

    get r1(): number {
      return this._r1;
    }
    set r1(value: number) {
      this._r1 = value;
      this._segmentChanged();
    }

    get r2(): number {
      return this._r2;
    }
    set r2(value: number) {
      this._r2 = value;
      this._segmentChanged();
    }

    get angle(): number {
      return this._angle;
    }
    set angle(value: number) {
      this._angle = value;
      this._segmentChanged();
    }

    get largeArcFlag(): boolean {
      return this._largeArcFlag;
    }
    set largeArcFlag(value: boolean) {
      this._largeArcFlag = value;
      this._segmentChanged();
    }

    get sweepFlag(): boolean {
      return this._sweepFlag;
    }
    set sweepFlag(value: boolean) {
      this._sweepFlag = value;
      this._segmentChanged();
    }

    _asPathString(): string {
      return `${this.pathSegTypeAsLetter} ${this._r1} ${this._r2} ${this._angle} ${this._largeArcFlag ? "1" : "0"} ${this._sweepFlag ? "1" : "0"} ${this.x} ${this.y}`;
    }
  }

  class SVGPathSegArcAbsImpl
    extends SVGPathSegArcBase
    implements SVGPathSegArcAbs
  {
    constructor(
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
      r1: number,
      r2: number,
      angle: number,
      largeArcFlag: boolean,
      sweepFlag: boolean,
    ) {
      super(
        SVGPathSegImpl.PATHSEG_ARC_ABS,
        "A",
        owningPathSegList,
        x,
        y,
        r1,
        r2,
        angle,
        largeArcFlag,
        sweepFlag,
      );
    }

    toString(): string {
      return "[object SVGPathSegArcAbs]";
    }

    clone(): SVGPathSegArcAbs {
      return new SVGPathSegArcAbsImpl(
        undefined,
        this.x,
        this.y,
        this.r1,
        this.r2,
        this.angle,
        this.largeArcFlag,
        this.sweepFlag,
      );
    }
  }
  (window as any).SVGPathSegArcAbs = SVGPathSegArcAbsImpl;

  class SVGPathSegArcRelImpl
    extends SVGPathSegArcBase
    implements SVGPathSegArcRel
  {
    constructor(
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
      r1: number,
      r2: number,
      angle: number,
      largeArcFlag: boolean,
      sweepFlag: boolean,
    ) {
      super(
        SVGPathSegImpl.PATHSEG_ARC_REL,
        "a",
        owningPathSegList,
        x,
        y,
        r1,
        r2,
        angle,
        largeArcFlag,
        sweepFlag,
      );
    }

    toString(): string {
      return "[object SVGPathSegArcRel]";
    }

    clone(): SVGPathSegArcRel {
      return new SVGPathSegArcRelImpl(
        undefined,
        this.x,
        this.y,
        this.r1,
        this.r2,
        this.angle,
        this.largeArcFlag,
        this.sweepFlag,
      );
    }
  }
  (window as any).SVGPathSegArcRel = SVGPathSegArcRelImpl;

  class SVGPathSegLinetoHorizontalAbsImpl
    extends SVGPathSegImpl
    implements SVGPathSegLinetoHorizontalAbs
  {
    protected _x: number;

    constructor(owningPathSegList: SVGPathSegList | undefined, x: number) {
      super(
        SVGPathSegImpl.PATHSEG_LINETO_HORIZONTAL_ABS,
        "H",
        owningPathSegList,
      );
      this._x = x;
    }

    get x(): number {
      return this._x;
    }
    set x(value: number) {
      this._x = value;
      this._segmentChanged();
    }

    toString(): string {
      return "[object SVGPathSegLinetoHorizontalAbs]";
    }

    _asPathString(): string {
      return `${this.pathSegTypeAsLetter} ${this.x}`;
    }

    clone(): SVGPathSegLinetoHorizontalAbs {
      return new SVGPathSegLinetoHorizontalAbsImpl(undefined, this.x);
    }
  }
  (window as any).SVGPathSegLinetoHorizontalAbs =
    SVGPathSegLinetoHorizontalAbsImpl;

  class SVGPathSegLinetoHorizontalRelImpl
    extends SVGPathSegImpl
    implements SVGPathSegLinetoHorizontalRel
  {
    protected _x: number;

    constructor(owningPathSegList: SVGPathSegList | undefined, x: number) {
      super(
        SVGPathSegImpl.PATHSEG_LINETO_HORIZONTAL_REL,
        "h",
        owningPathSegList,
      );
      this._x = x;
    }

    get x(): number {
      return this._x;
    }
    set x(value: number) {
      this._x = value;
      this._segmentChanged();
    }

    toString(): string {
      return "[object SVGPathSegLinetoHorizontalRel]";
    }

    _asPathString(): string {
      return `${this.pathSegTypeAsLetter} ${this.x}`;
    }

    clone(): SVGPathSegLinetoHorizontalRel {
      return new SVGPathSegLinetoHorizontalRelImpl(undefined, this.x);
    }
  }
  (window as any).SVGPathSegLinetoHorizontalRel =
    SVGPathSegLinetoHorizontalRelImpl;

  class SVGPathSegLinetoVerticalAbsImpl
    extends SVGPathSegImpl
    implements SVGPathSegLinetoVerticalAbs
  {
    protected _y: number;

    constructor(owningPathSegList: SVGPathSegList | undefined, y: number) {
      super(SVGPathSegImpl.PATHSEG_LINETO_VERTICAL_ABS, "V", owningPathSegList);
      this._y = y;
    }

    get y(): number {
      return this._y;
    }
    set y(value: number) {
      this._y = value;
      this._segmentChanged();
    }

    toString(): string {
      return "[object SVGPathSegLinetoVerticalAbs]";
    }

    _asPathString(): string {
      return `${this.pathSegTypeAsLetter} ${this.y}`;
    }

    clone(): SVGPathSegLinetoVerticalAbs {
      return new SVGPathSegLinetoVerticalAbsImpl(undefined, this.y);
    }
  }
  (window as any).SVGPathSegLinetoVerticalAbs = SVGPathSegLinetoVerticalAbsImpl;

  class SVGPathSegLinetoVerticalRelImpl
    extends SVGPathSegImpl
    implements SVGPathSegLinetoVerticalRel
  {
    protected _y: number;

    constructor(owningPathSegList: SVGPathSegList | undefined, y: number) {
      super(SVGPathSegImpl.PATHSEG_LINETO_VERTICAL_REL, "v", owningPathSegList);
      this._y = y;
    }

    get y(): number {
      return this._y;
    }
    set y(value: number) {
      this._y = value;
      this._segmentChanged();
    }

    toString(): string {
      return "[object SVGPathSegLinetoVerticalRel]";
    }

    _asPathString(): string {
      return `${this.pathSegTypeAsLetter} ${this.y}`;
    }

    clone(): SVGPathSegLinetoVerticalRel {
      return new SVGPathSegLinetoVerticalRelImpl(undefined, this.y);
    }
  }
  (window as any).SVGPathSegLinetoVerticalRel = SVGPathSegLinetoVerticalRelImpl;

  abstract class SVGPathSegCurveCubicSmoothBase extends SVGPathSegWithCoordinates {
    protected _x2: number;
    protected _y2: number;

    constructor(
      type: number,
      typeAsLetter: string,
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
      x2: number,
      y2: number,
    ) {
      super(type, typeAsLetter, owningPathSegList, x, y);
      this._x2 = x2;
      this._y2 = y2;
    }

    get x2(): number {
      return this._x2;
    }
    set x2(value: number) {
      this._x2 = value;
      this._segmentChanged();
    }

    get y2(): number {
      return this._y2;
    }
    set y2(value: number) {
      this._y2 = value;
      this._segmentChanged();
    }

    _asPathString(): string {
      return `${this.pathSegTypeAsLetter} ${this._x2} ${this._y2}, ${this.x} ${this.y}`;
    }
  }

  class SVGPathSegCurvetoCubicSmoothAbsImpl
    extends SVGPathSegCurveCubicSmoothBase
    implements SVGPathSegCurvetoCubicSmoothAbs
  {
    constructor(
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
      x2: number,
      y2: number,
    ) {
      super(
        SVGPathSegImpl.PATHSEG_CURVETO_CUBIC_SMOOTH_ABS,
        "S",
        owningPathSegList,
        x,
        y,
        x2,
        y2,
      );
    }

    toString(): string {
      return "[object SVGPathSegCurvetoCubicSmoothAbs]";
    }

    clone(): SVGPathSegCurvetoCubicSmoothAbs {
      return new SVGPathSegCurvetoCubicSmoothAbsImpl(
        undefined,
        this.x,
        this.y,
        this.x2,
        this.y2,
      );
    }
  }
  (window as any).SVGPathSegCurvetoCubicSmoothAbs =
    SVGPathSegCurvetoCubicSmoothAbsImpl;

  class SVGPathSegCurvetoCubicSmoothRelImpl
    extends SVGPathSegCurveCubicSmoothBase
    implements SVGPathSegCurvetoCubicSmoothRel
  {
    constructor(
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
      x2: number,
      y2: number,
    ) {
      super(
        SVGPathSegImpl.PATHSEG_CURVETO_CUBIC_SMOOTH_REL,
        "s",
        owningPathSegList,
        x,
        y,
        x2,
        y2,
      );
    }

    toString(): string {
      return "[object SVGPathSegCurvetoCubicSmoothRel]";
    }

    clone(): SVGPathSegCurvetoCubicSmoothRel {
      return new SVGPathSegCurvetoCubicSmoothRelImpl(
        undefined,
        this.x,
        this.y,
        this.x2,
        this.y2,
      );
    }
  }
  (window as any).SVGPathSegCurvetoCubicSmoothRel =
    SVGPathSegCurvetoCubicSmoothRelImpl;

  class SVGPathSegCurvetoQuadraticSmoothAbsImpl
    extends SVGPathSegWithCoordinates
    implements SVGPathSegCurvetoQuadraticSmoothAbs
  {
    constructor(
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
    ) {
      super(
        SVGPathSegImpl.PATHSEG_CURVETO_QUADRATIC_SMOOTH_ABS,
        "T",
        owningPathSegList,
        x,
        y,
      );
    }

    toString(): string {
      return "[object SVGPathSegCurvetoQuadraticSmoothAbs]";
    }

    _asPathString(): string {
      return `${this.pathSegTypeAsLetter} ${this.x} ${this.y}`;
    }

    clone(): SVGPathSegCurvetoQuadraticSmoothAbs {
      return new SVGPathSegCurvetoQuadraticSmoothAbsImpl(
        undefined,
        this.x,
        this.y,
      );
    }
  }
  (window as any).SVGPathSegCurvetoQuadraticSmoothAbs =
    SVGPathSegCurvetoQuadraticSmoothAbsImpl;

  class SVGPathSegCurvetoQuadraticSmoothRelImpl
    extends SVGPathSegWithCoordinates
    implements SVGPathSegCurvetoQuadraticSmoothRel
  {
    constructor(
      owningPathSegList: SVGPathSegList | undefined,
      x: number,
      y: number,
    ) {
      super(
        SVGPathSegImpl.PATHSEG_CURVETO_QUADRATIC_SMOOTH_REL,
        "t",
        owningPathSegList,
        x,
        y,
      );
    }

    toString(): string {
      return "[object SVGPathSegCurvetoQuadraticSmoothRel]";
    }

    _asPathString(): string {
      return `${this.pathSegTypeAsLetter} ${this.x} ${this.y}`;
    }

    clone(): SVGPathSegCurvetoQuadraticSmoothRel {
      return new SVGPathSegCurvetoQuadraticSmoothRelImpl(
        undefined,
        this.x,
        this.y,
      );
    }
  }
  (window as any).SVGPathSegCurvetoQuadraticSmoothRel =
    SVGPathSegCurvetoQuadraticSmoothRelImpl;

  // SVGPathSegList
  class SVGPathSegListImpl implements SVGPathSegList {
    private _pathElement: SVGPathElement;
    private _list: AnySVGPathSeg[];
    private _mutationObserverConfig: MutationObserverInit;
    private _pathElementMutationObserver: MutationObserver;

    constructor(pathElement: SVGPathElement) {
      this._pathElement = pathElement;
      this._list = []; // Initialize _list to an empty array here

      this._mutationObserverConfig = {
        attributes: true,
        attributeFilter: ["d"],
      };
      this._pathElementMutationObserver = new MutationObserver(
        this._onPathElementDAttributeChanged.bind(this),
      );

      // _parsePath will return a new array of segments.
      // If _writeListToPathElementDAttribute is called during _parsePath,
      // this._list will be [], preventing the .map error.
      const parsedSegments = this._parsePath(
        this._pathElement.getAttribute("d") || "",
      );
      this._list = parsedSegments; // Assign the fully parsed list

      this._pathElementMutationObserver.observe(
        this._pathElement,
        this._mutationObserverConfig,
      );
    }

    private _onPathElementDAttributeChanged(
      mutationsList: MutationRecord[],
    ): void {
      if (!mutationsList.length) return;

      // Reparse the path string if it's changed by something else.
      this._list = this._parsePath(this._pathElement.getAttribute("d") || "");
    }

    private _writeListToPathElementDAttribute(): void {
      this._pathElementMutationObserver.disconnect();
      this._pathElement.setAttribute(
        "d",
        this._list.map((seg) => seg._asPathString()).join(" "),
      );
      this._pathElementMutationObserver.observe(
        this._pathElement,
        this._mutationObserverConfig,
      );
    }

    get numberOfItems(): number {
      return this._list.length;
    }

    clear(): void {
      this._list.forEach(
        (seg) => ((seg as SVGPathSegImpl)._owningPathSegList = undefined),
      );
      this._list = [];
      this._writeListToPathElementDAttribute();
    }

    initialize(newItem: AnySVGPathSeg): AnySVGPathSeg {
      this.clear();
      (newItem as SVGPathSegImpl)._owningPathSegList = this;
      this._list.push(newItem);
      this._writeListToPathElementDAttribute();
      return newItem;
    }

    getItem(index: number): AnySVGPathSeg {
      if (index < 0 || index >= this.numberOfItems) {
        throw new DOMException(
          "IndexSizeError: The index provided is outside the allowed range.",
        );
      }
      return this._list[index];
    }

    insertItemBefore(newItem: AnySVGPathSeg, index: number): AnySVGPathSeg {
      if (index < 0) index = 0; // Per spec
      if (index > this.numberOfItems) index = this.numberOfItems; // Per spec

      (newItem as SVGPathSegImpl)._owningPathSegList = this;
      this._list.splice(index, 0, newItem);
      this._writeListToPathElementDAttribute();
      return newItem;
    }

    replaceItem(newItem: AnySVGPathSeg, index: number): AnySVGPathSeg {
      if (index < 0 || index >= this.numberOfItems) {
        throw new DOMException(
          "IndexSizeError: The index provided is outside the allowed range.",
        );
      }
      const oldItem = this._list[index];
      (oldItem as SVGPathSegImpl)._owningPathSegList = undefined;
      (newItem as SVGPathSegImpl)._owningPathSegList = this;
      this._list[index] = newItem;
      this._writeListToPathElementDAttribute();
      return newItem;
    }

    removeItem(index: number): AnySVGPathSeg {
      if (index < 0 || index >= this.numberOfItems) {
        throw new DOMException(
          "IndexSizeError: The index provided is outside the allowed range.",
        );
      }
      const item = this._list[index];
      (item as SVGPathSegImpl)._owningPathSegList = undefined;
      this._list.splice(index, 1);
      this._writeListToPathElementDAttribute();
      return item;
    }

    appendItem(newItem: AnySVGPathSeg): AnySVGPathSeg {
      (newItem as SVGPathSegImpl)._owningPathSegList = this;
      this._list.push(newItem);
      this._writeListToPathElementDAttribute();
      return newItem;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    segmentChanged(_pathSeg: AnySVGPathSeg): void {
      this._writeListToPathElementDAttribute();
    }

    // Based on https://github.com/jkroso/parse-svg-path
    private _parsePath(path: string): AnySVGPathSeg[] {
      const list: AnySVGPathSeg[] = [];
      if (!path || path.length === 0) return list;

      let currentSegmentConstructor: any = null;
      let currentX = 0;
      let currentY = 0;

      function createSegment(this: SVGPathSegListImpl, ...args: any[]) {
        const seg = new currentSegmentConstructor(undefined, ...args);
        seg._owningPathSegList = this; // Set owning list for new segments
        list.push(seg);

        // Update current position based on segment type
        const type = seg.pathSegTypeAsLetter.toUpperCase();
        const isRelative =
          seg.pathSegTypeAsLetter === seg.pathSegTypeAsLetter.toLowerCase();

        let newX = currentX;
        let newY = currentY;

        if (type === "M" || type === "L" || type === "T") {
          newX = (
            seg as
              | SVGPathSegMovetoAbs
              | SVGPathSegLinetoAbs
              | SVGPathSegCurvetoQuadraticSmoothAbs
          ).x;
          newY = (
            seg as
              | SVGPathSegMovetoAbs
              | SVGPathSegLinetoAbs
              | SVGPathSegCurvetoQuadraticSmoothAbs
          ).y;
        } else if (type === "H") {
          newX = (seg as SVGPathSegLinetoHorizontalAbs).x;
        } else if (type === "V") {
          newY = (seg as SVGPathSegLinetoVerticalAbs).y;
        } else if (type === "C") {
          newX = (seg as SVGPathSegCurvetoCubicAbs).x;
          newY = (seg as SVGPathSegCurvetoCubicAbs).y;
        } else if (type === "S") {
          newX = (seg as SVGPathSegCurvetoCubicSmoothAbs).x;
          newY = (seg as SVGPathSegCurvetoCubicSmoothAbs).y;
        } else if (type === "Q") {
          newX = (seg as SVGPathSegCurvetoQuadraticAbs).x;
          newY = (seg as SVGPathSegCurvetoQuadraticAbs).y;
        } else if (type === "A") {
          newX = (seg as SVGPathSegArcAbs).x;
          newY = (seg as SVGPathSegArcAbs).y;
        }

        if (isRelative && type !== "Z") {
          currentX += newX;
          currentY += newY;
          if (type === "C") {
            (seg as SVGPathSegCurvetoCubicRel).x1 += currentX - newX;
            (seg as SVGPathSegCurvetoCubicRel).y1 += currentY - newY;
            (seg as SVGPathSegCurvetoCubicRel).x2 += currentX - newX;
            (seg as SVGPathSegCurvetoCubicRel).y2 += currentY - newY;
          } else if (type === "S") {
            // For relative 's', x2 and y2 are relative to the previous current point
            (seg as SVGPathSegCurvetoCubicSmoothRel).x2 += currentX - newX;
            (seg as SVGPathSegCurvetoCubicSmoothRel).y2 += currentY - newY;
          } else if (type === "Q") {
            (seg as SVGPathSegCurvetoQuadraticRel).x1 += currentX - newX;
            (seg as SVGPathSegCurvetoQuadraticRel).y1 += currentY - newY;
          }
        } else if (type !== "Z") {
          currentX = newX;
          currentY = newY;
        }
      }

      const commandRegExp =
        /([astvzqmhlcASTVZQMHLC])([^astvzqmhlcASTVZQMHLC]*)/g;
      let match;
      commandRegExp.lastIndex = 0; // Reset lastIndex for repeated use

      while ((match = commandRegExp.exec(path)) !== null) {
        const command = match[1];
        const paramsString = match[2].trim();
        const params = paramsString
          ? (paramsString.match(/-?\d*\.?\d*(?:[eE][+-]?\d+)?/gi) || []) // Updated regex
              .map(parseFloat)
              .filter((p) => !isNaN(p))
          : [];

        const relative = command === command.toLowerCase();

        switch (command.toUpperCase()) {
          case "M":
            currentSegmentConstructor = relative
              ? SVGPathSegMovetoRelImpl
              : SVGPathSegMovetoAbsImpl;
            createSegment.call(this, params[0], params[1]);
            // For subsequent coordinate pairs of M/m, they are treated as L/l
            currentSegmentConstructor = relative
              ? SVGPathSegLinetoRelImpl
              : SVGPathSegLinetoAbsImpl;
            for (let i = 2; i < params.length; i += 2) {
              createSegment.call(this, params[i], params[i + 1]);
            }
            break;
          case "L":
            currentSegmentConstructor = relative
              ? SVGPathSegLinetoRelImpl
              : SVGPathSegLinetoAbsImpl;
            for (let i = 0; i < params.length; i += 2) {
              createSegment.call(this, params[i], params[i + 1]);
            }
            break;
          case "H":
            currentSegmentConstructor = relative
              ? SVGPathSegLinetoHorizontalRelImpl
              : SVGPathSegLinetoHorizontalAbsImpl;
            for (let i = 0; i < params.length; i++) {
              createSegment.call(this, params[i]);
            }
            break;
          case "V":
            currentSegmentConstructor = relative
              ? SVGPathSegLinetoVerticalRelImpl
              : SVGPathSegLinetoVerticalAbsImpl;
            for (let i = 0; i < params.length; i++) {
              createSegment.call(this, params[i]);
            }
            break;
          case "C":
            currentSegmentConstructor = relative
              ? SVGPathSegCurvetoCubicRelImpl
              : SVGPathSegCurvetoCubicAbsImpl;
            for (let i = 0; i < params.length; i += 6) {
              createSegment.call(
                this,
                params[i + 4],
                params[i + 5],
                params[i],
                params[i + 1],
                params[i + 2],
                params[i + 3],
              );
            }
            break;
          case "S":
            currentSegmentConstructor = relative
              ? SVGPathSegCurvetoCubicSmoothRelImpl
              : SVGPathSegCurvetoCubicSmoothAbsImpl;
            for (let i = 0; i < params.length; i += 4) {
              createSegment.call(
                this,
                params[i + 2],
                params[i + 3],
                params[i],
                params[i + 1],
              );
            }
            break;
          case "Q":
            currentSegmentConstructor = relative
              ? SVGPathSegCurvetoQuadraticRelImpl
              : SVGPathSegCurvetoQuadraticAbsImpl;
            for (let i = 0; i < params.length; i += 4) {
              createSegment.call(
                this,
                params[i + 2],
                params[i + 3],
                params[i],
                params[i + 1],
              );
            }
            break;
          case "T":
            currentSegmentConstructor = relative
              ? SVGPathSegCurvetoQuadraticSmoothRelImpl
              : SVGPathSegCurvetoQuadraticSmoothAbsImpl;
            for (let i = 0; i < params.length; i += 2) {
              createSegment.call(this, params[i], params[i + 1]);
            }
            break;
          case "A":
            currentSegmentConstructor = relative
              ? SVGPathSegArcRelImpl
              : SVGPathSegArcAbsImpl;
            for (let i = 0; i < params.length; i += 7) {
              createSegment.call(
                this,
                params[i + 5],
                params[i + 6],
                params[i],
                params[i + 1],
                params[i + 2],
                params[i + 3] === 1,
                params[i + 4] === 1,
              );
            }
            break;
          case "Z":
            currentSegmentConstructor = SVGPathSegClosePathImpl;
            createSegment.call(this);
            break;
          default:
            console.warn("Unknown path command:", command);
        }
      }
      return list;
    }
  }
  (window as any).SVGPathSegList = SVGPathSegListImpl;

  // Add the pathSegList property to SVGPathElement instances
  // Use a WeakMap to store the SVGPathSegList instances for each SVGPathElement
  const pathSegListMap = new WeakMap<SVGPathElement, SVGPathSegListImpl>();

  Object.defineProperty(SVGPathElement.prototype, "pathSegList", {
    get: function () {
      let list = pathSegListMap.get(this);
      if (!list) {
        list = new SVGPathSegListImpl(this);
        pathSegListMap.set(this, list);
      }
      return list;
    },
    enumerable: true,
    configurable: true,
  });

  // The 'normalizedPathSegList' and 'animatedPathSegList' are more complex
  // and involve path normalization and animation handling, which is beyond
  // the scope of a simple polyfill aiming to restore basic 'pathSegList' functionality.
  // For now, we can make them return the same as pathSegList or throw.
  Object.defineProperty(SVGPathElement.prototype, "normalizedPathSegList", {
    get: function () {
      // For simplicity, returning the same as pathSegList.
      // A true normalization would convert all segments to absolute and C/L type.
      console.warn(
        "normalizedPathSegList is not fully implemented and returns non-normalized pathSegList.",
      );
      return this.pathSegList;
    },
    enumerable: true,
    configurable: true,
  });

  Object.defineProperty(SVGPathElement.prototype, "animatedPathSegList", {
    get: function () {
      // Animations are not handled by this polyfill.
      console.warn(
        "animatedPathSegList is not implemented and returns pathSegList.",
      );
      return this.pathSegList;
    },
    enumerable: true,
    configurable: true,
  });
  Object.defineProperty(
    SVGPathElement.prototype,
    "animatedNormalizedPathSegList",
    {
      get: function () {
        console.warn(
          "animatedNormalizedPathSegList is not implemented and returns non-normalized pathSegList.",
        );
        return this.pathSegList; // Or normalizedPathSegList if that was more complete
      },
      enumerable: true,
      configurable: true,
    },
  );

  // Add createSVGPathSeg* methods to SVGPathElement
  SVGPathElement.prototype.createSVGPathSegClosePath = function () {
    return new SVGPathSegClosePathImpl(undefined);
  };
  SVGPathElement.prototype.createSVGPathSegMovetoAbs = function (x, y) {
    return new SVGPathSegMovetoAbsImpl(undefined, x, y);
  };
  SVGPathElement.prototype.createSVGPathSegMovetoRel = function (x, y) {
    return new SVGPathSegMovetoRelImpl(undefined, x, y);
  };
  SVGPathElement.prototype.createSVGPathSegLinetoAbs = function (x, y) {
    return new SVGPathSegLinetoAbsImpl(undefined, x, y);
  };
  SVGPathElement.prototype.createSVGPathSegLinetoRel = function (x, y) {
    return new SVGPathSegLinetoRelImpl(undefined, x, y);
  };
  SVGPathElement.prototype.createSVGPathSegCurvetoCubicAbs = function (
    x,
    y,
    x1,
    y1,
    x2,
    y2,
  ) {
    return new SVGPathSegCurvetoCubicAbsImpl(undefined, x, y, x1, y1, x2, y2);
  };
  SVGPathElement.prototype.createSVGPathSegCurvetoCubicRel = function (
    x,
    y,
    x1,
    y1,
    x2,
    y2,
  ) {
    return new SVGPathSegCurvetoCubicRelImpl(undefined, x, y, x1, y1, x2, y2);
  };
  SVGPathElement.prototype.createSVGPathSegCurvetoQuadraticAbs = function (
    x,
    y,
    x1,
    y1,
  ) {
    return new SVGPathSegCurvetoQuadraticAbsImpl(undefined, x, y, x1, y1);
  };
  SVGPathElement.prototype.createSVGPathSegCurvetoQuadraticRel = function (
    x,
    y,
    x1,
    y1,
  ) {
    return new SVGPathSegCurvetoQuadraticRelImpl(undefined, x, y, x1, y1);
  };
  SVGPathElement.prototype.createSVGPathSegArcAbs = function (
    x,
    y,
    r1,
    r2,
    angle,
    largeArcFlag,
    sweepFlag,
  ) {
    return new SVGPathSegArcAbsImpl(
      undefined,
      x,
      y,
      r1,
      r2,
      angle,
      largeArcFlag,
      sweepFlag,
    );
  };
  SVGPathElement.prototype.createSVGPathSegArcRel = function (
    x,
    y,
    r1,
    r2,
    angle,
    largeArcFlag,
    sweepFlag,
  ) {
    return new SVGPathSegArcRelImpl(
      undefined,
      x,
      y,
      r1,
      r2,
      angle,
      largeArcFlag,
      sweepFlag,
    );
  };
  SVGPathElement.prototype.createSVGPathSegLinetoHorizontalAbs = function (x) {
    return new SVGPathSegLinetoHorizontalAbsImpl(undefined, x);
  };
  SVGPathElement.prototype.createSVGPathSegLinetoHorizontalRel = function (x) {
    return new SVGPathSegLinetoHorizontalRelImpl(undefined, x);
  };
  SVGPathElement.prototype.createSVGPathSegLinetoVerticalAbs = function (y) {
    return new SVGPathSegLinetoVerticalAbsImpl(undefined, y);
  };
  SVGPathElement.prototype.createSVGPathSegLinetoVerticalRel = function (y) {
    return new SVGPathSegLinetoVerticalRelImpl(undefined, y);
  };
  SVGPathElement.prototype.createSVGPathSegCurvetoCubicSmoothAbs = function (
    x,
    y,
    x2,
    y2,
  ) {
    return new SVGPathSegCurvetoCubicSmoothAbsImpl(undefined, x, y, x2, y2);
  };
  SVGPathElement.prototype.createSVGPathSegCurvetoCubicSmoothRel = function (
    x,
    y,
    x2,
    y2,
  ) {
    return new SVGPathSegCurvetoCubicSmoothRelImpl(undefined, x, y, x2, y2);
  };
  SVGPathElement.prototype.createSVGPathSegCurvetoQuadraticSmoothAbs =
    function (x, y) {
      return new SVGPathSegCurvetoQuadraticSmoothAbsImpl(undefined, x, y);
    };
  SVGPathElement.prototype.createSVGPathSegCurvetoQuadraticSmoothRel =
    function (x, y) {
      return new SVGPathSegCurvetoQuadraticSmoothRelImpl(undefined, x, y);
    };
}
