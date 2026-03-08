# 🚀 Guía de Despliegue en Render (Plan Gratuito)

> Guía paso a paso para desplegar **FerreHogar** en Render.com de forma gratuita.

---

## 📋 Índice

1. [Requisitos Previos](#1-requisitos-previos)
2. [Preparar el Proyecto](#2-preparar-el-proyecto)
3. [Crear Cuenta en Render](#3-crear-cuenta-en-render)
4. [Subir Código a GitHub](#4-subir-código-a-github)
5. [Desplegar como Static Site en Render](#5-desplegar-como-static-site-en-render)
6. [Configurar Variables de Entorno](#6-configurar-variables-de-entorno)
7. [Configurar Dominio Personalizado (Opcional)](#7-configurar-dominio-personalizado-opcional)
8. [Despliegue Automático (CI/CD)](#8-despliegue-automático-cicd)
9. [Limitaciones del Plan Gratuito](#9-limitaciones-del-plan-gratuito)
10. [Solución de Problemas Comunes](#10-solución-de-problemas-comunes)

---

## 1. Requisitos Previos

Antes de comenzar, asegúrate de tener:

- ✅ **Node.js 18+** instalado → [descargar](https://nodejs.org/)
- ✅ **Git** instalado → [descargar](https://git-scm.com/)
- ✅ **Cuenta de GitHub** → [crear cuenta](https://github.com/signup)
- ✅ **Cuenta de Render** → [crear cuenta](https://render.com/) (puedes registrarte con GitHub)
- ✅ El código fuente del proyecto descargado/clonado en tu máquina

### Verificar instalaciones

```bash
node --version    # Debe mostrar v18.x.x o superior
npm --version     # Debe mostrar 9.x.x o superior
git --version     # Debe mostrar 2.x.x o superior
```

---

## 2. Preparar el Proyecto

### 2.1 Instalar dependencias

```bash
cd ferrehogar          # o el nombre de tu carpeta
npm install
```

### 2.2 Verificar que el proyecto compila correctamente

```bash
npm run build
```

Esto genera una carpeta `dist/` con los archivos estáticos listos para producción. Si ves errores, corrígelos antes de continuar.

### 2.3 Verificar el archivo `vite.config.ts`

El archivo ya está configurado correctamente. Solo asegúrate de que exista y contenga:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
```

> **Nota:** Puedes eliminar el plugin `lovable-tagger` ya que solo es para desarrollo en Lovable.

### 2.4 Crear archivo `_redirects` para SPA

Como FerreHogar es una Single Page Application (SPA) con React Router, necesitas que todas las rutas redirijan a `index.html`. Crea este archivo:

```bash
# Crear archivo en public/_redirects
echo "/*    /index.html   200" > public/_redirects
```

Contenido del archivo `public/_redirects`:
```
/*    /index.html   200
```

Esto evita errores 404 cuando el usuario accede directamente a rutas como `/productos` o `/carrito`.

---

## 3. Crear Cuenta en Render

1. Ve a [https://render.com/](https://render.com/)
2. Haz clic en **"Get Started for Free"**
3. **Recomendado:** Regístrate con tu cuenta de GitHub para facilitar la conexión de repositorios
4. Confirma tu correo electrónico si es necesario
5. Completa el proceso de registro

---

## 4. Subir Código a GitHub

### 4.1 Crear repositorio en GitHub

1. Ve a [https://github.com/new](https://github.com/new)
2. Nombre del repositorio: `ferrehogar` (o el nombre que prefieras)
3. Selecciona **Private** (privado) para proteger tu código
4. **NO** marques "Initialize with README" (ya tenemos uno)
5. Haz clic en **"Create repository"**

### 4.2 Subir el código

Ejecuta estos comandos en la terminal, dentro de la carpeta del proyecto:

```bash
# Inicializar git (si no está inicializado)
git init

# Asegúrate de tener un .gitignore adecuado
# Debe incluir al menos:
# node_modules/
# dist/
# .env

# Agregar todos los archivos
git add .

# Crear el primer commit
git commit -m "feat: versión inicial de FerreHogar"

# Conectar con el repositorio remoto (reemplaza TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/ferrehogar.git

# Subir el código
git branch -M main
git push -u origin main
```

### 4.3 Verificar

Ve a tu repositorio en GitHub y confirma que todos los archivos se subieron correctamente.

---

## 5. Desplegar como Static Site en Render

FerreHogar es una app frontend (React + Vite), por lo que la desplegamos como **Static Site** en Render.

### 5.1 Crear nuevo Static Site

1. Inicia sesión en [Render Dashboard](https://dashboard.render.com/)
2. Haz clic en **"New +"** → **"Static Site"**
3. Si te registraste con GitHub, verás tus repositorios. Si no:
   - Haz clic en **"Connect GitHub"**
   - Autoriza a Render a acceder a tus repositorios
4. Selecciona el repositorio **ferrehogar**

### 5.2 Configurar el despliegue

Completa el formulario con estos datos:

| Campo | Valor |
|-------|-------|
| **Name** | `ferrehogar` |
| **Region** | Selecciona la más cercana a Cuba (ej: `Ohio (US East)`) |
| **Branch** | `main` |
| **Root Directory** | *(dejar vacío)* |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

### 5.3 Configurar las Rewrite Rules (Importante para SPA)

En la sección **"Redirects/Rewrites"** de la configuración, agrega esta regla:

| Source | Destination | Action |
|--------|-------------|--------|
| `/*` | `/index.html` | **Rewrite** |

> ⚠️ **IMPORTANTE:** Sin esta regla, las rutas como `/productos`, `/carrito`, `/login` darán error 404 al acceder directamente.

### 5.4 Crear el Static Site

Haz clic en **"Create Static Site"** y espera a que Render construya y despliegue tu aplicación.

El proceso tarda entre **2 y 5 minutos**. Verás el log de construcción en tiempo real.

### 5.5 Verificar el despliegue

Una vez completado, Render te dará una URL como:

```
https://ferrehogar.onrender.com
```

Abre esa URL en tu navegador y verifica que la aplicación carga correctamente.

---

## 6. Configurar Variables de Entorno

### 6.1 Variables necesarias

FerreHogar necesita estas variables de entorno para conectarse al backend:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | URL de tu proyecto Supabase | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave pública (anon key) de Supabase | `eyJhbGciOiJIUzI1NiIs...` |

> **Nota:** Estas son claves **públicas** (anon key). Son seguras para el frontend ya que la seguridad la manejan las Row Level Security (RLS) policies en Supabase.

### 6.2 Agregar variables en Render

1. Ve a tu Static Site en el dashboard de Render
2. Haz clic en **"Environment"** en el menú lateral izquierdo
3. En la sección **"Environment Variables"**, haz clic en **"Add Environment Variable"**
4. Agrega la primera variable:
   - **Key:** `VITE_SUPABASE_URL`
   - **Value:** `https://qteipiljcipcvovjfwtf.supabase.co`
5. Haz clic en **"Add Environment Variable"** nuevamente para agregar la segunda:
   - **Key:** `VITE_SUPABASE_PUBLISHABLE_KEY`
   - **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZWlwaWxqY2lwY3Zvdmpmd3RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNjUzNTksImV4cCI6MjA4NDc0MTM1OX0.C3ONaqQv_Ww25xE5x3U6zedQAX5KO8ss1WQCsNIG1jo`
6. Haz clic en **"Save Changes"** en la parte superior

> **💡 Tip:** También puedes usar el botón **"Add from .env"** y pegar el contenido de tu archivo `.env`, pero recuerda que Render solo reconocerá las variables que comiencen con `VITE_`.

### 6.3 Re-desplegar

Después de agregar las variables, necesitas hacer un nuevo despliegue:

1. Ve a la pestaña **"Deploys"** en el menú lateral
2. Haz clic en **"Deploy latest commit"** (botón morado)
3. Espera a que termine la construcción (2-5 minutos)

> **⚠️ IMPORTANTE:** Las variables con prefijo `VITE_` se inyectan en **tiempo de compilación** (build time), no en tiempo de ejecución. Por eso es **obligatorio** re-desplegar después de cambiarlas.

---

## 7. Configurar Dominio Personalizado (Opcional)

### 7.1 En Render

1. Ve a tu Static Site → **"Settings"** → **"Custom Domains"**
2. Haz clic en **"Add Custom Domain"**
3. Escribe tu dominio (ej: `ferrehogar.com` o `tienda.tudominio.com`)
4. Render te mostrará los registros DNS que necesitas configurar

### 7.2 En tu proveedor de dominios

Agrega los registros DNS que te indica Render:

**Para dominio raíz (ferrehogar.com):**
| Tipo | Nombre | Valor |
|------|--------|-------|
| `A` | `@` | IP que te da Render |

**Para subdominio (tienda.tudominio.com):**
| Tipo | Nombre | Valor |
|------|--------|-------|
| `CNAME` | `tienda` | `ferrehogar.onrender.com` |

### 7.3 SSL/HTTPS

Render configura automáticamente un certificado SSL gratuito (Let's Encrypt) para tu dominio personalizado. Puede tardar unos minutos en activarse.

---

## 8. Despliegue Automático (CI/CD)

### Despliegue automático con cada push

Por defecto, Render ya tiene **auto-deploy** activado. Cada vez que hagas `git push` a la rama `main`, Render:

1. Detecta el nuevo commit
2. Ejecuta `npm install && npm run build`
3. Publica los archivos de `dist/`

### Flujo de trabajo recomendado

```bash
# 1. Hacer cambios en el código
# 2. Probar localmente
npm run build
npm run preview    # Vista previa en http://localhost:4173

# 3. Subir cambios
git add .
git commit -m "feat: descripción del cambio"
git push origin main

# 4. Render despliega automáticamente (2-5 min)
```

### Desactivar auto-deploy (opcional)

Si prefieres controlar cuándo se despliega:

1. Ve a **Settings** → **Build & Deploy**
2. Cambia **"Auto-Deploy"** a **"No"**
3. Para desplegar manualmente: **Deploys** → **"Deploy latest commit"**

---

## 9. Limitaciones del Plan Gratuito

### Lo que incluye el plan gratuito de Render

| Característica | Detalle |
|----------------|---------|
| **Static Sites** | ✅ **Ilimitados** y **siempre gratis** |
| **Ancho de banda** | 100 GB/mes |
| **Builds** | 500 minutos de build/mes |
| **SSL/HTTPS** | ✅ Incluido gratis |
| **CDN Global** | ✅ Incluido |
| **Auto-Deploy** | ✅ Incluido |
| **Dominio personalizado** | ✅ Incluido |
| **Headers personalizados** | ✅ Incluido |
| **Redirects/Rewrites** | ✅ Incluido |

### Limitaciones importantes

| Limitación | Detalle |
|------------|---------|
| **Sin backend** | Static Sites no ejecutan código del servidor. Tu backend sigue en Supabase/Lovable Cloud |
| **Sin Edge Functions** | Las Edge Functions se siguen ejecutando desde Supabase, no desde Render |
| **Velocidad de build** | Puede ser más lento que en planes pagos |
| **Soporte** | Solo soporte comunitario en plan gratuito |

### ¿Qué pasa con el backend?

> **FerreHogar usa Supabase como backend.** Render solo aloja el frontend (archivos HTML, CSS, JS). El backend (base de datos, autenticación, Edge Functions, almacenamiento) sigue funcionando desde Supabase de forma independiente.
>
> No necesitas desplegar el backend en Render. Solo el frontend.

---

## 10. Solución de Problemas Comunes

### ❌ Error: "Build failed"

**Causa:** Errores de compilación en el código.

**Solución:**
```bash
# Ejecuta el build localmente para ver los errores
npm run build
# Corrige los errores y vuelve a hacer push
```

### ❌ Error 404 al navegar a rutas

**Causa:** Falta la configuración de rewrite para SPA.

**Solución:** Verifica que tienes la regla de rewrite configurada:
- **Source:** `/*`
- **Destination:** `/index.html`
- **Action:** Rewrite

Y/o que existe el archivo `public/_redirects` con:
```
/*    /index.html   200
```

### ❌ La app carga pero no muestra datos

**Causa:** Variables de entorno no configuradas o incorrectas.

**Solución:**
1. Verifica las variables en **Environment** del dashboard
2. Asegúrate de que las claves de Supabase son correctas
3. **Re-despliega** después de cambiar variables (obligatorio con Vite)

### ❌ CORS errors en la consola

**Causa:** Supabase no tiene tu dominio de Render en la lista de orígenes permitidos.

**Solución:**
1. Ve a tu proyecto en Supabase Dashboard
2. **Settings** → **API** → **Additional Redirect URLs**
3. Agrega `https://ferrehogar.onrender.com` (tu URL de Render)
4. En **Authentication** → **URL Configuration**, agrega tu dominio de Render en **Site URL** y **Redirect URLs**

### ❌ Las imágenes no cargan

**Causa:** Las imágenes están en Supabase Storage con URLs absolutas.

**Solución:** Las URLs de Supabase Storage son públicas y funcionan desde cualquier dominio. Verifica que los buckets tengan política de acceso público.

### ❌ El Service Worker no funciona

**Causa:** El SW necesita HTTPS.

**Solución:** Render ya incluye HTTPS gratis. Asegúrate de acceder por `https://` y no `http://`.

### ❌ Build muy lento

**Solución:** 
1. Asegúrate de que `node_modules/` está en `.gitignore`
2. No subas la carpeta `dist/` al repositorio
3. Considera usar el cache de Render (activado por defecto)

---

## 📝 Resumen Rápido

```
1. npm run build              → Verificar que compila
2. git push origin main       → Subir a GitHub
3. Render → New Static Site   → Conectar repositorio
4. Build Command:             → npm install && npm run build
5. Publish Directory:         → dist
6. Rewrite Rule:              → /* → /index.html (Rewrite)
7. Environment Variables:     → VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY
8. Deploy                     → ¡Listo! 🎉
```

---

## 🔗 Enlaces Útiles

- [Render Dashboard](https://dashboard.render.com/)
- [Render Docs - Static Sites](https://docs.render.com/static-sites)
- [Render Docs - Environment Variables](https://docs.render.com/configure-environment-variables)
- [Render Docs - Custom Domains](https://docs.render.com/custom-domains)
- [Render Docs - Redirects & Rewrites](https://docs.render.com/redirects-rewrites)
- [Vite - Deploying a Static Site](https://vitejs.dev/guide/static-deploy.html)

---

> 📅 Última actualización: Marzo 2026
