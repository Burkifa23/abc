import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import toc from "./content/solidity-toc.json";

const TocId = z.enum(toc.map((e) => e.id) as [string, ...string[]]);

const lessons = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/lessons" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    covers: z.array(TocId),
    labs: z.array(z.string()).optional(),
  }),
});

export const collections = { lessons };
