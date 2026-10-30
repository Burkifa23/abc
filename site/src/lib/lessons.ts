import { getCollection } from "astro:content";
import { modules } from "../content/modules";

// Lessons grouped by module in course order; lessons sorted by filename prefix.
export async function lessonsByModule() {
  const all = await getCollection("lessons");
  const groups = modules.map((m) => ({
    ...m,
    lessons: all.filter((l) => l.id.startsWith(m.id + "/")).sort((a, b) => a.id.localeCompare(b.id)),
  }));
  return groups.filter((g) => g.lessons.length);
}

export const solidityLink = (id: string) =>
  `https://docs.soliditylang.org/en/latest/search.html?q=${encodeURIComponent(id.split(" > ").pop()!)}`;
