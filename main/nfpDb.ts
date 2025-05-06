import { Point } from "./util/point.js";

type Nfp = Point[] & { children?: Point[][] };

export interface NfpDoc {
  A: string;
  B: string;
  Arotation: number | string;
  Brotation: number | string;
  Aflipped?: boolean;
  Bflipped?: boolean;
  nfp: Nfp | Nfp[];
}

export class NfpCache {
  private db: Record<string, Nfp | Nfp[]> = {};

  private clone(nfp: Nfp): Nfp {
    const newnfp: Nfp = nfp.map(p => new Point(p.x, p.y));
    if (nfp.children && nfp.children.length > 0) {
      newnfp.children = nfp.children.map(child =>
        child.map(p => new Point(p.x, p.y))
      );
    }
    return newnfp;
  }

  private cloneNfp(nfp: Nfp | Nfp[], inner?: boolean): Nfp | Nfp[] {
    if (!inner) {
      return this.clone(nfp as Nfp);
    }
    return (nfp as Nfp[]).map(n => this.clone(n));
  }

  private makeKey(doc: NfpDoc, _inner?: boolean): string {
    const Arotation = parseInt(doc.Arotation as string);
    const Brotation = parseInt(doc.Brotation as string);
    const Aflipped = doc.Aflipped ? '1' : '0';
    const Bflipped = doc.Bflipped ? '1' : '0';
    return `${doc.A}-${doc.B}-${Arotation}-${Brotation}-${Aflipped}-${Bflipped}`;
  }

  has(obj: NfpDoc): boolean {
    const key = this.makeKey(obj);
    return key in this.db;
  }

  find(obj: NfpDoc, inner?: boolean): Nfp | Nfp[] | null {
    const key = this.makeKey(obj, inner);
    if (this.db[key]) {
      return this.cloneNfp(this.db[key], inner);
    }
    return null;
  }

  insert(obj: NfpDoc, inner?: boolean): void {
    const key = this.makeKey(obj, inner);
    this.db[key] = this.cloneNfp(obj.nfp, inner);
  }

  getCache(): Record<string, Nfp | Nfp[]> {
    return this.db;
  }

  getStats(): number {
    return Object.keys(this.db).length;
  }
}
