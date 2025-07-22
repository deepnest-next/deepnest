// geometryutil.umd.ts - UMD wrapper for geometryutil
// This file provides a UMD wrapper around the GeometryUtil module to make it work in both
// module environments and in non-module environments like worker contexts

// Add TypeScript declarations for UMD modules
declare const define: {
    (deps: string[], factory: (...args: any[]) => any): void;
    amd: boolean;
};
declare const module: {
    exports: any;
};

import * as GeometryUtilModule from './geometryutil.js';

// Create a UMD module
(function (root: any, factory: () => any) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.GeometryUtil = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    // Return the entire GeometryUtilModule as GeometryUtil global
    return GeometryUtilModule;
}));

// Export the module contents for direct imports
export * from './geometryutil.js';
