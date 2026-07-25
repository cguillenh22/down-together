# Tarea para Claude Code: publicar este proyecto en GitHub

Este es "Down Together / Down Juntos", un sitio Astro (bilingüe ES/EN) sobre
síndrome de Down, ya construido y listo para subir. Necesito que hagas lo
siguiente, en este orden, dentro de esta misma carpeta:

## 1. Verificar/inicializar git
- Revisa si esta carpeta ya es un repositorio git (`git status`).
- Si no lo es, inicialízalo: `git init`, y crea la rama `main`.
- Verifica si ya existe el remoto `origin`. Si no existe, agrégalo:
  `git remote add origin https://github.com/cguillenh22/down-together.git`
- No sobrescribas un remoto `origin` distinto si ya existe uno — avísame en
  vez de forzarlo.

## 2. Verificar que compila antes de subir nada
- Corre `npm install`.
- Corre `npm run build`.
- Si el build falla, intenta arreglar el error (probablemente algo de
  sintaxis en un archivo `.astro` o del `content collection schema` en
  `src/content/config.ts`). No cambies el contenido editorial de los
  artículos ni la lógica de negocio (por ejemplo, no toques
  `scripts/generate-articles.mjs` a menos que tenga un error real de
  sintaxis) — solo corrige errores que impidan compilar.
- Si no logras arreglarlo, detente y explícame el error exacto en vez de
  hacer cambios especulativos.

## 3. Confirmar que no se suban archivos sensibles
- Verifica que `.env` (si existe localmente) esté ignorado por `.gitignore`
  y que NO se incluya en el commit. Este proyecto usa una API key de
  Anthropic que nunca debe subirse al repo.

## 4. Commit y push
- `git add .`
- `git commit -m "Sitio inicial: Down Together / Down Juntos"`
- `git push -u origin main`

## 5. Qué NO hacer (queda fuera de este alcance)
- No configures GitHub Pages, secrets del repo, ni nada del dashboard web de
  GitHub — eso lo hago yo manualmente desde la interfaz de GitHub.
- No toques configuración de DNS en Namecheap.
- No agregues, cambies ni expongas ninguna API key.

## 6. Al terminar
Dame un resumen breve: si el build pasó o falló (y por qué), si el push se
completó, y la URL del repo con el commit ya reflejado.
