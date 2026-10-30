export function coverage(tocIds: string[], lessons: { id: string; covers: string[] }[]) {
  const byId: Record<string, string[]> = {};
  for (const l of lessons) for (const c of l.covers) (byId[c] ??= []).push(l.id);
  return { missing: tocIds.filter((id) => !byId[id]), byId };
}
