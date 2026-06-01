/**
 * Safe JSON stringify helper to robustly serialize structures with circular
 * references, DOM/HTMLElement objects, Web API File/Blob blocks, and custom exceptions.
 */
export function safeJsonStringify(obj: any): string {
  try {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      try {
        if (value && typeof value === "object") {
          if (seen.has(value)) {
            return undefined;
          }
          seen.add(value);

          // Safe check for DOM Nodes and document elements
          if (
            ("nodeType" in value) ||
            (value.nodeName !== undefined) ||
            (value.constructor && (
              value.constructor.name === "HTMLElement" ||
              value.constructor.name.includes("HTML") ||
              value.constructor.name === "Window" ||
              value.constructor.name === "Document"
            ))
          ) {
            return undefined;
          }

          // Safe check for file streams, binary assets, and original Event triggers
          if (
            value instanceof File ||
            value instanceof Blob ||
            ("size" in value && "type" in value && typeof value.slice === "function") ||
            (value.constructor && (
              value.constructor.name === "File" ||
              value.constructor.name === "Blob" ||
              value.constructor.name.includes("Event")
            ))
          ) {
            return undefined;
          }
        }
        if (typeof value === "function") {
          return undefined;
        }
        return value;
      } catch (innerErr) {
        return undefined;
      }
    });
  } catch (err) {
    console.warn("safeJsonStringify failed, falling back to simple description", err);
    return "{}";
  }
}
