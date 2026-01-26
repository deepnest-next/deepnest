/**
 * DOMParser polyfill for text/html parsing.
 *
 * This module enhances the native DOMParser to support text/html parsing
 * in browsers that don't natively support it (particularly older WebKit browsers).
 *
 * Inspired by: https://gist.github.com/1129031
 *
 * Implementation:
 * - Checks if text/html parsing is natively supported
 * - Falls back to createHTMLDocument for browsers without support
 * - Handles DOCTYPE declarations correctly by setting innerHTML on documentElement
 * - Falls back to native parseFromString for non-HTML types
 *
 * @fileoverview DOMParser enhancement for HTML parsing
 * @module domparser
 */

// inspired by https://gist.github.com/1129031
// global document, DOMParser

(() => {
  const proto = DOMParser.prototype;
  const nativeParse = proto.parseFromString;

  try {
    // WebKit returns null on unsupported types
    if (new DOMParser().parseFromString("", "text/html")) {
      // text/html parsing is natively supported
      return;
    }
  } catch (ex) {
    // Fallback for unsupported types
  }

  /**
   * Enhanced parseFromString method that supports text/html parsing.
   * Overrides the native DOMParser.parseFromString method to add HTML support.
   *
   * @param markup - The markup string to parse
   * @param type - The MIME type of the markup
   * @returns Parsed Document object
   * @sideEffect Overrides prototype method (affects all DOMParser instances)
   */
  proto.parseFromString = function (
    markup: string,
    type: DOMParserSupportedType,
  ): Document {
    if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
      const doc = document.implementation.createHTMLDocument("");

      if (markup.toLowerCase().includes("<!doctype")) {
        // Handle DOCTYPE by setting innerHTML on documentElement
        doc.documentElement.innerHTML = markup;
      } else {
        // No DOCTYPE, set innerHTML on body
        doc.body.innerHTML = markup;
      }

      return doc;
    }

    // Use native parsing for non-HTML types
    return nativeParse.apply(this, arguments as any);
  };
})();
