# 🔒 CONFIGURACIÓN DE SECURITY HEADERS

## Headers Recomendados Para Down Together

Agrégalos en **Cloudflare Dashboard** → Reglas → Transform Rules → Agregar header personalizado

### Headers a Configurar

#### 1. **X-Frame-Options** (Clickjacking Protection)
```
Header: X-Frame-Options
Value: SAMEORIGIN
```
**Por qué**: Previene que el sitio sea embebido en iframes de terceros

#### 2. **X-Content-Type-Options** (MIME Sniffing)
```
Header: X-Content-Type-Options
Value: nosniff
```
**Por qué**: Previene que navegador interprete mal tipos de contenido

#### 3. **Referrer-Policy** (Privacy)
```
Header: Referrer-Policy
Value: strict-origin-when-cross-origin
```
**Por qué**: Controla qué información se envía cuando se sale del sitio

#### 4. **Content-Security-Policy** (XSS Protection)
```
Header: Content-Security-Policy
Value: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://www.googletagmanager.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;
```
**Por qué**: Previene inyección de scripts maliciosos

#### 5. **Permissions-Policy** (Feature Access Control)
```
Header: Permissions-Policy
Value: geolocation=(), microphone=(), camera=()
```
**Por qué**: Niega acceso a features potencialmente peligrosas

---

## Cómo Configurar en Cloudflare

1. **Ir a**: https://dash.cloudflare.com/ → Dominio → Reglas
2. **Seleccionar**: Transform Rules
3. **Crear nueva regla** para cada header:
   - **Field**: Response header
   - **Header name**: [Header name]
   - **Header value**: [Value]
4. **Guardar y desplegar**

---

## Alternativa: Astro Config (Si Cloudflare no está disponible)

En `astro.config.mjs`, agregar middleware:

```javascript
export default defineConfig({
  // ... existing config
  middleware: {
    headers: {
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    }
  }
});
```

---

## Verificación

Después de configurar, verificar con:

```bash
curl -I https://downtogether.org | grep -i "x-frame\|x-content\|referrer\|csp"
```

Deberías ver los headers en la respuesta.

---

**Última actualización**: 2026-07-31  
**Status**: Ready to implement
