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
 * Uso local:
 *   ANTHROPIC_API_KEY=sk-... node scripts/generate-articles.mjs
 *
 * Variables de entorno opcionales:
 *   DAILY_TOPIC_COUNT   Cuántos temas generar hoy (default: 2). Cada tema
 *                        produce un archivo ES y uno EN => 2x archivos.
 *   CLAUDE_MODEL         Modelo a usar (default: claude-sonnet-5).
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
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

// Alterna nivel básico/avanzado entre los temas del día.
function levelForIndex(i) {
  return i % 2 === 0 ? 'basico' : 'avanzado';
}

// Rota categoría según el día del año para variar el contenido con el tiempo.
function categoryForToday(offset) {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = Date.now() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return CATEGORIES[(dayOfYear + offset) % CATEGORIES.length];
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

function frontmatter(fields) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map((v) => `"${v}"`).join(', ')}]`);
    } else if (typeof value === 'boolean' || typeof value === 'number') {
      lines.push(`${key}: ${value}`);
    } else if (key === 'pubDate') {
      lines.push(`${key}: ${value}`);
    } else {
      lines.push(`${key}: ${JSON.stringify(value)}`);
    }
  }
  lines.push('---', '');
  return lines.join('\n');
}

async function generateTopic(level, category) {
  const prompt = `Eres un redactor de contenido para "Down Together / Down Juntos", un sitio bilingüe (español/inglés) que \
reúne información confiable sobre síndrome de Down para dos públicos: familias que recién reciben un diagnóstico \
("basico") y personas que ya conocen lo esencial y quieren actualidad/investigación ("avanzado").

Tarea: busca información reciente y verificable SOLO dentro de estos dominios de confianza: ${TRUSTED_DOMAINS.join(', ')}.
Nivel objetivo: ${level === 'basico' ? 'básico (preguntas frecuentes, fundamentos, tono cálido y claro, sin jerga médica sin explicar)' : 'avanzado (noticias, investigación, o profundización — asume que el lector ya conoce lo esencial)'}.
Categoría: ${category}.

Reglas estrictas:
- NO copies ni parafrasees casi textualmente párrafos completos de la fuente. Sintetiza y explica con tus propias palabras.
- Cita SIEMPRE la fuente exacta (nombre de la organización y URL real que hayas encontrado con la búsqueda).
- Si es contenido de salud, no des consejo médico personalizado; describe lo que dicen las fuentes e invita a consultar a un profesional cuando aplique.
- Escribe el artículo completo en español Y en inglés (traducción fiel, no un resumen distinto).
- Extensión: 250-450 palabras por idioma, en formato Markdown simple (puedes usar subtítulos con ## y listas).
- El título debe ser específico, no genérico.

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
  "tags": ["...", "..."]
}
\`\`\`
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
  console.log(`Generando ${DAILY_TOPIC_COUNT} tema(s) para ${date}...`);

  for (let i = 0; i < DAILY_TOPIC_COUNT; i++) {
    const level = levelForIndex(i);
    const category = categoryForToday(i);
    console.log(`\n[${i + 1}/${DAILY_TOPIC_COUNT}] nivel=${level} categoria=${category}`);

    let data;
    try {
      data = await generateTopic(level, category);
    } catch (err) {
      console.error(`Error generando tema ${i + 1}:`, err.message);
      continue;
    }

    const slug = slugify(data.title_es || data.title_en || `articulo-${i}`);
    const filename = `${date}-${slug}.md`;

    const commonFields = {
      pubDate: date,
      level,
      category,
      sourceName: data.source_name,
      sourceUrl: data.source_url,
      tags: data.tags || [],
      reviewed: false,
      generatedBy: 'claude',
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
  }

  console.log('\nListo. Estos archivos quedan con reviewed:false — revísalos en el Pull Request antes de aprobar.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
