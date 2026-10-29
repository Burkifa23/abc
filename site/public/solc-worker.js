let compile;
function ready(cb) { Module.calledRun ? cb() : (Module.onRuntimeInitialized = cb); }
self.onmessage = (e) => {
  const { id, url, input } = e.data;
  try {
    if (!compile) importScripts(url);
    ready(() => {
      compile ??= Module.cwrap("solidity_compile", "string", ["string", "number", "number"]);
      postMessage({ id, output: compile(input, 0, 0) });
    });
  } catch (err) { postMessage({ id, error: String(err) }); }
};
