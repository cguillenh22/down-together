// Categorías y etapas son enums compartidos por el schema (src/content/config.ts)
// para artículos ES y EN por igual — el valor interno (ej. "legal-derechos")
// no cambia entre idiomas, solo su etiqueta visible.
export const CATEGORIES = [
  'salud',
  'educacion',
  'desarrollo',
  'inclusion-laboral',
  'investigacion',
  'testimonios',
  'legal-derechos',
];

export const CATEGORY_LABELS = {
  es: {
    salud: 'Salud',
    educacion: 'Educación',
    desarrollo: 'Desarrollo',
    'inclusion-laboral': 'Inclusión laboral',
    investigacion: 'Investigación',
    testimonios: 'Testimonios',
    'legal-derechos': 'Legal y derechos',
  },
  en: {
    salud: 'Health',
    educacion: 'Education',
    desarrollo: 'Development',
    'inclusion-laboral': 'Employment & inclusion',
    investigacion: 'Research',
    testimonios: 'Real stories',
    'legal-derechos': 'Legal & rights',
  },
};

export const ETAPA_LABELS = {
  es: {
    'primera-infancia': 'Primera infancia',
    infancia: 'Infancia',
    adolescencia: 'Adolescencia',
    'vida-adulta': 'Vida adulta',
    general: 'Todas las etapas',
  },
  en: {
    'primera-infancia': 'Early childhood',
    infancia: 'Childhood',
    adolescencia: 'Adolescence',
    'vida-adulta': 'Adulthood',
    general: 'All stages',
  },
};

export function categoryHref(lang, category) {
  return lang === 'es' ? `/es/categoria/${category}/` : `/en/category/${category}/`;
}
