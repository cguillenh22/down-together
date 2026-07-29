#!/usr/bin/env node
/**
 * Genera artículos en borrador (ES + EN) usando Claude con búsqueda web
 * restringida a fuentes confiables (ver scripts/sources.json).
 *
 * Todo lo que produce este script queda con `reviewed: false` en el
 * frontmatter. NADA se publica hasta que un humano:
 *   1. Revisa el/los archivo(s) en el Pull Request que abre GitHub Actions.
 *   2. Cambia `reviewed: false` -> `reviewed: true` en los que aprueba.
 *   3. Mergea el PR a main (eso dispara el deploy a GitHub Pages).
 *
 * Estos artículos son piezas cortas de actualidad (pillar: false). Las guías
 * profundas/evergreen ("pillars") se curan a mano por separado, no las
 * genera este script automático.
 *
 * Uso local:
 *   ANTHROPIC_API_KEY=sk-... node scripts/generate-articles.mjs
 *
 * Variables de entorno opcionales:
 *   DAILY_TOPIC_COUNT   Cuántos temas generar hoy (default: 2). Cada tema
 *                        produce un archivo ES y uno EN => 2x archivos.
 *   CLAUDE_MODEL         Modelo a usar (default: claude-sonnet-5).
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('Falta ANTHROPIC_API_KEY en el entorno.');
  process.exit(1);
}

const client = new Anthropic({ apiKey });

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5';
const DAILY_TOPIC_COUNT = parseInt(process.env.DAILY_TOPIC_COUNT || '2', 10);

const sourcesConfig = JSON.parse(
  readFileSync(path.join(__dirname, 'sources.json'), 'utf-8')
);
const TRUSTED_DOMAINS = sourcesConfig.trusted_domains;

// "testimonios" queda fuera de la rotación a propósito: la fuente de esas
// piezas es una persona, no una institución, y no se generan
// automáticamente (ver down-together-piloto-5-articulos.md).
const CATEGORIES = [
  'salud',
  'educacion',
  'desarrollo',
  'inclusion-laboral',
  'investigacion',
  'legal-derechos',
];

const ETAPAS = ['primera-infancia', 'infancia', 'adolescencia', 'vida-adulta', 'general'];

// Alterna nivel básico/avanzado entre los temas del día.
function levelForIndex(i) {
  return i % 2 === 0 ? 'basico' : 'avanzado';
}

function dayOfYear() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = Date.now() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Rota categoría y etapa según el día del año (con offsets distintos para
// que no siempre coincida la misma categoría con la misma etapa).
function categoryForToday(offset) {
  return CATEGORIES[(dayOfYear() + offset) % CATEGORIES.length];
}
function etapaForToday(offset) {
  return ETAPAS[(dayOfYear() * 2 + offset) % ETAPAS.length];
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function extractJson(text) {
  const match = text.match(/```json\s*([\s\S]*?)```/);
  const raw = match ? match[1] : text;
  return JSON.parse(raw);
}

// Lee los títulos y tags de los artículos ya publicados en español para
// evitar que el generador repita el mismo tema. Se limita a los más
// recientes para no inflar el prompt.
function getRecentTitles(limit = 25) {
  const dir = path.join(ROOT, 'src/content/articles/es');
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .reverse()
    .slice(0, limit);
  const titles = [];
  for (const file of files) {
    const content = readFileSync(path.join(dir, file), 'utf-8');
    const titleMatch = content.match(/^title:\s*"(.+)"$/m);
    if (titleMatch) titles.push(titleMatch[1]);
  }
  return titles;
}

function frontmatter(fields) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      // Array de objetos (ej. "sources") -> secuencia YAML en bloque.
      lines.push(`${key}:`);
      for (const item of value) {
        const [firstKey, ...restKeys] = Object.keys(item);
        lines.push(`  - ${firstKey}: ${JSON.stringify(item[firstKey])}`);
        for (const k of restKeys) {
          if (item[k] === undefined || item[k] === null) continue;
          lines.push(`    ${k}: ${JSON.stringify(item[k])}`);
        }
      }
    } else if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map((v) => `"${v}"`).join(', ')}]`);
    } else if (typeof value === 'boolean' || typeof value === 'number') {
      lines.push(`${key}: ${value}`);
    } else if (key === 'pubDate' || key === 'updatedDate') {
      lines.push(`${key}: ${value}`);
    } else {
      lines.push(`${key}: ${JSON.stringify(value)}`);
    }
  }
  lines.push('---', '');
  return lines.join('\n');
}

// Categorías donde la ley/el sistema varía por país y por lo tanto la
// pieza debe comparar jurisdicciones (ver down-together-resolucion-schema-y-generador.md).
// "educacion" es un caso intermedio: solo es multi-país si el ángulo es de
// derechos/sistema, no si es puramente pedagógico — se lo dejamos decidir
// al modelo con la regla explícita en el prompt, en vez de forzarlo aquí.
const SIEMPRE_MULTI_PAIS = ['legal-derechos', 'inclusion-laboral'];

async function generateTopic(level, category, etapa, recentTitles) {
  const avoidBlock =
    recentTitles.length > 0
      ? `\nTemas ya cubiertos recientemente (NO repitas ninguno de estos, elige un ángulo o tema distinto):\n- ${recentTitles.join('\n- ')}\n`
      : '';
  const multiPaisHint = SIEMPRE_MULTI_PAIS.includes(category)
    ? '\nEsta categoría casi siempre requiere tratamiento multi-país (ver reglas de "pais" abajo) — asúmelo salvo que el tema sea genuinamente universal.\n'
    : '';

  const prompt = `Eres un redactor de contenido para "Down Together", un sitio bilingüe (español/inglés) que \
reúne información confiable sobre síndrome de Down para familias, desde el diagnóstico hasta la vida adulta. \
Nace de la experiencia de un padre — el objetivo es ser la fuente que a él le hubiera gustado tener: cálida y \
directa, nunca clínica ni fría, realista sin ser alarmista.

Tarea: busca información reciente y verificable SOLO dentro de estos dominios de confianza: ${TRUSTED_DOMAINS.join(', ')}.
Nivel objetivo: ${level === 'basico' ? 'básico (preguntas frecuentes, fundamentos, tono cálido y claro, sin jerga médica sin explicar)' : 'avanzado (noticias, investigación, o profundización — asume que el lector ya conoce lo esencial)'}.
Categoría: ${category}.
Etapa de vida objetivo: ${etapa} (si es "general", el contenido aplica a cualquier etapa; si no, enfoca el tema específicamente en esa etapa — por ejemplo "adolescencia" implica temas como transición, autonomía, pubertad, no contenido de recién nacidos).
${avoidBlock}${multiPaisHint}
Estructura obligatoria del cuerpo (en ambos idiomas, sin techo fijo de palabras — cada bloque se extiende lo que
el tema necesite, la pregunta central debe quedar completamente respondida, sin relleno). Usa negrita para la
etiqueta de cada bloque, como en estos ejemplos, no encabezados ##:

1. **Respuesta rápida** (2-4 líneas): responde la pregunta central de inmediato, en lenguaje llano — nada de
   empezar con generalidades tipo "el síndrome de Down es una condición...".
2. **Por qué importa**: contexto breve, sin alarmismo.
3. **Qué dice la fuente**: cuerpo con datos concretos y la cita cerca de cada afirmación (no solo al final).
   Si la categoría requiere multi-país (ver reglas abajo), cubre cada país por separado con un sub-párrafo en
   cursiva tipo "*Estados Unidos.*", cada uno con su propia fuente verificada.
4. **¿Qué puedes hacer ahora?**: acción concreta y realista, específica por país si la pieza es multi-país.
5. **Para profundizar**: enlace(s) a la fuente primaria con una línea de qué van a encontrar ahí.

Reglas de fuente y país (asigna "pais" según esto, es obligatorio):
- Si la categoría es salud, desarrollo o investigación: usa una sola fuente ("source_name"/"source_url"), y
  "pais": "general" (el contenido no depende de jurisdicción).
- Si la categoría es legal-derechos o inclusion-laboral, o si es educación sobre derechos/sistemas (no
  pedagógica pura): usa "sources" (2-3 países, mínimo EE. UU., España y Reino Unido cuando exista fuente real
  para ese país, cada una verificada contra el dominio real, no solo mencionada), y "pais": "multi".
- Solo usa "pais": "es"/"us"/"uk" si la pieza trata explícitamente un único país (caso poco común dado lo
  anterior) — confirma que de verdad no aplica a los demás antes de usarlo.
- Verifica vigencia: si la fuente es una ley o guía, confirma que no fue reemplazada por una versión más
  reciente antes de citarla.

Reglas generales:
- NO copies ni parafrasees casi textualmente párrafos completos de la fuente. Sintetiza y explica con tus propias palabras.
- Si es contenido de salud o legal-derechos, no des recomendación personalizada (dosis, diagnóstico, trámite específico); describe lo que dicen las fuentes.
- Escribe el artículo completo en español Y en inglés (traducción fiel del mismo mensaje, no una traducción literal forzada ni un resumen distinto).
- El título debe ser específico, no genérico.
- Cuando tenga sentido, los sub-encabezados dentro de un bloque pueden ir en forma de pregunta real, tal como alguien la escribiría en un buscador.
- IMPORTANTE — acción concreta: si la página fuente ofrece algo accionable (inscribirse a un evento/webinar, descargar un reporte/PDF, un formulario, una línea de ayuda, una guía descargable), identifícalo y captúralo en "action_label"/"action_url" con la URL directa a esa acción (no la home del sitio). Si la fuente no ofrece nada accionable, deja esos dos campos como null — no inventes una acción que no existe.

Tu ÚNICA salida final debe ser un bloque \`\`\`json con exactamente esta forma (sin comentarios adicionales fuera del bloque). Usa "sources" en vez de "source_name"/"source_url" cuando "pais" sea "multi" (deja los otros dos como null en ese caso); usa "source_name"/"source_url" y deja "sources" como null en cualquier otro caso:

\`\`\`json
{
  "title_es": "...",
  "description_es": "...",
  "body_es_markdown": "...",
  "title_en": "...",
  "description_en": "...",
  "body_en_markdown": "...",
  "pais": "general" | "es" | "us" | "uk" | "multi",
  "source_name": "..." ,
  "source_url": "https://..." ,
  "sources": [{ "name": "...", "url": "https://...", "country": "US" }] ,
  "action_label": "..." ,
  "action_url": "https://..." ,
  "tags": ["...", "..."]
}
\`\`\`
Si no hay acción concreta de la fuente, usa \`"action_label": null, "action_url": null\`.
`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    tools: [
      {
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: 5,
        allowed_domains: TRUSTED_DOMAINS,
      },
    ],
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  return extractJson(text);
}

async function main() {
  const date = todayISO();
  const recentTitles = getRecentTitles();
  console.log(`Generando ${DAILY_TOPIC_COUNT} tema(s) para ${date}...`);

  for (let i = 0; i < DAILY_TOPIC_COUNT; i++) {
    const level = levelForIndex(i);
    const category = categoryForToday(i);
    const etapa = etapaForToday(i);
    console.log(`\n[${i + 1}/${DAILY_TOPIC_COUNT}] nivel=${level} categoria=${category} etapa=${etapa}`);

    let data;
    try {
      data = await generateTopic(level, category, etapa, recentTitles);
    } catch (err) {
      console.error(`Error generando tema ${i + 1}:`, err.message);
      continue;
    }

    const slug = slugify(data.title_es || data.title_en || `articulo-${i}`);
    const filename = `${date}-${slug}.md`;

    const hasSources = Array.isArray(data.sources) && data.sources.length > 0;
    const commonFields = {
      pubDate: date,
      level,
      etapa,
      pillar: false, // los pillars se curan a mano, este script solo genera actualidad
      category,
      pais: data.pais,
      sourceName: hasSources ? undefined : data.source_name,
      sourceUrl: hasSources ? undefined : data.source_url,
      sources: hasSources ? data.sources : undefined,
      actionLabel: data.action_label || undefined,
      actionUrl: data.action_url || undefined,
      tags: data.tags || [],
      reviewed: false,
      generatedBy: 'claude',
      translationSlug: slug,
    };

    const esPath = path.join(ROOT, 'src/content/articles/es', filename);
    const enPath = path.join(ROOT, 'src/content/articles/en', filename);

    mkdirSync(path.dirname(esPath), { recursive: true });
    mkdirSync(path.dirname(enPath), { recursive: true });

    if (existsSync(esPath) || existsSync(enPath)) {
      console.log(`Ya existe un archivo para "${slug}", se omite para no duplicar.`);
      continue;
    }

    const esContent =
      frontmatter({ title: data.title_es, description: data.description_es, lang: 'es', ...commonFields }) +
      '\n' +
      data.body_es_markdown +
      '\n';
    const enContent =
      frontmatter({ title: data.title_en, description: data.description_en, lang: 'en', ...commonFields }) +
      '\n' +
      data.body_en_markdown +
      '\n';

    writeFileSync(esPath, esContent, 'utf-8');
    writeFileSync(enPath, enContent, 'utf-8');
    console.log(`Escrito: ${path.relative(ROOT, esPath)} y ${path.relative(ROOT, enPath)}`);
    recentTitles.unshift(data.title_es);
  }

  console.log('\nListo. Estos archivos quedan con reviewed:false — revísalos en el Pull Request antes de aprobar.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
