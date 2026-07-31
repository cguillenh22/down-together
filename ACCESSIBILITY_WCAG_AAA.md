# ♿ ACCESIBILIDAD - WCAG AAA COLOR CONTRAST

## Estado Actual

- ✅ Dark/Light mode implementado
- ⚠️ Contrast ratios no verificados contra WCAG AAA

## WCAG AAA Requirements

| Tipo | Mínimo (AA) | Objetivo (AAA) |
|------|-----------|----------------|
| Texto normal | 4.5:1 | 7:1 |
| Texto grande | 3:1 | 4.5:1 |
| Componentes UI | 3:1 | 3:1 |

## Testing Automatizado

### Opción 1: Browser DevTools

1. Abrir DevTools (F12)
2. Ir a Elements
3. Seleccionar elemento
4. En Accessibility → ver Contrast ratio
5. Debe mostrar "AA" o "AAA"

### Opción 2: WebAIM Contrast Checker

https://webaim.org/resources/contrastchecker/

1. Ingresar color de texto (foreground)
2. Ingresar color de fondo (background)
3. Ver ratios WCAG

### Opción 3: Herramienta Automatizada

```bash
npm install -g pa11y
pa11y https://downtogether.org/es/
```

## Colores Actuales (CSS Variables)

```css
--blue: #2563EB
--yellow: #FBBF24
--orange: #F97316
--green: #10b981
--red: #dc2626
--purple: #a855f7
--bg-light: #ffffff
--bg-alt: #f3f4f6
--text-dark: #1f2937
--text-muted: #6b7280
--border-light: #e5e7eb
```

## A Verificar

### Textos Críticos
- [ ] Heading (dark text on light bg): `#1f2937` on `#ffffff`
- [ ] Body text: `#1f2937` on `#f3f4f6`
- [ ] Muted text: `#6b7280` on `#ffffff`
- [ ] Links: `#2563EB` on `#ffffff`

### Estados Especiales
- [ ] Hover states
- [ ] Focus states (keyboard navigation)
- [ ] Active states
- [ ] Dark mode equivalentes

### Componentes
- [ ] Botones
- [ ] Cards
- [ ] Tablas
- [ ] Badges/Tags
- [ ] Alerts

## Si No Cumple AAA

### Opción 1: Ajustar colores

Ejemplo: Si azul (#2563EB) en fondo blanco no cumple AAA:
```
Original: #2563EB (azul)
Más oscuro: #1546A8 (azul más saturado/oscuro)
```

### Opción 2: Ajustar tamaño de texto

Texto grande (18px+) requiere menos contraste:
- AA: 3:1
- AAA: 4.5:1

### Opción 3: Agregar borde/sombra

Texto con borde o sombra puede parecer más legible sin cambiar colores.

## Checklist Final

- [ ] Verificado todos los textos principales
- [ ] Heading: ✅ AAA o ✅ AA
- [ ] Body text: ✅ AAA o ✅ AA
- [ ] Links: ✅ AAA o ✅ AA
- [ ] Dark mode también cumple
- [ ] Componentes interactivos (botones, inputs) cumplen

---

## Recursos

- WCAG 2.1 Contrast: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
- WebAIM Checker: https://webaim.org/resources/contrastchecker/
- Color Contrast Analyzer: https://www.tpgi.com/color-contrast-checker/

---

**Status**: Ready to audit  
**Priority**: Medium (mejora experiencia para usuarios con baja visión)
