# 📱 PWA SETUP - PROGRESSIVE WEB APP

## ¿Qué es una PWA?

Una Progressive Web App permite a usuarios instalar Down Together en su home screen como si fuera una app nativa, sin pasar por App Store.

---

## Setup en Astro (10 minutos)

### 1. Instalar Astro PWA Plugin

```bash
npm install @vite-pwa/astro
```

### 2. Configurar en astro.config.mjs

```javascript
import { defineConfig } from 'astro/config';
import pwa from '@vite-pwa/astro';

export default defineConfig({
  integrations: [
    pwa({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Down Together',
        short_name: 'Down Together',
        description: 'Información verificada sobre síndrome de Down',
        theme_color: '#2563EB',
        background_color: '#FFFFFF',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/favicon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/favicon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,svg,png,jpg,jpeg,gif,webp}'],
        navigateFallback: '/',
        navigateFallbackDenylist: [/^\/_/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 año
              }
            }
          }
        ]
      }
    })
  ]
});
```

### 3. Crear Iconos PWA

```bash
# Necesitas 2 versiones:
# - public/favicon-192.png (192x192)
# - public/favicon-512.png (512x512)

# Usa el mismo logo pero en tamaños diferentes
```

### 4. Ya Está! 🎉

El PWA se configurará automáticamente. Los usuarios verán:
- "Instalar Down Together" en Chrome/Edge
- "Add to Home Screen" en iOS

---

## Verificar PWA

### En Chrome

1. Abrir DevTools (F12)
2. Ir a **Application** → **Manifest**
3. Debería ver toda la configuración

### En Firefox

1. `about:debugging`
2. Buscar "Down Together"
3. Verá status de instalación

---

## Optimizaciones PWA

### Offline Support

El Workbox cacheará automáticamente:
- ✅ HTML, CSS, JS
- ✅ Imágenes
- ✅ Fonts de Google
- ✅ URLs de la app

**Usuarios sin internet aún pueden:**
- Leer artículos cacheados
- Navegar secciones previousmente visitadas
- Ver imágenes descargadas

### Estrategias de Cache

**Cache First**: Fonts, imágenes
```javascript
// Si está en cache, usar cache
// Si no, descargar del servidor
```

**Network First**: HTML, API calls
```javascript
// Intentar network primero
// Si falla, usar cache
```

---

## Monitoreo PWA

### Métricas a Rastrear

```javascript
// En Google Analytics
navigator.serviceWorker.ready.then(reg => {
  gtag('event', 'pwa_installed');
  gtag('event', 'offline_capable');
});
```

### En GA Panel

1. **Audience** → **Technology**
2. Ver "Mobile App" users
3. Comparar con web users

---

## Testing PWA Offline

### Simular Offline en Chrome

1. DevTools → Network
2. Marcar "Offline"
3. Navegar a new tab
4. Debería cargar desde cache

### Testing Real

Instalar en dispositivo:
- Android: Chrome → Menu → "Install app"
- iOS: Safari → Share → "Add to Home Screen"

---

## Beneficios

✅ **+35% engagement** con usuarios instalados  
✅ **50% menos datos** consumidos (caché)  
✅ **3x más rápido** en conexiones lentas  
✅ **Push notifications** posibles  
✅ **App store no necesario**

---

## Próximos Pasos (Avanzado)

### Push Notifications

```javascript
// Solicitar permiso
Notification.requestPermission().then(permission => {
  if (permission === 'granted') {
    new Notification('Nueva información sobre síndrome de Down');
  }
});
```

### Sync en Background

```javascript
// Sincronizar datos cuando vuelva connection
registration.sync.register('sync-posts');
```

---

**Status**: Ready to implement  
**Complejidad**: Media  
**Impacto**: ⭐⭐⭐ Alto - convierte web a app  
**Tiempo**: 20 minutos
