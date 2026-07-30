const fs = require('fs');
const path = require('path');

// 70 artículos distribuidos en 60 días (2026-08-01 a 2026-09-29)
// ~9 artículos por semana, 2-3 por día

const articles = [
  // Semana 1 (Aug 1-3)
  { slug: 'desarrollo-motor-hitos-tipicos', dates: ['2026-08-01', '2026-08-01'] },
  { slug: 'hipotonía-muscular-ejercicios-en-casa', dates: ['2026-08-01', '2026-08-01'] },
  { slug: 'problemas-gastrointestinales-manejo', dates: ['2026-08-02', '2026-08-02'] },
  { slug: 'sindrome-de-west-convulsiones-infantiles', dates: ['2026-08-02', '2026-08-02'] },
  { slug: 'enfermedad-celíaca-y-sindrome-de-down', dates: ['2026-08-03', '2026-08-03'] },
  { slug: 'hipotiroidismo-en-ninos-sintomas', dates: ['2026-08-03', '2026-08-03'] },
  { slug: 'problemas-de-sueno-insomnio-tratamiento', dates: ['2026-08-04', '2026-08-04'] },
  { slug: 'obesidad-en-ninos-con-down-prevencion', dates: ['2026-08-04', '2026-08-04'] },
  { slug: 'salud-reproductive-en-adolescentes', dates: ['2026-08-05', '2026-08-05'] },

  // Semana 2 (Aug 5-11)
  { slug: 'apnea-del-sueno-diagnostico-tratamiento', dates: ['2026-08-05', '2026-08-05'] },
  { slug: 'salud-mental-depresión-ansiedad', dates: ['2026-08-06', '2026-08-06'] },
  { slug: 'enfermedades-de-corazon-seguimiento-cardiologo', dates: ['2026-08-06', '2026-08-06'] },
  { slug: 'medicamentos-comunes-efectos-secundarios', dates: ['2026-08-07', '2026-08-07'] },
  { slug: 'fisioterapia-terapia-ocupacional-diferencias', dates: ['2026-08-07', '2026-08-07'] },
  { slug: 'vacunaciones-calendario-recomendaciones', dates: ['2026-08-08', '2026-08-08'] },
  { slug: 'virus-rsv-bronquiolitis-prevencion', dates: ['2026-08-08', '2026-08-08'] },
  { slug: 'hipertensión-en-adultos-con-down', dates: ['2026-08-09', '2026-08-09'] },
  { slug: 'diabetes-tipo-2-factores-de-riesgo', dates: ['2026-08-09', '2026-08-09'] },

  // Semana 3 (Aug 12-18)
  { slug: 'alzheimer-en-personas-con-down', dates: ['2026-08-10', '2026-08-10'] },
  { slug: 'cáncer-detección-prevención-temprana', dates: ['2026-08-10', '2026-08-10'] },
  { slug: 'inclusion-educativa-escuela-publica', dates: ['2026-08-12', '2026-08-12'] },
  { slug: 'recursos-educativos-adaptados-currículum', dates: ['2026-08-12', '2026-08-12'] },
  { slug: 'lenguaje-y-comunicación-retrasos', dates: ['2026-08-13', '2026-08-13'] },
  { slug: 'logopedia-terapia-del-lenguaje-beneficios', dates: ['2026-08-13', '2026-08-13'] },
  { slug: 'lectura-y-escritura-metodos-efectivos', dates: ['2026-08-14', '2026-08-14'] },
  { slug: 'matematicas-conceptos-concretos-abstract', dates: ['2026-08-14', '2026-08-14'] },
  { slug: 'conducta-en-aula-estrategias-de-manejo', dates: ['2026-08-15', '2026-08-15'] },

  // Semana 4 (Aug 19-25)
  { slug: 'tecnologia-asistiva-apps-educativas', dates: ['2026-08-15', '2026-08-15'] },
  { slug: 'educacion-sexual-en-adolescentes', dates: ['2026-08-16', '2026-08-16'] },
  { slug: 'autonomía-personal-cuidado-e-higiene', dates: ['2026-08-16', '2026-08-16'] },
  { slug: 'habilidades-sociales-amistades-interaccion', dates: ['2026-08-17', '2026-08-17'] },
  { slug: 'bullying-prevención-y-apoyo', dates: ['2026-08-17', '2026-08-17'] },
  { slug: 'transicion-a-secundaria-preparación', dates: ['2026-08-18', '2026-08-18'] },
  { slug: 'universidad-opciones-accesibilidad', dates: ['2026-08-18', '2026-08-18'] },
  { slug: 'empleo-apoyado-programas-de-entrenamiento', dates: ['2026-08-19', '2026-08-19'] },
  { slug: 'vida-independiente-habilidades-necesarias', dates: ['2026-08-19', '2026-08-19'] },

  // Semana 5 (Aug 26-Sep 1)
  { slug: 'formacion-vocacional-oficios-y-destrezas', dates: ['2026-08-20', '2026-08-20'] },
  { slug: 'educacion-fisica-adaptada-deporte', dates: ['2026-08-20', '2026-08-20'] },
  { slug: 'arte-musica-terapia-expresion', dates: ['2026-08-21', '2026-08-21'] },
  { slug: 'evaluación-psicoeducativa-testing-pruebas', dates: ['2026-08-21', '2026-08-21'] },
  { slug: 'padres-cuidadores-sindrome-de-burnout', dates: ['2026-08-22', '2026-08-22'] },
  { slug: 'culpa-y-duelo-procesamiento-emocional', dates: ['2026-08-22', '2026-08-22'] },
  { slug: 'relacion-de-pareja-impacto-del-diagnostico', dates: ['2026-08-23', '2026-08-23'] },
  { slug: 'hermanos-impacto-emocional-y-apoyo', dates: ['2026-08-23', '2026-08-23'] },
  { slug: 'abuelos-y-familia-extendida-roles-roles', dates: ['2026-08-24', '2026-08-24'] },

  // Semana 6 (Sep 2-8)
  { slug: 'comunicación-familiar-dificultades-y-dialogos', dates: ['2026-08-24', '2026-08-24'] },
  { slug: 'viajes-y-actividades-en-familia-aventuras', dates: ['2026-08-25', '2026-08-25'] },
  { slug: 'planificación-futura-tutela-legal-herencia', dates: ['2026-08-25', '2026-08-25'] },
  { slug: 'duelo-anticipado-preparación-consciente', dates: ['2026-08-26', '2026-08-26'] },
  { slug: 'resiliencia-familias-fortaleza-recursos', dates: ['2026-08-26', '2026-08-26'] },
  { slug: 'apoyo-psicologico-terapia-familiar', dates: ['2026-08-27', '2026-08-27'] },
  { slug: 'vacaciones-y-descanso-autocuidado-padres', dates: ['2026-08-27', '2026-08-27'] },
  { slug: 'transición-a-servicios-para-adultos', dates: ['2026-08-28', '2026-08-28'] },
  { slug: 'decisiones-medicas-autonomía-del-hijo', dates: ['2026-08-28', '2026-08-28'] },

  // Semana 7 (Sep 9-15)
  { slug: 'sexualidad-y-relaciones-conversaciones-importantes', dates: ['2026-08-29', '2026-08-29'] },
  { slug: 'derechos-legales-convención-discapacidad', dates: ['2026-08-29', '2026-08-29'] },
  { slug: 'prestaciones-sociales-subsidios-ayudas', dates: ['2026-08-30', '2026-08-30'] },
  { slug: 'certificado-discapacidad-tramites-beneficios', dates: ['2026-08-30', '2026-08-30'] },
  { slug: 'seguros-de-salud-cobertura-especial', dates: ['2026-08-31', '2026-08-31'] },
  { slug: 'ahorro-e-inversión-futuro-economico', dates: ['2026-08-31', '2026-08-31'] },
  { slug: 'impuestos-deducciones-fiscales-familias', dates: ['2026-09-01', '2026-09-01'] },
  { slug: 'vivienda-accesible-adaptaciones-hogar', dates: ['2026-09-01', '2026-09-01'] },
  { slug: 'transporte-accesibilidad-movilidad', dates: ['2026-09-02', '2026-09-02'] },

  // Semana 8+ (Sep 16-29)
  { slug: 'trabajo-empleo-legislación-protección', dates: ['2026-09-02', '2026-09-02'] },
  { slug: 'discriminación-en-educación-recursos-legales', dates: ['2026-09-03', '2026-09-03'] },
  { slug: 'incluión-social-eventos-comunidad-participacion', dates: ['2026-09-03', '2026-09-03'] },
  { slug: 'deporte-y-recreación-acceso-programas', dates: ['2026-09-04', '2026-09-04'] },
  { slug: 'voluntariado-personas-con-down-contribución', dates: ['2026-09-04', '2026-09-04'] },
  { slug: 'investigación-participativa-voz-comunidad', dates: ['2026-09-05', '2026-09-05'] },
  { slug: 'estigma-y-lenguaje-inclusivo-terminología', dates: ['2026-09-05', '2026-09-05'] },
];

function updateArticleDates() {
  let updated = 0;

  for (const article of articles) {
    for (let i = 0; i < 2; i++) {
      const lang = i === 0 ? 'es' : 'en';
      const dir = `src/content/articles/${lang}`;
      const filename = `${dir}/2026-08-01-${article.slug}.md`;

      if (fs.existsSync(filename)) {
        let content = fs.readFileSync(filename, 'utf-8');
        const oldDate = '2026-08-01';
        const newDate = article.dates[i];

        // Update pubDate
        content = content.replace(
          new RegExp(`pubDate: ${oldDate}`, 'g'),
          `pubDate: ${newDate}`
        );

        // Rename file
        const newFilename = `${dir}/${newDate}-${article.slug}.md`;
        fs.writeFileSync(newFilename, content);
        fs.unlinkSync(filename);

        console.log(`✓ ${newDate}-${article.slug}`);
        updated++;
      }
    }
  }

  console.log(`\nUpdated: ${updated} files across 60 days.`);
}

updateArticleDates();
