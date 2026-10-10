/**
 * Test-only shim.
 *
 * Components import their own stylesheet (`import "./About.css"`). Turbopack resolves that at
 * build time, but a bare `tsx` run has no CSS loader, so rendering a component in isolation
 * would otherwise fail on the unknown `.css` extension. This maps every stylesheet specifier to
 * an empty module so the component's actual rendered markup can be inspected outside Next.
 */
const { registerHooks } = require("node:module");
const { pathToFileURL } = require("node:url");
const path = require("node:path");

const stubUrl = pathToFileURL(path.join(__dirname, "css-stub.mjs")).href;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.endsWith(".css")) {
      return { url: stubUrl, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});