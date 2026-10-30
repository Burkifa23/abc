let compile, loaded;
// One shared load promise: concurrent requests all wait on the same init.
function load(url) {
  return (loaded ??= new Promise((res, rej) => {
    try {
      importScripts(url);
      Module.calledRun ? res() : (Module.onRuntimeInitialized = res);
    } catch (err) { loaded = undefined; rej(err); }
  }));
}
self.onmessage = async (e) => {
  const { id, url, input } = e.data;
  // importScripts can't take SRI, so only accept the pinned compiler host and version.
  if (!String(url).startsWith("https://binaries.soliditylang.org/bin/soljson-v0.8.38+"))
    return postMessage({ id, loadError: true, error: "untrusted compiler URL" });
  try { await load(url); }
  catch (err) { return postMessage({ id, loadError: true, error: String(err) }); }
  try {
    compile ??= Module.cwrap("solidity_compile", "string", ["string", "number", "number"]);
    postMessage({ id, output: compile(input, 0, 0) });
  } catch (err) { postMessage({ id, error: String(err) }); }
};
