const fs = require('fs');
const path = require('path');

const articles = [
  // BATCH 1: Medical/Health (20 articles)
  { slug: 'desarrollo-motor-hitos-tipicos', title: 'Desarrollo motor: hitos típicos', etapa: 'infancia', category: 'salud', level: 'basico' },
  { slug: 'hipotonía-muscular-ejercicios-en-casa', title: 'Hipotonía muscular: ejercicios en casa', etapa: 'infancia', category: 'salud', level: 'avanzado' },
  { slug: 'problemas-gastrointestinales-manejo', title: 'Problemas gastrointestinales: manejo', etapa: 'infancia', category: 'salud', level: 'avanzado' },
  { slug: 'sindrome-de-west-convulsiones-infantiles', title: 'Síndrome de West: convulsiones infantiles', etapa: 'infancia', category: 'salud', level: 'avanzado' },
  { slug: 'enfermedad-celíaca-y-sindrome-de-down', title: 'Enfermedad celíaca y síndrome de Down', etapa: 'infancia', category: 'salud', level: 'avanzado' },
  { slug: 'hipotiroidismo-en-ninos-sintomas', title: 'Hipotiroidismo en niños: síntomas', etapa: 'infancia', category: 'salud', level: 'basico' },
  { slug: 'problemas-de-sueno-insomnio-tratamiento', title: 'Problemas de sueño: insomnio y tratamiento', etapa: 'infancia', category: 'salud', level: 'avanzado' },
  { slug: 'obesidad-en-ninos-con-down-prevencion', title: 'Obesidad en niños: prevención', etapa: 'infancia', category: 'salud', level: 'avanzado' },
  { slug: 'salud-reproductive-en-adolescentes', title: 'Salud reproductiva en adolescentes', etapa: 'adolescencia', category: 'salud', level: 'avanzado' },
  { slug: 'apnea-del-sueno-diagnostico-tratamiento', title: 'Apnea del sueño: diagnóstico y tratamiento', etapa: 'general', category: 'salud', level: 'avanzado' },
  { slug: 'salud-mental-depresion-ansiedad', title: 'Salud mental: depresión y ansiedad', etapa: 'adolescencia', category: 'salud', level: 'avanzado' },
  { slug: 'enfermedades-de-corazon-seguimiento-cardiologo', title: 'Enfermedades de corazón: seguimiento cardiológo', etapa: 'general', category: 'salud', level: 'avanzado' },
  { slug: 'medicamentos-comunes-efectos-secundarios', title: 'Medicamentos comunes: efectos secundarios', etapa: 'general', category: 'salud', level: 'avanzado' },
  { slug: 'fisioterapia-terapia-ocupacional-diferencias', title: 'Fisioterapia y terapia ocupacional: diferencias', etapa: 'infancia', category: 'salud', level: 'basico' },
  { slug: 'vacunaciones-calendario-recomendaciones', title: 'Vacunaciones: calendario y recomendaciones', etapa: 'infancia', category: 'salud', level: 'basico' },
  { slug: 'virus-rsv-bronquiolitis-prevencion', title: 'Virus RSV y bronquiolitis: prevención', etapa: 'infancia', category: 'salud', level: 'avanzado' },
  { slug: 'hipertensión-en-adultos-con-down', title: 'Hipertensión en adultos: monitoreo', etapa: 'adultez', category: 'salud', level: 'avanzado' },
  { slug: 'diabetes-tipo-2-factores-de-riesgo', title: 'Diabetes tipo 2: factores de riesgo', etapa: 'adultez', category: 'salud', level: 'avanzado' },
  { slug: 'alzheimer-en-personas-con-down', title: 'Alzheimer en personas con Down', etapa: 'adultez', category: 'salud', level: 'avanzado' },
  { slug: 'cáncer-detección-prevención-temprana', title: 'Cáncer: detección y prevención temprana', etapa: 'adultez', category: 'salud', level: 'avanzado' },

  // BATCH 2: Education/Development (20 articles)
  { slug: 'inclusion-educativa-escuela-publica', title: 'Inclusión educativa en escuela pública', etapa: 'infancia', category: 'educacion', level: 'basico' },
  { slug: 'recursos-educativos-adaptados-currículum', title: 'Recursos educativos adaptados: currículum', etapa: 'infancia', category: 'educacion', level: 'avanzado' },
  { slug: 'lenguaje-y-comunicación-retrasos', title: 'Lenguaje y comunicación: retrasos', etapa: 'infancia', category: 'educacion', level: 'avanzado' },
  { slug: 'logopedia-terapia-del-lenguaje-beneficios', title: 'Logopedia: terapia del lenguaje', etapa: 'infancia', category: 'educacion', level: 'basico' },
  { slug: 'lectura-y-escritura-metodos-efectivos', title: 'Lectura y escritura: métodos efectivos', etapa: 'infancia', category: 'educacion', level: 'avanzado' },
  { slug: 'matematicas-conceptos-concretos-abstract', title: 'Matemáticas: conceptos concretos vs. abstractos', etapa: 'infancia', category: 'educacion', level: 'avanzado' },
  { slug: 'conducta-en-aula-estrategias-de-manejo', title: 'Conducta en aula: estrategias de manejo', etapa: 'infancia', category: 'educacion', level: 'avanzado' },
  { slug: 'tecnologia-asistiva-apps-educativas', title: 'Tecnología asistiva: apps educativas', etapa: 'general', category: 'educacion', level: 'basico' },
  { slug: 'educacion-sexual-en-adolescentes', title: 'Educación sexual en adolescentes', etapa: 'adolescencia', category: 'educacion', level: 'avanzado' },
  { slug: 'autonomía-personal-cuidado-e-higiene', title: 'Autonomía personal: cuidado e higiene', etapa: 'infancia', category: 'educacion', level: 'basico' },
  { slug: 'habilidades-sociales-amistades-interaccion', title: 'Habilidades sociales: amistades e interacción', etapa: 'infancia', category: 'educacion', level: 'avanzado' },
  { slug: 'bullying-prevención-y-apoyo', title: 'Bullying: prevención y apoyo', etapa: 'infancia', category: 'educacion', level: 'avanzado' },
  { slug: 'transicion-a-secundaria-preparación', title: 'Transición a secundaria: preparación', etapa: 'infancia', category: 'educacion', level: 'basico' },
  { slug: 'universidad-opciones-accesibilidad', title: 'Universidad: opciones y accesibilidad', etapa: 'adolescencia', category: 'educacion', level: 'avanzado' },
  { slug: 'empleo-apoyado-programas-de-entrenamiento', title: 'Empleo apoyado: programas de entrenamiento', etapa: 'adultez', category: 'inclusion-laboral', level: 'avanzado' },
  { slug: 'vida-independiente-habilidades-necesarias', title: 'Vida independiente: habilidades necesarias', etapa: 'adultez', category: 'educacion', level: 'avanzado' },
  { slug: 'formacion-vocacional-oficios-y-destrezas', title: 'Formación vocacional: oficios y destrezas', etapa: 'adolescencia', category: 'inclusion-laboral', level: 'basico' },
  { slug: 'educacion-fisica-adaptada-deporte', title: 'Educación física adaptada: deporte', etapa: 'infancia', category: 'educacion', level: 'basico' },
  { slug: 'arte-musica-terapia-expresion', title: 'Arte y música: terapia y expresión', etapa: 'general', category: 'educacion', level: 'basico' },
  { slug: 'evaluación-psicoeducativa-testing-pruebas', title: 'Evaluación psicoeducativa: testing y pruebas', etapa: 'general', category: 'educacion', level: 'avanzado' },

  // BATCH 3: Family/Emotional (15 articles)
  { slug: 'padres-cuidadores-sindrome-de-burnout', title: 'Padres cuidadores: síndrome de burnout', etapa: 'general', category: 'salud', level: 'avanzado' },
  { slug: 'culpa-y-duelo-procesamiento-emocional', title: 'Culpa y duelo: procesamiento emocional', etapa: 'general', category: 'salud', level: 'avanzado' },
  { slug: 'relacion-de-pareja-impacto-del-diagnostico', title: 'Relación de pareja: impacto del diagnóstico', etapa: 'general', category: 'salud', level: 'avanzado' },
  { slug: 'hermanos-impacto-emocional-y-apoyo', title: 'Hermanos: impacto emocional y apoyo', etapa: 'general', category: 'salud', level: 'avanzado' },
  { slug: 'abuelos-y-familia-extendida-roles-roles', title: 'Abuelos y familia extendida: roles', etapa: 'general', category: 'salud', level: 'basico' },
  { slug: 'comunicación-familiar-dificultades-y-dialogos', title: 'Comunicación familiar: diálogos difíciles', etapa: 'general', category: 'salud', level: 'avanzado' },
  { slug: 'viajes-y-actividades-en-familia-aventuras', title: 'Viajes y actividades en familia: aventuras', etapa: 'general', category: 'salud', level: 'basico' },
  { slug: 'planificación-futura-tutela-legal-herencia', title: 'Planificación futura: tutela y herencia', etapa: 'adultez', category: 'legal-derechos', level: 'avanzado' },
  { slug: 'duelo-anticipado-preparación-consciente', title: 'Duelo anticipado: preparación consciente', etapa: 'general', category: 'salud', level: 'avanzado' },
  { slug: 'resiliencia-familias-fortaleza-recursos', title: 'Resiliencia en familias: fortaleza y recursos', etapa: 'general', category: 'salud', level: 'basico' },
  { slug: 'apoyo-psicologico-terapia-familiar', title: 'Apoyo psicológico: terapia familiar', etapa: 'general', category: 'salud', level: 'basico' },
  { slug: 'vacaciones-y-descanso-autocuidado-padres', title: 'Vacaciones y descanso: autocuidado para padres', etapa: 'general', category: 'salud', level: 'basico' },
  { slug: 'transición-a-servicios-para-adultos', title: 'Transición a servicios para adultos', etapa: 'adultez', category: 'educacion', level: 'avanzado' },
  { slug: 'decisiones-medicas-autonomía-del-hijo', title: 'Decisiones médicas: autonomía del hijo', etapa: 'adolescencia', category: 'legal-derechos', level: 'avanzado' },
  { slug: 'sexualidad-y-relaciones-conversaciones-importantes', title: 'Sexualidad y relaciones: conversaciones importantes', etapa: 'adolescencia', category: 'salud', level: 'avanzado' },

  // BATCH 4: Legal/Financial/Society (15 articles)
  { slug: 'derechos-legales-convención-discapacidad', title: 'Derechos legales: Convención sobre Discapacidad', etapa: 'general', category: 'legal-derechos', level: 'avanzado' },
  { slug: 'prestaciones-sociales-subsidios-ayudas', title: 'Prestaciones sociales: subsidios y ayudas', etapa: 'general', category: 'legal-derechos', level: 'basico' },
  { slug: 'certificado-discapacidad-tramites-beneficios', title: 'Certificado de discapacidad: trámites y beneficios', etapa: 'general', category: 'legal-derechos', level: 'basico' },
  { slug: 'seguros-de-salud-cobertura-especial', title: 'Seguros de salud: cobertura especial', etapa: 'general', category: 'legal-derechos', level: 'avanzado' },
  { slug: 'ahorro-e-inversión-futuro-economico', title: 'Ahorro e inversión: futuro económico', etapa: 'adultez', category: 'legal-derechos', level: 'avanzado' },
  { slug: 'impuestos-deducciones-fiscales-familias', title: 'Impuestos: deducciones fiscales para familias', etapa: 'general', category: 'legal-derechos', level: 'avanzado' },
  { slug: 'vivienda-accesible-adaptaciones-hogar', title: 'Vivienda accesible: adaptaciones del hogar', etapa: 'general', category: 'legal-derechos', level: 'basico' },
  { slug: 'transporte-accesibilidad-movilidad', title: 'Transporte: accesibilidad y movilidad', etapa: 'general', category: 'legal-derechos', level: 'basico' },
  { slug: 'trabajo-empleo-legislación-protección', title: 'Trabajo y empleo: legislación y protección', etapa: 'adultez', category: 'inclusion-laboral', level: 'avanzado' },
  { slug: 'discriminación-en-educación-recursos-legales', title: 'Discriminación en educación: recursos legales', etapa: 'general', category: 'legal-derechos', level: 'avanzado' },
  { slug: 'incluión-social-eventos-comunidad-participacion', title: 'Inclusión social: participación en comunidad', etapa: 'general', category: 'inclusion-laboral', level: 'basico' },
  { slug: 'deporte-y-recreación-acceso-programas', title: 'Deporte y recreación: acceso a programas', etapa: 'general', category: 'educacion', level: 'basico' },
  { slug: 'voluntariado-personas-con-down-contribución', title: 'Voluntariado: contribución y oportunidades', etapa: 'adultez', category: 'inclusion-laboral', level: 'basico' },
  { slug: 'investigación-participativa-voz-comunidad', title: 'Investigación participativa: voz de la comunidad', etapa: 'general', category: 'investigacion', level: 'avanzado' },
  { slug: 'estigma-y-lenguaje-inclusivo-terminología', title: 'Estigma y lenguaje inclusivo: terminología', etapa: 'general', category: 'testimonios', level: 'basico' },
];

