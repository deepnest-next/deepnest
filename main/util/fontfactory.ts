import { existsSync } from "fs";
import { loadSync } from "opentype.js";

export class FontFactory {
    constructor() {
    }

    get(name: String) : opentype.Font {
        // TODO only works on Macs, presumably
        for (const d of ["/System/Library/Fonts/", "/System/Library/Fonts/Supplemental/"]) {
            for (const e of ["ttf", "ttc"]) {
                const path = d + name + "." + e;
                console.log("Looking for " + path);
                if (existsSync(path)) {
                    return loadSync(path);
                }
            }
        }
        throw new Error("Asked for " + name);
    }
}