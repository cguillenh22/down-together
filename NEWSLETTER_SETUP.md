# 📧 CONFIGURACIÓN NEWSLETTER

## Opción Recomendada: Mailchimp (Gratuito hasta 500 contactos)

### Paso 1: Crear Cuenta
1. Ir a https://mailchimp.com/
2. Registrarse con email de proyecto
3. Crear audience "Down Together Newsletter"

### Paso 2: Agregar Form al Sitio

En `src/pages/es/newsletter.md`:

```markdown
---
layout: ../../layouts/Layout.astro
title: Newsletter - Down Together
---

# Suscríbete a Nuestro Newsletter

Recibe artículos nuevos y recursos sobre síndrome de Down directo en tu email.

<!-- Mailchimp form code -->
<form action="https://downtogether.us14.list-manage.com/subscribe/post?u=YOUR_USER_ID&id=YOUR_LIST_ID" method="post">
  <input type="email" placeholder="Tu email" name="EMAIL" required />
  <button type="submit">Suscribirse</button>
</form>
```

### Paso 3: Mailchimp Automation

**Crear automated email:**
1. Campaigns → Automations → Welcome series
2. Email 1: "Bienvenido a Down Together" (inmediato)
3. Email 2: "Top 5 artículos para comenzar" (1 día después)
4. Email 3: "Testimonios de familias" (3 días después)

### Paso 4: Newsletter Bi-semanal

**Template**:
- Resumen de artículos nuevos
- Recurso destacado
- Testimonio o historia
- Call-to-action al sitio

---

## Alternativas

| Servicio | Gratuito | Costo | Capacidad |
|----------|----------|-------|-----------|
| **Mailchimp** | ✅ Sí | $20/mes+ | 500+ contactos |
| **Substack** | ✅ Sí | 10% de ingresos | Ilimitado |
| **ConvertKit** | ❌ No | $29/mes+ | Creator-focused |
| **Beehiiv** | ✅ Sí | $15/mes+ | Creator-focused |

---

## Implementación Rápida (Mailchimp)

```html
<!-- Agregar en Layout.astro footer -->
<section class="newsletter">
  <h3>Newsletter Gratuito</h3>
  <p>Nuevos artículos y recursos cada dos semanas</p>
  <form method="POST" action="https://mailchimp-url">
    <input type="email" name="EMAIL" placeholder="Tu email" required />
    <button type="submit">Suscribirse</button>
  </form>
</section>
```

---

**Tiempo de setup**: 30 minutos  
**Costo**: Gratuito (hasta 500 suscriptores)  
**Beneficio**: Reach directo a interesados
