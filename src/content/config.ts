import { defineCollection, z } from 'astro:content';

// Esquema de cada artículo.
// - "level" separa el TONO: "basico" explica desde cero, "avanzado" asume que
//   el lector ya conoce lo esencial (investigación, noticias, actualidad).
// - "etapa" separa POR ETAPA DE VIDA del hijo/a — es un eje distinto de "level".
//   Un padre de un adolescente no necesita "básico de recién nacido", necesita
//   contenido de SU etapa, sin importar cuánto sepa ya del tema.
// - "pillar" marca contenido evergreen y profundo (guías completas) frente a
//   piezas cortas de actualidad — controla cómo se muestra en el home y cada
//   cuánto se revisa/actualiza.
// - "translationSlug" conecta la versión ES y EN del MISMO artículo, para que
//   el botón de cambio de idioma lleve al artículo traducido, no solo al home.
const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(), // fecha de última revisión/actualización (sobre todo para pillars)
    lang: z.enum(['es', 'en']),
    level: z.enum(['basico', 'avanzado']),
    etapa: z
      .enum(['primera-infancia', 'infancia', 'adolescencia', 'vida-adulta', 'general'])
      .default('general'),
    pillar: z.boolean().default(false), // true = guía profunda/evergreen, false = pieza corta/actualidad
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
    // Acción concreta disponible en la fuente (inscribirse, descargar reporte, etc.)
    // Si la fuente no ofrece ninguna, se deja sin definir.
    actionLabel: z.string().optional(),
    actionUrl: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
    reviewed: z.boolean().default(false), // true solo cuando un humano aprobó el PR
    generatedBy: z.string().default('claude'),
    // Identificador compartido entre la versión ES y la versión EN del mismo
    // artículo (ej. "que-es-sindrome-down"). Debe coincidir exactamente en
    // ambos archivos para que el selector de idioma enlace al traducido.
    translationSlug: z.string(),
  }),
});

export const collections = { articles };