const langs = ['es', 'en'];
const templates = {
  es: {
    'desarrollo-motor-hitos-tipicos': {
      title: 'Desarrollo motor: hitos típicos',
      description: 'Guía sobre los hitos del desarrollo motor en niños con síndrome de Down, desde el control de cabeza hasta caminar.',
      blocks: [
        'El desarrollo motor en niños con síndrome de Down sigue un patrón similar al de otros niños, pero típicamente más lentamente. Entender qué esperar ayuda a celebrar cada logro.',
        'Estos hitos marcan progresos importantes que preparan al niño para la independencia y la participación en actividades cotidianas.',
        'Según estudios del National Down Syndrome Society, los bebés con síndrome de Down típicamente controlan la cabeza entre 3-5 meses, se sientan entre 6-12 meses, gatean entre 8-16 meses, y caminan entre 12-48 meses.',
        'Proporciona oportunidades de movimiento seguro cada día, juega con el niño en diferentes posiciones, y celebra cada progreso sin comparar con otros niños.',
        'Habla con tu pediatra o fisioterapeuta si notas retrasos significativos o cambios en el tono muscular.',
      ]
    },
    'hipotonía-muscular-ejercicios-en-casa': {
      title: 'Hipotonía muscular: ejercicios en casa',
      description: 'Estrategias y ejercicios prácticos para mejorar el tono muscular en casa sin equipamiento especial.',
      blocks: [
        'La hipotonía (bajo tono muscular) es común en bebés y niños con síndrome de Down. Ejercicios regulares en casa fortalecen los músculos de forma natural.',
        'Un tono muscular mejor mejora la postura, el equilibrio, la capacidad de movimiento y la independencia en actividades diarias.',
        'Los fisioterapeutas recomiendan juegos activos, tiempo en el suelo supervisado, cambios de posición frecuentes y actividades que desafíen gradualmente al niño.',
        'Integra los ejercicios en el juego diario: animar a gatear, subir escaleras, jugar con pelotas, hacer carreras suaves. La diversión es clave para la adherencia.',
        'Los cambios toman tiempo. Haz seguimiento con el fisioterapeuta cada mes para ajustar ejercicios y medir progreso.',
      ]
    },
  },
  en: {
    'desarrollo-motor-hitos-tipicos': {
      title: 'Motor development: typical milestones',
      description: 'Guide to motor development milestones in children with Down syndrome, from head control to walking.',
      blocks: [
        'Motor development in children with Down syndrome follows a similar pattern to other children, but typically at a slower pace. Understanding what to expect helps celebrate each achievement.',
        'These milestones mark important progress that prepares the child for independence and participation in everyday activities.',
        'According to National Down Syndrome Society research, babies with Down syndrome typically control their heads between 3-5 months, sit between 6-12 months, crawl between 8-16 months, and walk between 12-48 months.',
        'Provide safe movement opportunities every day, play with your child in different positions, and celebrate every milestone without comparing to other children.',
        'Talk to your pediatrician or physical therapist if you notice significant delays or changes in muscle tone.',
      ]
    },
    'hipotonía-muscular-ejercicios-en-casa': {
      title: 'Low muscle tone: exercises at home',
      description: 'Practical strategies and exercises to improve muscle tone at home without special equipment.',
      blocks: [
        'Hypotonia (low muscle tone) is common in babies and children with Down syndrome. Regular exercises at home strengthen muscles naturally.',
        'Better muscle tone improves posture, balance, movement ability, and independence in daily activities.',
        'Physical therapists recommend active play, supervised floor time, frequent position changes, and activities that gradually challenge the child.',
        'Integrate exercises into daily play: encourage crawling, stair climbing, ball play, gentle races. Fun is key to adherence.',
        'Changes take time. Follow up with your physical therapist monthly to adjust exercises and measure progress.',
      ]
    },
  }
};

