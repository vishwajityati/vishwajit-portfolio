// Reports any inline style attributes / <style> elements in the rendered production HTML.
const fs = require("node:fs");
const path = require("node:path");

const file = path.resolve(__dirname, "prod-home.html");
const html = fs.readFileSync(file, "utf8");

const attrMatches = [...html.matchAll(/style="[^"]*"/g)].map((m) => m[0]);
const styleTags = [...html.matchAll(/<style\b[^>]*>/gi)].map((m) => m[0]);
const styleBlocks = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)];

const out = [];
out.push("rendered bytes      : " + html.length);
out.push('inline style="..."  : ' + attrMatches.length);
attrMatches.slice(0, 10).forEach((m) => out.push("   " + m.slice(0, 140)));
out.push("<style> elements   : " + styleTags.length);
styleBlocks.slice(0, 10).forEach((m) => out.push("   tag: " + m[0].slice(0, 160)));
out.push("nonce= occurrences  : " + [...html.matchAll(/nonce="/g)].length);
out.push("link rel=stylesheet : " + [...html.matchAll(/rel="stylesheet"/g)].length);

fs.writeFileSync(path.resolve(__dirname, "inline-check.txt"), out.join("\n"), "utf8");
console.log(out.join("\n"));