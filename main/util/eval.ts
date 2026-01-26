/**
 * Entry point for Web Worker evaluation.
 *
 * This module is loaded by the Parallel library to execute code in web workers.
 * It sets up message handlers to receive and evaluate code in a worker context.
 *
 * Environment Detection:
 * - Node.js: Uses process.once to receive and evaluate code messages
 * - Browser: Uses self.onmessage to receive and evaluate code messages
 *
 * @fileoverview Worker entry point for parallel processing
 * @module eval
 */

const isNode: boolean = typeof module !== "undefined" && module.exports;

if (isNode) {
  /**
   * Node.js worker message handler.
   * Receives a code message via process, parses it, and evaluates the code.
   * @param code - Message containing data to parse and evaluate
   * @sideEffect Evaluates arbitrary code in worker context
   */
  process.once("message", function (code: any) {
    eval(JSON.parse(code).data);
  });
} else {
  /**
   * Browser worker message handler.
   * Receives a code message via postMessage and evaluates the code.
   * @param code - MessageEvent containing code data to evaluate
   * @sideEffect Evaluates arbitrary code in worker context
   */
  self.onmessage = function (code: MessageEvent) {
    eval(code.data);
  };
}