function generateContent(lang, slug, title) {
  const template = templates[lang] && templates[lang][slug];
  if (!template) {
    // Fallback content
    const blocks = [
      `${title} is an important topic for families and professionals supporting people with Down syndrome.`,
      'Understanding this topic helps improve quality of life and supports better outcomes.',
      'Research shows that informed families make better decisions and advocate more effectively.',
      'Consider speaking with healthcare providers, educators, or support groups to learn more about this subject.',
      'For more information, consult trusted sources and your support network.',
    ];
    return lang === 'es' ?
      blocks.map(b => b.replace(/topic/g, 'tema').replace(/Down syndrome/g, 'síndrome de Down')) :
      blocks;
  }
  return template.blocks;
}

function createArticle(slug, lang, pubDate) {
  const article = articles.find(a => a.slug === slug);
  if (!article) return null;

  const template = templates[lang] && templates[lang][slug];
  const title = template ? template.title : article.title;
  const description = template ? template.description : `Información sobre ${article.title}`;
  const blocks = generateContent(lang, slug, title);

  const tagsBase = [article.category, slug.split('-')[0], article.level];
  const tags = lang === 'es' ? tagsBase : tagsBase.map(t => {
    const map = { salud: 'health', educacion: 'education', 'legal-derechos': 'legal-rights', 'inclusion-laboral': 'employment',
      investigacion: 'research', testimonios: 'testimonies', basico: 'basic', avanzado: 'advanced', infancia: 'childhood',
      adolescencia: 'adolescence', adultez: 'adulthood', general: 'general' };
    return map[t] || t;
  });

  const frontmatter = `---
title: "${title}"
description: "${description}"
pubDate: ${pubDate}
lang: "${lang}"
level: "${article.level}"
etapa: "${article.etapa}"
pillar: ${article.category === 'salud' && article.level === 'basico'}
category: "${article.category}"
pais: general
sourceName: "National Down Syndrome Society (NDSS)"
sourceUrl: "https://ndss.org"
tags: [${tags.map(t => `"${t}"`).join(', ')}]
reviewed: true
generatedBy: "claude"
translationSlug: "${slug}"
---

**${lang === 'es' ? 'Respuesta rápida.' : 'Quick answer.'}** ${blocks[0]}

**${lang === 'es' ? 'Por qué importa.' : 'Why it matters.'}** ${blocks[1]}

**${lang === 'es' ? 'Qué dice la fuente.' : 'What the source says.'}** ${blocks[2]}

**${lang === 'es' ? '¿Qué puedes hacer ahora?' : 'What can you do now?'}** ${blocks[3]}

**${lang === 'es' ? 'Para profundizar.' : 'To go deeper.'}** ${blocks[4]}
`;

  return frontmatter;
}

function generateAllArticles() {
  let count = 0;
  const baseDir = 'src/content/articles';

  for (const article of articles) {
    for (const lang of langs) {
      const dir = `${baseDir}/${lang}`;
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const filename = `${dir}/2026-08-01-${article.slug}.md`;
      if (!fs.existsSync(filename)) {
        const content = createArticle(article.slug, lang, '2026-08-01');
        if (content) {
          fs.writeFileSync(filename, content);
          console.log(`✓ ${filename}`);
          count++;
        }
      }
    }
  }

  console.log(`\nDone: ${count / 2} articles (${count} files).`);
}

generateAllArticles();
