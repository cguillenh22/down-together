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

const CATEGORIES = [
  'salud',
  'educacion',
  'desarrollo',
  'inclusion-laboral',
  'investigacion',
  'testimonios',
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
    if (Array.isArray(value)) {
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

async function generateTopic(level, category, etapa, recentTitles) {
  const wordRange = level === 'basico' ? '400-600' : '300-500';
  const avoidBlock =
    recentTitles.length > 0
      ? `\nTemas ya cubiertos recientemente (NO repitas ninguno de estos, elige un ángulo o tema distinto):\n- ${recentTitles.join('\n- ')}\n`
      : '';

  const prompt = `Eres un redactor de contenido para "Down Together / Down Juntos", un sitio bilingüe (español/inglés) que \
reúne información confiable sobre síndrome de Down para dos públicos: familias que recién reciben un diagnóstico \
("basico") y personas que ya conocen lo esencial y quieren actualidad/investigación ("avanzado"). El sitio también \
organiza el contenido por etapa de vida del hijo/a (independiente del nivel).

Tarea: busca información reciente y verificable SOLO dentro de estos dominios de confianza: ${TRUSTED_DOMAINS.join(', ')}.
Nivel objetivo: ${level === 'basico' ? 'básico (preguntas frecuentes, fundamentos, tono cálido y claro, sin jerga médica sin explicar)' : 'avanzado (noticias, investigación, o profundización — asume que el lector ya conoce lo esencial)'}.
Categoría: ${category}.
Etapa de vida objetivo: ${etapa} (si es "general", el contenido aplica a cualquier etapa; si no, enfoca el tema específicamente en esa etapa — por ejemplo "adolescencia" implica temas como transición, autonomía, pubertad, no contenido de recién nacidos).
${avoidBlock}
Reglas estrictas:
- NO copies ni parafrasees casi textualmente párrafos completos de la fuente. Sintetiza y explica con tus propias palabras.
- Cita SIEMPRE la fuente exacta (nombre de la organización y URL real que hayas encontrado con la búsqueda).
- Si es contenido de salud, no des consejo médico personalizado; describe lo que dicen las fuentes e invita a consultar a un profesional cuando aplique.
- Escribe el artículo completo en español Y en inglés (traducción fiel, no un resumen distinto).
- Extensión: ${wordRange} palabras por idioma, en formato Markdown simple (puedes usar subtítulos con ## y listas).
- El título debe ser específico, no genérico.
- GEO (para que motores como ChatGPT/Perplexity/AI Overviews puedan citarte): el primer párrafo (2-3 líneas) debe responder de forma directa y concreta la pregunta que trae al lector, ANTES de dar contexto o antecedentes — nada de empezar con generalidades tipo "el síndrome de Down es una condición...".
- Cuando tenga sentido, usa los subtítulos (##) en forma de pregunta real, tal como alguien la escribiría en un buscador (ej. "¿Cuándo debe hacerse el ecocardiograma?"), en vez de títulos genéricos de sección.
- No dejes todas las citas para el final: cuando menciones un dato o cifra concreta de la fuente, indica de dónde sale en el mismo párrafo (ej. "según [fuente], ..."), no solo en la línea de fuente al pie.
- IMPORTANTE — acción concreta: si la página fuente ofrece algo accionable (inscribirse a un evento/webinar, descargar un reporte/PDF, un formulario, una línea de ayuda, una guía descargable), identifícalo y captúralo en "action_label"/"action_url" con la URL directa a esa acción (no la home del sitio). Si la fuente no ofrece nada accionable, deja esos dos campos como null — no inventes una acción que no existe.
- Termina el cuerpo del artículo (en ambos idiomas) con una sección corta "## ¿Qué puedes hacer ahora?" con 1-3 sugerencias concretas y prácticas para el lector (puede incluir la acción de la fuente si existe, y/o un siguiente paso razonable aunque no venga de la fuente, como "habla con el pediatra sobre esto").

Tu ÚNICA salida final debe ser un bloque \`\`\`json con exactamente esta forma (sin comentarios adicionales fuera del bloque):

\`\`\`json
{
  "title_es": "...",
  "description_es": "...",
  "body_es_markdown": "...",
  "title_en": "...",
  "description_en": "...",
  "body_en_markdown": "...",
  "source_name": "...",
  "source_url": "https://...",
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

    const commonFields = {
      pubDate: date,
      level,
      etapa,
      pillar: false, // los pillars se curan a mano, este script solo genera actualidad
      category,
      sourceName: data.source_name,
      sourceUrl: data.source_url,
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
