const isNode: boolean = typeof module !== "undefined" && module.exports;

if (isNode) {
  process.once("message", function (code: any) {
    eval(JSON.parse(code).data);
  });
} else {
  self.onmessage = function (code: MessageEvent) {
    eval(code.data);
  };
}
