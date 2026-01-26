import { BackgroundContext, type IpcRenderer } from "./context/index.js";
import { placeParts } from "./placement/index.js";
import { createNfpWorker, process, type NFPPair } from "./worker/index.js";
import { getInnerNfp } from "./nfp/index.js";
import { rotatePolygon } from "./geometry/index.js";
import { NfpCache, type NfpDoc } from "../nfpDb.js";
import type { Polygon, NestConfig, PlacementResult } from "./types/index.js";

declare const require: (module: string) => any;
declare const GeometryUtil: {
  getPolygonBounds: (polygon: Polygon) => { width: number; height: number };
};

interface BackgroundStartData {
  index: number;
  individual: {
    placement: Polygon[];
    rotation: number[];
  };
  ids: string[];
  sources: string[];
  children: Polygon[][];
  filenames: string[];
  sheets: Polygon[];
  sheetids: number[];
  sheetsources: string[];
  sheetchildren: Polygon[][];
  config: NestConfig;
}

interface NFPPairKey {
  A: Polygon;
  B: Polygon;
  Arotation: number;
  Brotation: number;
  Asource: string;
  Bsource: string;
}

window.onload = function () {
  const { ipcRenderer } = require("electron") as { ipcRenderer: IpcRenderer };
  const addon = require("@deepnest/calculate-nfp");
  const path = require("path");
  const url = require("url");
  const fs = require("graceful-fs");
  const db = new NfpCache();

  BackgroundContext.getInstance().initialize({
    ipcRenderer,
    addon,
    db,
    path,
    url,
    fs,
  });

  (window as any).ipcRenderer = ipcRenderer;
  (window as any).addon = addon;
  (window as any).db = db;
  (window as any).path = path;
  (window as any).url = url;
  (window as any).fs = fs;

  ipcRenderer.on("background-start", (_event: unknown, ...args: unknown[]) => {
    const data = args[0] as BackgroundStartData;
    const index = data.index;
    const individual = data.individual;

    const parts = individual.placement;
    const rotations = individual.rotation;
    const ids = data.ids;
    const sources = data.sources;
    const children = data.children;
    const filenames = data.filenames;

    for (let i = 0; i < parts.length; i++) {
      parts[i].rotation = rotations[i];
      parts[i].id = ids[i];
      parts[i].source = sources[i];
      parts[i].filename = filenames[i];
      if (!data.config.simplify) {
        parts[i].children = children[i];
      }
    }

    const _sheets: Polygon[] = JSON.parse(JSON.stringify(data.sheets));
    for (let i = 0; i < data.sheets.length; i++) {
      _sheets[i].id = String(data.sheetids[i]);
      _sheets[i].source = data.sheetsources[i];
      _sheets[i].children = data.sheetchildren[i];
    }
    data.sheets = _sheets;

    const pairs: NFPPairKey[] = [];

    // MUST stay nested - captures closure variable `pairs`
    const inpairs = function (key: NFPPairKey, p: NFPPairKey[]): boolean {
      for (let i = 0; i < p.length; i++) {
        if (
          p[i].Asource === key.Asource &&
          p[i].Bsource === key.Bsource &&
          p[i].Arotation === key.Arotation &&
          p[i].Brotation === key.Brotation
        ) {
          return true;
        }
      }
      return false;
    };

    for (let i = 0; i < parts.length; i++) {
      const B = parts[i];
      for (let j = 0; j < i; j++) {
        const A = parts[j];
        const key: NFPPairKey = {
          A: A,
          B: B,
          Arotation: A.rotation!,
          Brotation: B.rotation!,
          Asource: A.source!,
          Bsource: B.source!,
        };
        const doc: NfpDoc = {
          A: A.source!,
          B: B.source!,
          Arotation: A.rotation!,
          Brotation: B.rotation!,
          nfp: [] as any,
        };
        if (!inpairs(key, pairs) && !db.has(doc)) {
          pairs.push(key);
        }
      }
    }

    // MUST stay nested - captures closure variables: data, parts, index
    function sync(): void {
      (window as any).db.getStats();
      ipcRenderer.send("test", [data.sheets, parts, data.config, index]);

      const placement = placeParts(data.sheets, parts, data.config, index);

      if (placement) {
        (placement as PlacementResult & { index?: number }).index = data.index;
        ipcRenderer.send("background-response", placement);
      }
    }

    if (pairs.length > 0) {
      const p = createNfpWorker(pairs as unknown as NFPPair[], {
        nestindex: index,
      });

      p.map(process).then(function (processed: NFPPair[]) {
        function getPart(source: number | string): Polygon | null {
          for (let k = 0; k < parts.length; k++) {
            if (parts[k].source === source) {
              return parts[k];
            }
          }
          return null;
        }

        // Inner NFPs for holes must be calculated here (not in worker) because
        // the C++ addon cannot run in web worker threads
        for (let i = 0; i < processed.length; i++) {
          const A = getPart(processed[i].Asource);
          const B = getPart(processed[i].Bsource);

          const Achildren: Polygon[] = [];

          if (A && A.children) {
            for (let j = 0; j < A.children.length; j++) {
              Achildren.push(
                rotatePolygon(A.children[j], processed[i].Arotation),
              );
            }
          }

          if (Achildren.length > 0 && B) {
            const Brotated = rotatePolygon(B, processed[i].Brotation);
            const bbounds = GeometryUtil.getPolygonBounds(Brotated);
            let cnfp: Polygon[] = [];

            for (let j = 0; j < Achildren.length; j++) {
              const cbounds = GeometryUtil.getPolygonBounds(Achildren[j]);
              if (
                cbounds.width > bbounds.width &&
                cbounds.height > bbounds.height
              ) {
                const n = getInnerNfp(Achildren[j], Brotated, data.config);
                if (n && n.length > 0) {
                  cnfp = cnfp.concat(n);
                }
              }
            }

            (processed[i].nfp as any).children = cnfp;
          }

          const doc: NfpDoc = {
            A: String(processed[i].Asource),
            B: String(processed[i].Bsource),
            Arotation: processed[i].Arotation,
            Brotation: processed[i].Brotation,
            nfp: processed[i].nfp as any,
          };
          (window as any).db.insert(doc);
        }

        sync();
      });
    } else {
      sync();
    }
  });
};
