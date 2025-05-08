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

  proto.parseFromString = function (
    markup: string,
    type: DOMParserSupportedType,
  ): Document {
    if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
      const doc = document.implementation.createHTMLDocument("");

      if (markup.toLowerCase().includes("<!doctype")) {
        doc.documentElement.innerHTML = markup;
      } else {
        doc.body.innerHTML = markup;
      }

      return doc;
    }

    return nativeParse.apply(this, arguments as any);
  };
})();
