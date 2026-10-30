export type Progress = Record<string, { quiz?: boolean; exercises?: Record<string, boolean> }>;
type Store = Pick<Storage, "getItem" | "setItem">;
const KEY = "abc:progress";
let memory = ""; // fallback when storage is missing or throws

export function createProgress(storage?: Store) {
  let s: Store | undefined = storage;
  if (!s) {
    try { s = globalThis.localStorage; } catch { /* unavailable */ }
  }
  const get = (): Progress => {
    let raw: string | null = null;
    try { raw = s?.getItem(KEY) ?? null; } catch { /* use memory */ }
    try { return JSON.parse(raw ?? memory ?? "{}") || {}; } catch { return {}; }
  };
  const save = (p: Progress) => {
    const json = JSON.stringify(p);
    memory = json;
    try { s?.setItem(KEY, json); } catch { /* memory only */ }
    globalThis.document?.dispatchEvent(new Event("abc:progress"));
  };
  return {
    get,
    markQuiz(id: string, ok: boolean) {
      const p = get();
      (p[id] ??= {}).quiz = ok;
      save(p);
    },
    markExercise(id: string, ex: string, ok: boolean) {
      const p = get();
      ((p[id] ??= {}).exercises ??= {})[ex] = ok;
      save(p);
    },
    isDone(id: string, exerciseIds: string[]) {
      const e = get()[id];
      return !!e?.quiz && exerciseIds.every((x) => e.exercises?.[x]);
    },
  };
}
