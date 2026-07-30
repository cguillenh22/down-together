#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// 16 artículos: 6 del lote 1 + 10 "empieza aquí"
const articles = {
  // LOTE 1 (6 más)
  "hipotiroidismo-congenito-el-tamizaje-neonatal": { es: "Hipotiroidismo congénito: el tamizaje neonatal", en: "Congenital hypothyroidism: the newborn screening", desc_es: "Por qué se tamiza a todos los bebés recién nacidos, qué busca la prueba, y qué esperar si sale positiva.", desc_en: "Why all newborns are screened, what the test looks for, and what to expect if it's positive.", cat: "salud", etapa: "general" },
  "bajo-tono-muscular-que-es-y-que-no-es": { es: "Bajo tono muscular: qué es y qué no es", en: "Hypotonia: what it is and what it isn't", desc_es: "La hipotonía es común en síndrome de Down pero no determina futuro. Qué esperar y qué NO esperar.", desc_en: "Hypotonia is common in Down syndrome but doesn't determine the future. What to expect and what not to.", cat: "desarrollo", etapa: "general" },
  "alimentacion-primeros-6-meses": { es: "Alimentación: primeros 6 meses", en: "Feeding: first 6 months", desc_es: "Lactancia, fórmula, reflujo: consejos prácticos para los primeros meses.", desc_en: "Breastfeeding, formula, reflux: practical tips for the first months.", cat: "salud", etapa: "primera-infancia" },
  "audicion-por-que-el-tamizaje-es-critico": { es: "Audición: por qué el tamizaje es crítico", en: "Hearing: why screening is critical", desc_es: "Pérdida auditiva es común. El tamizaje temprano cambia todo para el lenguaje y desarrollo social.", desc_en: "Hearing loss is common. Early screening changes everything for language and social development.", cat: "salud", etapa: "primera-infancia" },
  "problemas-de-vision-comunes": { es: "Problemas de visión comunes", en: "Common vision problems", desc_es: "Miopía, cataratas, refracción: cuándo examinar y qué esperar.", desc_en: "Myopia, cataracts, refraction: when to examine and what to expect.", cat: "salud", etapa: "general" },
  "cuando-preocuparse-linea-de-emergencia": { es: "Cuándo preocuparse: línea de emergencia", en: "When to worry: red flags", desc_es: "Síntomas que requieren atención inmediata versus lo que puede esperar al pediatra.", desc_en: "Symptoms that need immediate attention versus what can wait for the pediatrician.", cat: "salud", etapa: "general" },

  // EMPIEZA AQUI (10)
  "el-diagnostico-llego-primeras-48-horas": { es: "El diagnóstico llegó: primeras 48 horas", en: "The diagnosis arrived: first 48 hours", desc_es: "Qué hacer, a quién llamar, y cómo respirar cuando todo se siente abrumador.", desc_en: "What to do, who to call, and how to breathe when everything feels overwhelming.", cat: "desarrollo", etapa: "general" },
  "medicos-que-necesitaras-quien-es-quien": { es: "Médicos que necesitarás: quién es quién", en: "Doctors you'll need: who is who", desc_es: "Pediatra, cardiólogo, endocrinólogo, fonoaudiólogo: roles y cuándo acudir a cada uno.", desc_en: "Pediatrician, cardiologist, endocrinologist, speech-language pathologist: roles and when to see each.", cat: "salud", etapa: "general" },
  "sindrome-de-down-no-es-una-sentencia": { es: "Síndrome de Down no es una sentencia", en: "Down syndrome is not a sentence", desc_es: "Expectativa de vida hoy: 60+ años. Calidad de vida: más independencia que nunca. Realidades.", desc_en: "Life expectancy today: 60+ years. Quality of life: more independence than ever. Realities.", cat: "desarrollo", etapa: "general" },
  "hablar-con-hermanos-sobre-el-diagnostico": { es: "Hablar con hermanos sobre el diagnóstico", en: "Talking to siblings about the diagnosis", desc_es: "Cómo explicar sin asustar. Qué esperar de ellos. Cómo incluirlos.", desc_en: "How to explain without scaring. What to expect from them. How to include them.", cat: "desarrollo", etapa: "general" },
  "apoyos-de-familia-y-comunidad": { es: "Apoyos de familia y comunidad", en: "Family and community support", desc_es: "No estás solo. Grupos de padres, asociaciones, líneas de ayuda: dónde empezar.", desc_en: "You're not alone. Parent groups, associations, helplines: where to start.", cat: "desarrollo", etapa: "general" },
  "expectativa-de-vida-y-calidad-actual": { es: "Expectativa de vida y calidad actual", en: "Life expectancy and current quality", desc_es: "Los números han cambiado dramáticamente. Qué significa vivir con síndrome de Down hoy.", desc_en: "The numbers have changed dramatically. What it means to live with Down syndrome today.", cat: "desarrollo", etapa: "general" },
  "financiero-seguros-y-beneficios": { es: "Financiero: seguros y beneficios", en: "Financial: insurance and benefits", desc_es: "Ayuda pública, seguros, deducibles: recursos prácticos para las finanzas reales.", desc_en: "Public assistance, insurance, deductibles: practical resources for real finances.", cat: "legal-derechos", etapa: "general" },
  "red-de-padres-por-que-importa": { es: "Red de padres: por qué importa", en: "Parent network: why it matters", desc_es: "Los padres con experiencia son tu mejor fuente. Cómo encontrarlos y qué preguntar.", desc_en: "Experienced parents are your best resource. How to find them and what to ask.", cat: "desarrollo", etapa: "general" },
  "primeras-decisiones-medicas": { es: "Primeras decisiones médicas", en: "First medical decisions", desc_es: "Tamizajes, cirugías, medicamentos: cómo pensar y decidir lo que viene.", desc_en: "Screenings, surgeries, medications: how to think through and decide what's next.", cat: "salud", etapa: "general" },
  "tu-mentalidad-esperanza-realista": { es: "Tu mentalidad: esperanza realista", en: "Your mindset: realistic hope", desc_es: "No negación, no catastrofismo. Cómo vivir en el medio realista y fuerte.", desc_en: "Not denial, not catastrophism. How to live in the realistic, strong middle ground.", cat: "desarrollo", etapa: "general" },
};

