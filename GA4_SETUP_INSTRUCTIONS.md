# 🔧 GA4 Setup Instructions

## PASO 1: Obtener Google Analytics ID

1. Ir a: https://analytics.google.com
2. Crear propiedad "Down Together" (si no existe)
3. Crear vista "Website"
4. Ir a **Admin** → **Data Streams** → seleccionar "Web"
5. Copiar **Measurement ID** (formato: `G-XXXXXXXXXX`)

---

## PASO 2: Configurar ID en .env.local

1. Abrir `.env.local` en el repo
2. Reemplazar:
   ```
   PUBLIC_GA_ID=G-XXXXXXXXXX
   ```
   con tu ID real

3. Ejemplo:
   ```
   PUBLIC_GA_ID=G-ABC123DEF45
   ```

---

## PASO 3: Verificar Funcionamiento

1. Hacer build:
   ```bash
   npm run build
   ```

2. Hacer preview local:
   ```bash
   npm run preview
   ```

3. Abrir DevTools → Network tab → buscar `gtag`
   - Debería ver request a `googletagmanager.com`

4. Abrir DevTools → Console
   - Ejecutar: `window.gtag('event', 'test_event')`
   - Ir a GA4 dashboard → debería aparecer evento en "Realtime"

---

## PASO 4: Configurar Conversiones en GA4

En GA4 Dashboard:

### Conversión 1: Newsletter Signup
1. **Events** → **Conversion events** → **Create event**
2. Nombre: `newsletter_signup`
3. Condición: Event name = `newsletter_signup`
4. Marcar como conversión

### Conversión 2: Article Engagement
1. Nombre: `article_engagement`
2. Condición: Event name = `article_engagement` AND duration > 30000ms
3. Marcar como conversión

### Conversión 3: Category Click
1. Nombre: `category_click`
2. Condición: Event name = `category_click`
3. Marcar como conversión

---

## PASO 5: Verificar en Producción

1. Deploy a main: `git push origin main`
2. Ir a https://downtogether.org
3. Abrir DevTools → Network
4. Buscar `gtag` requests
5. Ir a GA4 → **Realtime** → debería ver eventos

---

## TROUBLESHOOTING

**P: GA4 no muestra eventos**
R: 
- Verificar que PUBLIC_GA_ID sea correcto (debe empezar con `G-`)
- Ejecutar `npm run build && npm run preview`
- Esperar 24h para que GA4 procese datos

**P: ¿Por qué no veo mi ID en el HTML?**
R:
- El ID está en .env.local (no versionado por seguridad)
- En build, Astro lo inyecta automáticamente via `import.meta.env.PUBLIC_GA_ID`

**P: ¿Cómo verifico que está configurado en producción?**
R:
- Ir a https://downtogether.org
- DevTools → Network → filtrar por `gtag` o `googletagmanager`
- Debería ver requests exitosos

---

## ⚠️ IMPORTANTE

- **NO commitear .env.local** (ya está en .gitignore)
- **PUBLIC_GA_ID es público** (es intencional, ga los demás lo pueden ver)
- **No poner datos sensibles en .env** con `PUBLIC_` prefix
- Para datos sensibles usar `CLOUDFLARE_TOKEN` (sin PUBLIC_)
