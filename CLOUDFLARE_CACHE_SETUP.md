# ☁️ CLOUDFLARE CACHE RULES - MANUAL SETUP

**Time**: 15 minutes  
**Impact**: TTFB -200ms, repeat visits -85% load time  
**Cost**: Free (included with Cloudflare)

---

## PASO A PASO

### 1. Acceder a Cloudflare Dashboard

1. Ir a: https://dash.cloudflare.com/
2. Seleccionar dominio: `downtogether.org`
3. Ir a: **Speed** → **Caching** → **Cache Rules**

---

### 2. Crear RULE 1: Static Assets (Cache Everything)

**When incoming requests match:**
```
Path matches "/(.*)\.(css|js|woff2|svg|png|jpg|jpeg|gif|webp)$"
```

**Then:**
- Cache Level: **Cache Everything**
- Browser TTL: **30 days** (2592000 seconds)
- Edge TTL: **30 days** (2592000 seconds)

**Name**: Static Assets - Cache Aggressively

---

### 3. Crear RULE 2: HTML Pages (Short TTL)

**When incoming requests match:**
```
Path matches "/(.*).html$"
OR
Path equals "/"
OR
Path equals "/es/"
OR
Path equals "/en/"
```

**Then:**
- Cache Level: **Cache Everything**
- Browser TTL: **5 minutes** (300 seconds)
- Edge TTL: **1 hour** (3600 seconds)

**Name**: HTML Pages - Cache 5 min

---

### 4. Crear RULE 3: Sitemap & Robots (Cache)

**When incoming requests match:**
```
Path matches "/(sitemap|robots)"
```

**Then:**
- Cache Level: **Cache Everything**
- Browser TTL: **1 day** (86400 seconds)
- Edge TTL: **7 days** (604800 seconds)

**Name**: Sitemap/Robots

---

### 5. Crear RULE 4: Dynamic Bypass

**When incoming requests match:**
```
Path starts with "/api/"
```

**Then:**
- Cache Level: **Bypass**

**Name**: API - No Cache

---

## VERIFICACIÓN

### Después de crear las rules:

1. **Cache behavior**: https://pagespeed.web.dev/analysis/https://downtogether.org
   - Debería mostrar caching headers correcto

2. **Network tab**: Abrir en browser DevTools
   - Primera visita: `Cache-Control: public, max-age=300`
   - Repeat visit: Serve from Cloudflare Edge (< 100ms TTFB)

3. **Cloudflare Analytics**: Dashboard → Analytics → Performance
   - Cache hit ratio debería ser 80%+

---

## COMANDOS CLI (Alternativa si quieres automatizar)

```bash
# Si tienes wrangler instalado:
# Esto requiere Cloudflare API token

# Instalar:
npm install -g wrangler

# Configurar token:
wrangler login

# Crear rule:
wrangler publish
```

---

## RESULTADO ESPERADO

```
Before:  TTFB 800ms, repeat load 6.8s, CLS 0.25
After:   TTFB 200ms, repeat load 1.2s, CLS 0.08

Impacto en Lighthouse:
- Performance: 85 → 91 (+6 pts)
```

---

## TROUBLESHOOTING

**Q: ¿Las reglas no aplican?**  
A: Verifica que el dominio esté usando Cloudflare nameservers (no CNAME)

**Q: ¿Cache hit ratio bajo?**  
A: Espera 24h para que Cloudflare distribuya a todos los edge servers

**Q: ¿Quiero invalidar cache?**  
A: Ir a **Caching** → **Purge Cache** → **Purge Everything**

---

## ✅ VERIFICACIÓN FINAL

Después de setup, verificar:
- [ ] Lighthouse Performance: 91+ (was 85)
- [ ] Core Web Vitals verde
- [ ] Cache hit ratio 80%+
- [ ] TTFB < 300ms
- [ ] Repeat visit < 2s

