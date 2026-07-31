# 💬 SISTEMA DE COMENTARIOS

## Opciones Recomendadas

### 1. Disqus (Más fácil, recomendado)

**Setup (5 min)**:
```html
<!-- Agregar al final de artículos en Layout.astro -->
<div id="disqus_thread"></div>
<script>
  var disqus_config = function() {
    this.page.url = window.location.href;
    this.page.identifier = document.title;
  };
  
  (function() {
    var d = document, s = d.createElement('script');
    s.src = 'https://downtogether.disqus.com/embed.js';
    s.setAttribute('data-timestamp', +new Date());
    (d.head || d.body).appendChild(s);
  })();
</script>
```

**Ventajas**: Gratuito, moderación, anti-spam  
**Desventajas**: Anuncios (Disqus logo)  
**Costo**: Gratuito - $60/mes pro

### 2. Giscus (GitHub-based, mejor para comunidad tech)

```html
<!-- Basado en GitHub discussions -->
<script src="https://giscus.app/client.js"
  data-repo="cguillenh22/down-together"
  data-repo-id="REPO_ID"
  data-category="Comentarios"
  data-category-id="CATEGORY_ID"
  data-mapping="pathname"
  data-strict="0"
  data-reactions-enabled="1"
  data-emit-metadata="0"
  data-input-position="bottom"
  data-theme="preferred_color_scheme"
  data-lang="es"
  crossorigin="anonymous"
  async>
</script>
```

**Ventajas**: Gratuito, sin anuncios, integrado con GitHub  
**Desventajas**: Requiere GitHub account  
**Costo**: Gratuito

### 3. Utterances (Ligero, simple)

Similar a Giscus pero más minimalista.

---

## Recomendación

**Para Down Together**: Usa **Disqus** por:
- ✅ No requiere GitHub
- ✅ Moderación robusta
- ✅ Spam protection
- ✅ UX familiar
- ✅ Gratuito para comunidades pequeñas

---

## Implementación Paso a Paso

### 1. Crear Cuenta en Disqus
- Ir a https://disqus.com/
- Sign up
- Create new site: "Down Together"
- Obtener shortname (ej: `downtogether`)

### 2. Agregar a Artículos

En `src/layouts/ArticleLayout.astro`:

```astro
<article>
  <!-- contenido del artículo -->
</article>

<section class="comments">
  <h3>Comentarios</h3>
  <div id="disqus_thread"></div>
  <script>
    // Script de Disqus aquí
  </script>
</section>
```

### 3. Configurar Moderación

En panel Disqus:
- Community → Moderation
- Auto-filter spam
- Set admin (cguillenh22@gmail.com)
- Enable notifications

### 4. Personalización

```css
#disqus_thread {
  max-width: 100%;
  margin-top: 2rem;
  padding: 1rem;
  background: var(--bg-alt);
  border-radius: 8px;
}
```

---

## Impacto

- ✅ Comunidad pode participar
- ✅ Feedback directo en artículos
- ✅ Social proof (otros comentarios)
- ⚠️ Requiere moderación
- ⚠️ Puede atraer spam

---

**Tiempo**: 15 minutos setup  
**Costo**: Gratuito  
**Complejidad**: Baja
