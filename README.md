# Down Together / Down Juntos

Fuente bilingüe (español/inglés) sobre síndrome de Down. Contenido dividido en
dos niveles — **Lo básico** (fundamentos, preguntas frecuentes) y **Actualidad
e investigación** (noticias, estudios) — generado con asistencia de Claude a
partir de fuentes verificadas, y publicado solo después de tu revisión.

## Cómo funciona el flujo completo

```
todos los días (cron) ──► GitHub Actions busca en fuentes confiables
                           y genera artículos ES+EN con Claude
                                    │
                                    ▼
                     Abre un Pull Request "borrador de contenido"
                                    │
                                    ▼
                  TÚ revisas los archivos, corriges si hace falta,
                  marcas reviewed: true en los que apruebas
                                    │
                                    ▼
                          Mergeas el Pull Request
                                    │
                                    ▼
              Se dispara el deploy automático a GitHub Pages
```

Todo lo que no sea "revisar y aprobar" está automatizado: búsqueda de fuentes,
redacción en dos idiomas, apertura del PR, build y publicación.

## Puesta en marcha (una sola vez)

### 1. Repositorio
Ya está creado: [github.com/cguillenh22/down-together](https://github.com/cguillenh22/down-together).
Sube el contenido de esta carpeta:
   ```bash
   cd down-together
   git init
   git add .
   git commit -m "Sitio inicial"
   git branch -M main
   git remote add origin https://github.com/cguillenh22/down-together.git
   git push -u origin main
   ```

### 2. Configuración del sitio
`astro.config.mjs` ya está configurado para tu dominio propio: `site: 'https://downtogether.org'`, `base: '/'`. El archivo `public/CNAME` (contiene `downtogether.org`) ya está incluido — es lo que le dice a GitHub Pages qué dominio usar.

### 3. Activar GitHub Pages y conectar el dominio
1. En el repo: **Settings → Pages → Source → GitHub Actions**. No necesitas elegir rama, el workflow `deploy.yml` ya lo maneja.
2. En la misma página, en **Custom domain**, escribe `downtogether.org` y guarda (GitHub va a detectar el archivo `CNAME` que ya subiste con el repo).
3. En Namecheap: **Domain List → downtogether.org → Manage → Advanced DNS**, y agrega estos registros:

   | Tipo | Host | Valor | TTL |
   |------|------|-------|-----|
   | A Record | @ | 185.199.108.153 | Automatic |
   | A Record | @ | 185.199.109.153 | Automatic |
   | A Record | @ | 185.199.110.153 | Automatic |
   | A Record | @ | 185.199.111.153 | Automatic |
   | CNAME Record | www | cguillenh22.github.io. | Automatic |

   Borra cualquier "Parking Page" o registro A/CNAME por defecto que Namecheap haya puesto al comprar el dominio — si no, va a chocar con estos.
4. La propagación puede tardar minutos u horas. Cuando GitHub reconozca el dominio (revisa el estado en Settings → Pages), activa **"Enforce HTTPS"** ahí mismo.

**Correo del proyecto (`hola@downtogether.org`) vía Zoho Mail** — este es un dominio, dos usos distintos (sitio web + correo), y ambos conviven sin conflicto porque son tipos de registro DNS diferentes. Además de los A/CNAME de arriba, agrega en la misma sección de Namecheap:
- Un registro **TXT** con el valor de verificación que te da Zoho al agregar el dominio.
- Los registros **MX** exactos que aparecen en tu panel de administración de Zoho (varían según el datacenter asignado a tu cuenta — usa los que Zoho te muestra, no valores genéricos).
- Un registro **TXT** de SPF: `v=spf1 include:zoho.com -all` (o `zoho.eu`, según corresponda) para que tus correos no caigan en spam.

### 4. Crear tu API key de Anthropic
1. Entra a [console.anthropic.com](https://console.anthropic.com), crea una API key.
2. En el repo de GitHub: **Settings → Secrets and variables → Actions → New repository secret**.
3. Nombre: `ANTHROPIC_API_KEY`. Valor: tu key.

### 5. Probar la generación en local (opcional pero recomendado)
```bash
npm install
cp .env.example .env   # pega tu API key ahí
export $(cat .env | xargs)
npm run generate:content
npm run dev             # revisa en localhost:4321 cómo se ve
```

### 6. Listo — el pipeline diario ya está activo
El workflow `.github/workflows/daily-content.yml` corre todos los días a las
12:00 UTC (ajustable en el archivo, línea `cron`) y abre un PR nuevo con los
artículos del día. También puedes lanzarlo a mano desde la pestaña **Actions**
del repo con el botón "Run workflow".

## Tu rol diario: revisar y aprobar

Cuando llega el PR de contenido:
1. Ábrelo en GitHub, revisa el diff de cada artículo (ES y EN).
2. Si algo está mal, edítalo directamente en el PR (botón de lápiz en el archivo) o coméntalo para corregirlo a mano.
3. En cada archivo que apruebes, cambia `reviewed: false` a `reviewed: true` en el frontmatter — un artículo con `reviewed: false` **no aparece en el sitio** aunque esté mergeado, así que este paso es tu control final.
4. Si un artículo no cumple el estándar, borra ese par de archivos del PR.
5. Mergea el PR. El deploy a GitHub Pages se dispara solo.

## Fuentes confiables

Están listadas y documentadas en `scripts/sources.json` (dominio verificado
manualmente el 2026-07-23): NDSS, NDSC, Down's Syndrome Association (UK),
Canadian Down Syndrome Society, Down España, Fundación Down21, CDC, NICHD,
PubMed. Claude solo puede buscar y citar dentro de esos dominios — para añadir
una fuente nueva, verifica la URL a mano y agrégala a ese archivo.

## Estructura del proyecto

```
src/content/articles/es/   Artículos en español (frontmatter + markdown)
src/content/articles/en/   Artículos en inglés
src/content/config.ts      Esquema/validación de cada artículo
src/pages/es/, src/pages/en/   Rutas del sitio por idioma
scripts/generate-articles.mjs  Script que genera los borradores con Claude
scripts/sources.json           Lista de fuentes confiables (dominios verificados)
.github/workflows/daily-content.yml   Cron diario → abre PR de contenido
.github/workflows/deploy.yml          Build + publicación en GitHub Pages
```

## Notas importantes

- **Nada se publica sin tu aprobación.** El merge del PR es el "botón de publicar".
- **Derechos de autor:** el script está instruido para sintetizar y citar, no para copiar párrafos de la fuente. Aun así, revisa que cada artículo no reproduzca texto casi literal de la fuente original.
- **No es asesoría médica:** los artículos deben describir lo que dicen las fuentes, no dar recomendaciones personalizadas. Revisa que se mantenga ese tono.
- **Costo:** cada corrida diaria hace unas pocas llamadas a la API de Claude con búsqueda web (por defecto 2 temas × 1 llamada c/u). El costo es bajo, pero puedes monitorearlo en tu consola de Anthropic.
- **Nombre:** ya está fijado como **Down Together** (EN) / **Down Juntos** (ES) en `src/layouts/Layout.astro` y en los `<title>` de cada página. Si más adelante quieres cambiarlo, esos son los archivos a tocar.
- **Monetización:** el sitio no tiene publicidad ni afiliados — solo el enlace de donación en el footer de `Layout.astro`, ya activo y apuntando a [ko-fi.com/downtogether](https://ko-fi.com/downtogether) (conectado a PayPal Business). `.org` no es un requisito legal para monetizar ni un indicador de organización sin fines de lucro — es solo una extensión de dominio; si más adelante quieres estatus de fundación/asociación formal (para donaciones deducibles o grants), es un trámite legal aparte, no relacionado con el TLD.
