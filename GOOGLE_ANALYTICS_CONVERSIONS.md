# 📊 GOOGLE ANALYTICS - CONVERSIONS TRACKING

## Setup Rápido

### 1. Obtener Google Analytics ID

```bash
# En GA4 Admin → Data Streams → Get Measurement ID (empieza con G-)
# Ej: G-XXXXXXXXXX
```

### 2. Guardar en .env

```env
PUBLIC_GA_ID=G-XXXXXXXXXX
```

### 3. Ya está configurado en src/layouts/Layout.astro
✅ Se automáticamente inyecta si PUBLIC_GA_ID está presente

---

## Conversiones a Rastrear

### 1. **Newsletter Signup**

```html
<!-- En newsletter form -->
<button onclick="gtag('event', 'newsletter_signup')">
  Suscribirse
</button>
```

### 2. **Article Views**

```javascript
// Auto-rastreado por GA4, pero podemos mejorar
gtag('event', 'page_view', {
  'page_title': document.title,
  'page_location': window.location.href,
  'page_path': window.location.pathname,
  'content_type': 'article',
  'category': 'síndrome de Down' // si aplica
});
```

### 3. **External Resource Clicks**

```html
<!-- En links a recursos externos -->
<a href="https://recurso.org" 
   onclick="gtag('event', 'click_external_resource', {
     'resource_name': 'RECURSO_NAME',
     'resource_url': this.href
   })">
  Ver Recurso
</a>
```

### 4. **Search Queries**

```javascript
// Fuse.js search
document.addEventListener('search', (e) => {
  gtag('event', 'search', {
    'search_term': e.detail.query,
    'results_count': e.detail.results.length
  });
});
```

### 5. **Contact Form Submission**

```javascript
// Al enviar form de contacto
form.addEventListener('submit', () => {
  gtag('event', 'contact_form_submit', {
    'form_type': 'contact'
  });
});
```

---

## Dashboard en GA4

### Crear Custom Report

1. **Ir a**: GA4 → Reports → Exploration
2. **Crear reporte**: "Down Together Conversions"
3. **Dimensions**: Event name, Country, Device
4. **Metrics**: Event count, Users, Conversion rate
5. **Filtros**: Include event names:
   - newsletter_signup
   - click_external_resource
   - search
   - contact_form_submit

### Eventos Clave a Monitorear

| Evento | Importancia | Meta/Mes |
|--------|-------------|----------|
| `newsletter_signup` | ⭐⭐⭐ Alto | 50+ |
| `article_view` | ⭐⭐ Medio | 1000+ |
| `click_external_resource` | ⭐⭐ Medio | 200+ |
| `search` | ⭐ Bajo | 300+ |
| `contact_form_submit` | ⭐⭐⭐ Alto | 20+ |

---

## Implementación en Astro

### En src/layouts/Layout.astro

```astro
---
// Ya tiene soporte para GA
const gaId = import.meta.env.PUBLIC_GA_ID;
---

<html>
  <head>
    {gaId && (
      <>
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}></script>
        <script define:vars={{ gaId }}>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', gaId, {
            page_path: window.location.pathname
          });
        </script>
      </>
    )}
  </head>
  <body>
    <!-- contenido -->
  </body>
</html>
```

### Para Eventos Personalizados

```astro
<script>
  function trackEvent(eventName, eventData) {
    if (window.gtag) {
      window.gtag('event', eventName, eventData);
    }
  }

  // Newsletter
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', () => {
      trackEvent('newsletter_signup', {
        form_location: form.dataset.location || 'footer'
      });
    });
  });

  // Links externos
  document.querySelectorAll('a[target="_blank"]').forEach(link => {
    link.addEventListener('click', () => {
      trackEvent('external_link_click', {
        link_url: link.href,
        link_text: link.textContent
      });
    });
  });
</script>
```

---

## Testing

### Verificar que GA funciona

1. **Ir a**: Google Analytics → Real-time
2. **Abrir la web en nueva ventana**
3. **Debería ver**: "1 users currently active"

### Verificar Eventos

1. **Abrir DevTools** (F12)
2. **Consola**: `window.gtag('event', 'test_event')`
3. **En GA Real-time**: Debería aparecer "test_event"

---

## Checklist de Conversiones

- [ ] PUBLIC_GA_ID guardado en .env
- [ ] GA script se inyecta correctamente
- [ ] Real-time muestra usuarios activos
- [ ] Newsletter submit registra evento
- [ ] External link clicks se rastrean
- [ ] Search queries se rastrean
- [ ] Contact form registra evento
- [ ] Custom dashboard creado
- [ ] Goals/metas establecidas

---

**Status**: Listo para implementar  
**Tiempo**: 20 minutos  
**Costo**: Gratuito  
**Impacto**: ⭐⭐⭐ Alto - datos cruciales para optimización
