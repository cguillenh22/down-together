# Backend Status

## Resumen

El proyecto incluye un backend con Prisma/Node.js, pero **actualmente NO está integrado ni es necesario** para que el sitio funcione.

## Arquitectura Actual

```
DOWN TOGETHER = Sitio estático (Astro) + Archivos Markdown
    ✅ Funciona en GitHub Pages
    ✅ No requiere servidor
    ✅ Contenido versionado en Git
    ✅ Rápido, seguro, escalable
```

## Backend (Desconectado)

```
/backend/
├── src/
│   ├── routes/     (Endpoints API - no usados)
│   ├── models/     (Prisma schemas - no usados)
│   ├── middleware/ (Auth, etc - no usados)
│   └── ...
└── package.json    (Node.js dependencies)
```

**Status**: Código disponible pero inactivo

## Cuándo Usar Backend

Si en el futuro necesitas:
- ✅ Comentarios en artículos
- ✅ Sistema de usuarios/login
- ✅ Búsqueda avanzada con DB
- ✅ Analytics personalizado
- ✅ Administrador dinámico

**Entonces**: Activar backend, conectar a Vercel o similar, e integrar con frontend.

## Cómo Mantener Limpio

```bash
# Opción 1: Ignorar por ahora (recomendado)
# El backend está en Git, no afecta el sitio

# Opción 2: Remover si definitivamente no se necesitará
# git rm -r backend/
# git commit -m "Remove unused backend code"
```

## Conclusión

**Recomendación**: Mantener en repo (sin uso) como referencia para posibles integraciones futuras.

Si el sitio nunca necesitará backend dinámico, puede removerse después.

---

**Fecha**: 2026-08-07
**Estado del sitio**: ✅ 100% funcional sin backend
