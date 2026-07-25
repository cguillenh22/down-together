import { defineCollection, z } from 'astro:content';

// Esquema de cada artículo. "level" separa los dos públicos que pediste:
// - "basico": preguntas frecuentes, fundamentos, primeros pasos al diagnóstico
// - "avanzado": investigación, noticias, actualidad, temas para quienes ya conocen lo básico
const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    lang: z.enum(['es', 'en']),
    level: z.enum(['basico', 'avanzado']),
    category: z.enum([
      'salud',
      'educacion',
      'desarrollo',
      'inclusion-laboral',
      'investigacion',
      'testimonios',
      'legal-derechos',
    ]),
    sourceName: z.string(),
    sourceUrl: z.string().url(),
    tags: z.array(z.string()).default([]),
    reviewed: z.boolean().default(false), // true solo cuando un humano aprobó el PR
    generatedBy: z.string().default('claude'),
  }),
});

export const collections = { articles };