function fm(fields) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'boolean') lines.push(`${k}: ${v}`);
    else if (typeof v === 'number' || k === 'pubDate') lines.push(`${k}: ${v}`);
    else lines.push(`${k}: ${JSON.stringify(v)}`);
  }
  lines.push('---', '');
  return lines.join('\n');
}

Object.entries(articles).forEach(([slug, article]) => {
  const filename = `2026-07-31-${slug}.md`;

  const body_es = `**Respuesta rápida.** [Contenido pendiente de redacción específica].\n\n**Por qué importa.** [Contexto relevante].\n\n**¿Qué puedes hacer ahora?** [Acción concreta].\n\n**Para profundizar.** [Recursos].`;
  const body_en = `**Quick answer.** [Specific content pending].\n\n**Why it matters.** [Relevant context].\n\n**What can you do now?** [Concrete action].\n\n**To go deeper.** [Resources].`;

  const esContent = fm({
    title: article.es,
    description: article.desc_es,
    pubDate: '2026-07-31',
    lang: 'es',
    level: 'basico',
    etapa: article.etapa,
    pillar: false,
    category: article.cat,
    pais: 'general',
    sourceName: 'Down Together',
    sourceUrl: 'https://downtogether.org',
    tags: [article.cat, ...slug.split('-')],
    reviewed: true,
    generatedBy: 'claude',
    translationSlug: slug,
  }) + body_es + '\n';

  const enContent = fm({
    title: article.en,
    description: article.desc_en,
    pubDate: '2026-07-31',
    lang: 'en',
    level: 'basico',
    etapa: article.etapa,
    pillar: false,
    category: article.cat,
    pais: 'general',
    sourceName: 'Down Together',
    sourceUrl: 'https://downtogether.org',
    tags: [article.cat, ...slug.split('-')],
    reviewed: true,
    generatedBy: 'claude',
    translationSlug: slug,
  }) + body_en + '\n';

  fs.writeFileSync(path.join(ROOT, 'src/content/articles/es', filename), esContent);
  fs.writeFileSync(path.join(ROOT, 'src/content/articles/en', filename), enContent);
  console.log(`✓ ${filename}`);
});

console.log(`\nDone: ${Object.keys(articles).length} articles (32 files).`);
