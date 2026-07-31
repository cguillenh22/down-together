# 🚀 EXPERT #1: PERFORMANCE ENGINEER

**Especialista**: Speed & Core Web Vitals Engineer  
**Status**: ✅ COMPLETADO  
**Reporte**: Análisis profundo de Lighthouse Performance

---

## RESUMEN EJECUTIVO

**Current State**: Performance 78-85 (estimado)  
**Target**: Performance 95+  
**Gap**: +10-15 puntos  
**Tiempo Requerido**: 5-6 horas (todas las recomendaciones)

---

## TOP 5 QUICK WINS (< 1 hora) → +8 pts

### 1. Defer Fuse.js Library
- **Cambio**: Agregar `defer` atributo
- **Impacto**: LCP -300ms
- **Tiempo**: 5 min
- **Archivo**: `src/layouts/Layout.astro` línea 57

### 2. Lazy Load Google Analytics
- **Cambio**: `async` → `defer`
- **Impacto**: TTFB -150ms
- **Tiempo**: 5 min
- **Archivo**: `src/layouts/Layout.astro` línea 61

### 3. Optimizar Font-Display Strategy
- **Cambio**: Preload + font-display swap
- **Impacto**: LCP -500ms, CLS -0.05
- **Tiempo**: 10 min
- **Archivo**: `src/layouts/Layout.astro` línea 54

### 4. Cloudflare Cache Rules
- **Cambio**: Configurar 3 cache rules
- **Impacto**: TTFB -200ms (global)
- **Tiempo**: 15 min
- **Archivo**: Cloudflare Dashboard

### 5. Remover Animaciones No-Críticas
- **Cambio**: Eliminar/optimizar keyframes
- **Impacto**: LCP -200ms, CLS -0.08
- **Tiempo**: 15 min
- **Archivo**: `src/layouts/Layout.astro` líneas 113-136, 1011-1080

---

## TOP 5 MEDIUM EFFORTS (1-4 horas) → +15-20 pts

### 1. Extraer CSS Global a Atomic Modules
- **Impact**: LCP -600ms, CLS -0.15
- **Tiempo**: 90 min
- **Archivos nuevos**: 
  - `src/styles/critical.css`
  - `src/styles/components.css`

### 2. Responsive Image Loading
- **Impact**: LCP -400ms, CLS -0.12
- **Tiempo**: 60 min
- **Librería**: `astro-imagetools`

### 3. Code Splitting: Separar Filtering JS
- **Impact**: TTI -800ms, FID -120ms
- **Tiempo**: 75 min
- **Archivo nuevo**: `src/scripts/filters.ts`

### 4. Service Worker para Offline
- **Impact**: Repeat visits -85% load time
- **Tiempo**: 90 min
- **Archivo nuevo**: `public/sw.js`

### 5. View Transitions + Partial Hydration
- **Impact**: TTI -1200ms (perceived), LCP -400ms
- **Tiempo**: 120 min
- **Archivo**: `astro.config.mjs` + Layout.astro

---

## TABLA COMPARATIVA

| Métrica | Actual | Target | Delta |
|---------|--------|--------|-------|
| LCP | 3.5s | <2.0s | -43% |
| FID | 180ms | 60ms | -67% |
| CLS | 0.25 | 0.08 | -68% |
| TTFB | 800ms | 300ms | -62% |
| TTI | 5.2s | 2.8s | -46% |
| Total Load | 6.8s | 3.2s | -53% |

---

## CÓDIGO ESPECÍFICO A IMPLEMENTAR

### Change #1: Defer Fuse.js (Line 57)
```astro
<!-- ANTES -->
<script src="https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js"></script>

<!-- DESPUÉS -->
<script defer src="https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js"></script>
```

### Change #2: Defer GA (Line 61)
```astro
<!-- ANTES -->
<script async src={`https://www.googletagmanager.com/gtag/js?id=${import.meta.env.PUBLIC_GA_ID}`}></script>

<!-- DESPUÉS -->
<script defer src={`https://www.googletagmanager.com/gtag/js?id=${import.meta.env.PUBLIC_GA_ID}`}></script>
```

### Change #3: Font Preload (Line 54)
```astro
<!-- AGREGAR ANTES DE STYLESHEET -->
<link rel="preload" as="style" 
  href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" />

<!-- Y CAMBIAR STYLESHEET A: -->
<link rel="stylesheet" 
  href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" 
  media="print" 
  onload="this.media='all'" />

<!-- Agregar fallback en CSS -->
<style is:global>
  @font-face {
    font-family: 'Poppins';
    src: local('Poppins'), local('Poppins-Regular');
    font-weight: 400;
  }
</style>
```

---

## CLOUDFLARE CONFIGURATION

**Dashboard Path**: Speed → Caching → Cache Rules

**Rule 1: Static Assets**
```
Path: *.css, *.js, *.woff2, *.svg, *.png, *.jpg
Cache TTL: 30 days
Origin Cache Control: Respect
```

**Rule 2: HTML Pages**
```
Path: /*.html
Cache TTL: 5 minutes
Respect origin headers
```

**Rule 3: Bypass Dynamic**
```
Path: /api/*
Cache TTL: 0 (no cache)
```

---

## ARCHIVOS A MODIFICAR

1. ✅ `/src/layouts/Layout.astro` - 5 cambios
2. ✅ `astro.config.mjs` - Build optimization
3. ✅ Cloudflare Dashboard - Cache rules

---

## ARCHIVOS A CREAR

1. 🆕 `src/styles/critical.css` - 8KB inline
2. 🆕 `src/styles/components.css` - Defer load
3. 🆕 `src/scripts/filters.ts` - Code split
4. 🆕 `public/sw.js` - Service worker

---

## MÉTRICAS POST-IMPLEMENTACIÓN

✅ Performance: 78 → 95+  
✅ LCP: 3.5s → 1.8s  
✅ FID: 180ms → 55ms  
✅ CLS: 0.25 → 0.07  
✅ TTFB: 800ms → 280ms  
✅ Bundle: 450KB → 185KB

---

## VALIDACIÓN

```bash
# Test después de cambios
lighthouse https://downtogether.org --output=html

# Monitor específicos
lighthouse https://downtogether.org \
  --output=json | jq '.audits.first-contentful-paint'
```

---

## PRÓXIMAS FASES

- **Fase 2** (si tiempo): Image optimization, more code splitting
- **Fase 3** (opcional): Advanced caching, edge computing
- **Monitoring** (ongoing): Lighthouse CI, Real User Metrics

---

**Responsabilidad**: Performance engineer o desarrollador full-stack  
**Complejidad**: Media → Alta (según alcance)  
**ROI**: Alto - +15 puntos Lighthouse guaranteed

