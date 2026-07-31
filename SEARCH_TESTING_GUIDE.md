# 🔍 GUÍA DE TESTING - BÚSQUEDA FUSE.JS

## Estado Actual

- ✅ Fuse.js cargado (CDN jsDelivr)
- ✅ Indexación de artículos
- ⚠️ UX no testeado

## Plan de Testing

### 1. Búsquedas Básicas

**Ir a**: https://downtogether.org/es/

**Testear búsquedas**:
- [ ] `síndrome de down` → Debe mostrar 95+ resultados
- [ ] `educación inclusiva` → Debe mostrar educación + inclusión
- [ ] `hipotiroidismo` → Debe mostrar artículos médicos
- [ ] `xyz123` → No debe mostrar resultados (búsqueda vacía)

### 2. Relevancia de Resultados

**Buscar**: `cardiopatía`
**Esperado**: 
- Primer resultado: "Cardiopatías congénitas"
- Siguientes: Artículos relacionados a salud cardíaca

**Buscar**: `empleo`
**Esperado**:
- Primero: "Empleo apoyado"
- Siguientes: Artículos sobre independencia laboral

### 3. Experiencia UX

- [ ] ¿Búsqueda responde rápido? (<100ms)
- [ ] ¿Resultados son relevantes?
- [ ] ¿Puedo hacer click en resultados?
- [ ] ¿Mobile funciona bien?
- [ ] ¿Texto de "sin resultados" es claro?

### 4. Casos Edge

- [ ] Búsqueda con tilde: `síndrome` vs `sindrome` (¿ambas funcionan?)
- [ ] Búsqueda parcial: `card` (¿encuentra "cardiopatía"?)
- [ ] Búsqueda mayúscula: `SÍNDROME` (¿case-insensitive?)
- [ ] Búsqueda vacía: ¿muestra todos los artículos?

## Si Hay Problemas

### La búsqueda no funciona
- [ ] Abrir console (F12) → ¿Hay errores?
- [ ] Verificar que Fuse.js cargó (buscar "fuse.min.js")
- [ ] Verificar que hay índice de artículos

### Resultados no son relevantes
- [ ] Considerar ajustar opciones de Fuse.js:
  - threshold (actualmente: 0.6)
  - keys (campos a buscar)
  - minMatchCharLength

### Muy lento
- [ ] Considerar caché de resultados
- [ ] Considerar lazy-loading de índice
- [ ] Medir performance con DevTools

## Cómo Mejorar (Futuro)

1. **Filtros por categoría**: "Mostrar solo artículos de Educación"
2. **Búsqueda avanzada**: "Mostrar artículos de 2026"
3. **Ordenamiento**: "Ordenar por relevancia / fecha"
4. **Sugerencias**: Autocompletado mientras escribes
5. **Analytics**: Trackear qué buscan los usuarios

## Checklist Final

- [ ] Búsquedas básicas funcionan
- [ ] Resultados son relevantes
- [ ] UX es clara (sin confusiones)
- [ ] Mobile funciona
- [ ] Sin errores en console
- [ ] Performance es aceptable (<200ms)

---

**Fecha de testing**: [Pendiente]  
**Tester**: [Nombre]  
**Resultado**: [ ] PASS [ ] FAIL
