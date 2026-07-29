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
    // Fuente institucional única. Para piezas que comparan varios países,
    // usa `sources` en su lugar (tiene prioridad sobre estos dos en el render).
    sourceName: z.string().optional(),
    sourceUrl: z.string().url().optional(),
    // Piezas multi-país (legal-derechos, o educación/inclusión-laboral sobre
    // derechos/sistemas): una fuente por país, cada una verificada.
    sources: z
      .array(
        z.object({
          name: z.string(),
          url: z.string().url(),
          country: z.string().optional(), // "US" | "ES" | "UK" | ...
        })
      )
      .optional(),
    // Solo para category: "testimonios" — la fuente es la persona, no una
    // institución. Reemplaza sourceName/sourceUrl para esa categoría.
    authorName: z.string().optional(),
    // Acción concreta disponible en la fuente (inscribirse, descargar reporte, etc.)
    // Si la fuente no ofrece ninguna, se deja sin definir.
    actionLabel: z.string().optional(),
    actionUrl: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
    reviewed: z.boolean().default(false), // true solo cuando un humano aprobó el PR
    // Brecha YMYL: quién revisó y cuándo, visible en el artículo (no anónimo).
    reviewerName: z.string().optional(),
    reviewedDate: z.date().optional(),
    generatedBy: z.string().default('claude'),
    // Dimensión de filtrado (como category o etapa), no solo metadata: si el
    // contenido depende de jurisdicción. "general" = universal (salud,
    // desarrollo, investigación, testimonios). "es"/"us"/"uk" = un solo país.
    // "multi" = compara varios (ver `sources` para el detalle).
    pais: z.enum(['general', 'es', 'us', 'uk', 'multi']),
    // Identificador compartido entre la versión ES y la versión EN del mismo
    // artículo (ej. "que-es-sindrome-down"). Debe coincidir exactamente en
    // ambos archivos para que el selector de idioma enlace al traducido.
    translationSlug: z.string(),
  }),
});

export const collections = { articles };
