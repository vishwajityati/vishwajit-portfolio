/**
 * Test-only shim.
 *
 * `server-only` is supplied by Next.js at build time and is not present in node_modules, so a
 * bare `tsx` run cannot resolve the `import "server-only"` guard that src/lib/db-retry.ts uses
 * to match the convention in the rest of src/lib. This maps the specifier to an empty module so
 * the module's real behaviour can be exercised outside a Next runtime.
 */
const { registerHooks } = require("node:module");
const { pathToFileURL } = require("node:url");
const path = require("node:path");

const stubUrl = pathToFileURL(path.join(__dirname, "server-only-stub.mjs")).href;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { url: stubUrl, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  }
});