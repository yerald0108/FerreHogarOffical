# 🔧 FerreHogar — E-Commerce de Ferretería para Cuba

> Plataforma de comercio electrónico completa para una ferretería con entrega a domicilio en las 16 provincias de Cuba. Soporte multi-moneda, gestión de pedidos en tiempo real, y panel de administración.

---

## 📑 Tabla de Contenidos

- [Visión General](#visión-general)
- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura del Proyecto](#arquitectura-del-proyecto)
- [Estructura de Archivos](#estructura-de-archivos)
- [Base de Datos](#base-de-datos)
- [Autenticación y Roles](#autenticación-y-roles)
- [Funcionalidades Principales](#funcionalidades-principales)
- [Estado del Cliente (Zustand)](#estado-del-cliente-zustand)
- [Edge Functions](#edge-functions)
- [Seguridad (RLS)](#seguridad-rls)
- [SEO y PWA](#seo-y-pwa)
- [Guía para Escalar](#guía-para-escalar)
- [Variables de Entorno](#variables-de-entorno)
- [Scripts Disponibles](#scripts-disponibles)
- [Desarrollo Local](#desarrollo-local)

---

## Visión General

FerreHogar es una aplicación web SPA (Single Page Application) diseñada para el mercado cubano. Permite a los clientes explorar un catálogo de productos de ferretería, filtrar por categorías, agregar productos al carrito, aplicar cupones de descuento y realizar pedidos con entrega a domicilio.

### Características principales

| Módulo | Descripción |
|--------|-------------|
| 🛒 Carrito | Persistente en localStorage vía Zustand, validación de stock en tiempo real |
| 💰 Multi-moneda | Precios en CUP + monedas adicionales (USD, EUR, Zelle) por producto |
| 📦 Pedidos | Flujo completo: pendiente → confirmado → preparando → enviado → entregado |
| 👤 Autenticación | Email con verificación, recuperación de contraseña |
| 🔐 Roles | Admin, Gestor, Usuario — con RBAC vía funciones `SECURITY DEFINER` |
| ⭐ Reseñas | Solo compradores verificados pueden dejar reseñas |
| ❤️ Favoritos | Lista de deseos persistente en base de datos |
| 🎟️ Cupones | Descuentos porcentuales o fijos con validación server-side |
| 📊 Admin Panel | Dashboard con estadísticas, gestión de productos/categorías/pedidos/usuarios |
| 🔔 Alertas de stock | Notificación cuando un producto vuelve a estar disponible |
| 📱 PWA | Service Worker, manifest.json, iconos para instalación en móvil |
| 🔍 SEO | Meta tags dinámicos, JSON-LD, sitemap.xml, robots.txt |

---

## Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| **Frontend** | React 18 + TypeScript | UI declarativa con tipado fuerte |
| **Build** | Vite | Bundler ultra-rápido con HMR |
| **Estilos** | Tailwind CSS + shadcn/ui | Sistema de diseño con tokens semánticos |
| **Estado global** | Zustand | Carrito de compras persistente |
| **Data fetching** | TanStack React Query | Cache, refetch automático, estado de carga |
| **Routing** | React Router v6 | Rutas lazy-loaded con code splitting |
| **Animaciones** | Framer Motion | Transiciones de página y micro-interacciones |
| **Backend** | Supabase (Lovable Cloud) | PostgreSQL, Auth, Storage, Edge Functions |
| **Validación** | Zod + React Hook Form | Validación de formularios client y server-side |

---

## Arquitectura del Proyecto

```
┌─────────────────────────────────────────────────┐
│                   CLIENTE (SPA)                  │
│                                                  │
│  React + Vite + Tailwind + shadcn/ui            │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  Zustand  │ │  React   │ │  React Router    │ │
│  │  (Cart)   │ │  Query   │ │  (Lazy Loading)  │ │
│  └──────────┘ └────┬─────┘ └──────────────────┘ │
│                     │                            │
└─────────────────────┼────────────────────────────┘
                      │ HTTPS (REST + Realtime)
┌─────────────────────┼────────────────────────────┐
│              LOVABLE CLOUD (Supabase)            │
│                     │                            │
│  ┌─────────────┐ ┌──┴───────┐ ┌───────────────┐ │
│  │   Auth      │ │ PostgREST│ │ Edge Functions │ │
│  │  (JWT)      │ │  (API)   │ │  (Deno)       │ │
│  └─────────────┘ └──┬───────┘ └───────────────┘ │
│                     │                            │
│  ┌──────────────────┴──────────────────────────┐ │
│  │           PostgreSQL Database               │ │
│  │  ┌─────┐ ┌────────┐ ┌─────────┐ ┌────────┐ │ │
│  │  │ RLS │ │Triggers│ │Functions│ │ Enums  │ │ │
│  │  └─────┘ └────────┘ └─────────┘ └────────┘ │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  ┌──────────────────────────────────────────────┐│
│  │           Storage (product-images)           ││
│  └──────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

---

## Estructura de Archivos

```
src/
├── App.tsx                    # Router principal, providers, layout global
├── main.tsx                   # Entry point
├── index.css                  # Tokens CSS (colores, tipografía, tema dark/light)
│
├── components/
│   ├── Header.tsx             # Navegación principal, búsqueda, menú usuario
│   ├── Footer.tsx             # Footer con enlaces, contacto, legal
│   ├── BottomNav.tsx          # Navegación inferior móvil (bottom tab bar)
│   ├── BackToTop.tsx          # Botón flotante "volver arriba"
│   ├── WhatsAppFAB.tsx        # Botón flotante WhatsApp para soporte
│   ├── ProductCard.tsx        # Tarjeta de producto (ratings, precios multi-moneda)
│   ├── ProductGallery.tsx     # Galería de imágenes del producto
│   ├── GlobalSearch.tsx       # Búsqueda global con Ctrl+K
│   ├── HeroSection.tsx        # Banner principal del homepage
│   ├── Testimonials.tsx       # Social proof en homepage
│   ├── ShareButton.tsx        # Compartir producto (WhatsApp, copiar link)
│   ├── RecentlyViewed.tsx     # Productos vistos recientemente
│   ├── RelatedProducts.tsx    # Productos relacionados
│   ├── FavoriteButton.tsx     # Botón de favorito (corazón)
│   ├── MiniCart.tsx           # Preview del carrito tras agregar producto
│   ├── OrderTimeline.tsx      # Timeline visual del estado del pedido
│   ├── SEOHead.tsx            # Meta tags dinámicos + JSON-LD
│   ├── Breadcrumbs.tsx        # Migas de pan para navegación
│   ├── CategoryCard.tsx       # Tarjeta de categoría en homepage
│   ├── CategoryIcon.tsx       # Iconos dinámicos por categoría (Lucide)
│   ├── StockAlertForm.tsx     # Formulario "avisame cuando haya stock"
│   ├── MultiCurrencyDisplay.tsx # Display de precios en múltiples monedas
│   │
│   ├── admin/                 # Componentes del panel de administración
│   │   ├── AdminDashboard.tsx # Estadísticas generales
│   │   ├── AdminProducts.tsx  # CRUD de productos
│   │   ├── AdminCategories.tsx# CRUD de categorías
│   │   ├── AdminOrders.tsx    # Gestión de pedidos
│   │   ├── AdminUsers.tsx     # Gestión de usuarios y roles
│   │   ├── AdminCoupons.tsx   # Gestión de cupones
│   │   ├── AdminReviews.tsx   # Moderación de reseñas
│   │   ├── AdminMessages.tsx  # Mensajes de contacto
│   │   └── AdminReports.tsx   # Reportes y analytics
│   │
│   ├── checkout/              # Flujo de checkout multi-paso
│   │   ├── CheckoutProgress.tsx # Indicador de progreso
│   │   ├── StepContactInfo.tsx  # Paso 1: datos de contacto
│   │   ├── StepDelivery.tsx     # Paso 2: dirección y envío
│   │   ├── StepPayment.tsx      # Paso 3: método de pago
│   │   └── OrderSummary.tsx     # Resumen lateral del pedido
│   │
│   ├── register/              # Registro multi-paso
│   │   ├── StepPersonalData.tsx
│   │   ├── StepAddress.tsx
│   │   ├── StepPassword.tsx
│   │   ├── PasswordStrengthMeter.tsx
│   │   └── TermsModal.tsx
│   │
│   ├── reviews/               # Sistema de reseñas
│   │   ├── ReviewForm.tsx
│   │   ├── ReviewList.tsx
│   │   └── StarRating.tsx
│   │
│   ├── skeletons/             # Loading states
│   │   ├── ProductCardSkeleton.tsx
│   │   ├── ProductDetailSkeleton.tsx
│   │   └── CategoryCardSkeleton.tsx
│   │
│   └── ui/                    # shadcn/ui components (no modificar directamente)
│
├── hooks/
│   ├── useAuth.tsx            # Context de autenticación (user, roles, signIn/Out)
│   ├── useProducts.ts         # Query: productos y categorías
│   ├── useProductPrices.ts    # Query: precios multi-moneda
│   ├── useOrders.ts           # Query: pedidos del usuario
│   ├── useReviews.ts          # Query: reseñas, ratings, compra verificada
│   ├── useFavorites.ts        # Query + mutations: favoritos
│   ├── useBulkRatings.ts      # Query: ratings en batch para listas
│   ├── useCoupon.ts           # Validación de cupones
│   ├── useProfile.ts          # Query + mutation: perfil de usuario
│   ├── useAdminStats.ts       # Query: estadísticas del dashboard admin
│   ├── useCartPrices.ts       # Cálculo de totales multi-moneda del carrito
│   ├── useStockValidation.ts  # Validación de stock vía RPC
│   ├── useRecentlyViewed.ts   # Zustand store: historial de productos vistos
│   ├── useRateLimit.ts        # Rate limiting en acciones del usuario
│   ├── useTheme.ts            # Toggle dark/light mode
│   └── use-mobile.tsx         # Detección de viewport móvil
│
├── pages/
│   ├── Index.tsx              # Homepage (hero, categorías, productos destacados)
│   ├── Products.tsx           # Catálogo con filtros, ordenamiento, paginación
│   ├── ProductDetail.tsx      # Detalle de producto (galería, reseñas, related)
│   ├── Cart.tsx               # Carrito de compras con validación de stock
│   ├── Checkout.tsx           # Flujo de checkout multi-paso
│   ├── OrderConfirmation.tsx  # Confirmación post-compra con confetti
│   ├── MyOrders.tsx           # Historial de pedidos (cancelar, repetir, timeline)
│   ├── Login.tsx              # Inicio de sesión
│   ├── Register.tsx           # Registro multi-paso
│   ├── ForgotPassword.tsx     # Recuperación de contraseña
│   ├── ResetPassword.tsx      # Restablecimiento de contraseña
│   ├── Profile.tsx            # Perfil (datos, cambio de contraseña)
│   ├── Favorites.tsx          # Lista de favoritos
│   ├── Admin.tsx              # Panel de administración (tabs)
│   ├── GestorPanel.tsx        # Panel para gestores (subset del admin)
│   ├── About.tsx              # Sobre nosotros
│   ├── Contact.tsx            # Formulario de contacto
│   ├── FAQ.tsx                # Preguntas frecuentes (acordeón)
│   ├── Terms.tsx              # Términos y condiciones
│   ├── Privacy.tsx            # Política de privacidad
│   └── NotFound.tsx           # 404 con sugerencias de productos
│
├── lib/
│   ├── store.ts               # Zustand cart store (Product, CartItem types)
│   ├── utils.ts               # Utilidades (cn para classnames)
│   └── validators.ts          # Validaciones de formularios
│
├── data/
│   └── cuba-locations.ts      # Provincias y municipios de Cuba
│
├── integrations/supabase/
│   ├── client.ts              # Cliente Supabase (AUTO-GENERADO, no editar)
│   └── types.ts               # Tipos TypeScript del schema (AUTO-GENERADO)
│
supabase/
├── config.toml                # Configuración del proyecto (AUTO-GENERADO)
└── functions/
    ├── send-order-confirmation/index.ts   # Email de confirmación de pedido
    └── send-order-status-update/index.ts  # Email de cambio de estado
```

---

## Base de Datos

### Diagrama Entidad-Relación

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│  categories  │     │   products   │     │  product_images  │
│──────────────│     │──────────────│     │──────────────────│
│ id (PK)      │◄────│ category_id  │     │ product_id (FK)  │
│ name         │     │ id (PK)      │────►│ image_url        │
│ icon         │     │ name         │     │ display_order    │
└──────────────┘     │ price (CUP)  │     └──────────────────┘
                     │ stock        │
                     │ is_active    │     ┌──────────────────┐
                     │ image_url    │     │  product_prices  │
                     │ description  │     │──────────────────│
                     │ created_by   │────►│ product_id (FK)  │
                     └──────┬───────┘     │ currency (USD..) │
                            │             │ price            │
                            │             └──────────────────┘
                            │
                            │             ┌──────────────────────┐
                            │             │ product_payment_     │
                            │             │ methods              │
                            │             │──────────────────────│
                            └────────────►│ product_id (FK)      │
                            │             │ method               │
                            │             └──────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
     ┌──────────────┐ ┌──────────┐ ┌──────────────┐
     │   reviews    │ │favorites │ │ stock_alerts  │
     │──────────────│ │──────────│ │──────────────│
     │ product_id   │ │product_id│ │ product_id   │
     │ user_id      │ │ user_id  │ │ user_id      │
     │ rating (1-5) │ └──────────┘ │ email/phone  │
     │ comment      │              │ notified     │
     │ is_visible   │              └──────────────┘
     └──────────────┘

┌──────────────┐     ┌──────────────┐     ┌─────────────────────┐
│    orders    │     │ order_items  │     │ order_status_history│
│──────────────│     │──────────────│     │─────────────────────│
│ id (PK)      │────►│ order_id(FK) │     │ order_id (FK)       │
│ user_id      │     │ product_id   │     │ previous_status     │
│ status       │     │ product_name │     │ new_status          │
│ total_amount │     │ quantity     │     │ changed_by          │
│ delivery_*   │     │ price_at_    │     └─────────────────────┘
│ payment_*    │     │  purchase    │
│ coupon_code  │     └──────────────┘
│ province     │
└──────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   profiles   │     │  user_roles  │     │   coupons    │
│──────────────│     │──────────────│     │──────────────│
│ user_id      │     │ user_id      │     │ code         │
│ full_name    │     │ role (enum)  │     │ discount_type│
│ phone        │     │  admin       │     │ discount_val │
│ address      │     │  gestor      │     │ max_uses     │
│ province     │     │  user        │     │ current_uses │
│ municipality │     └──────────────┘     │ expires_at   │
│ email        │                          │ min_order_amt│
└──────────────┘                          └──────────────┘

┌──────────────────┐
│ contact_messages │
│──────────────────│
│ name, email      │
│ phone, subject   │
│ message, is_read │
└──────────────────┘
```

### Enums

```sql
-- Estado del pedido
CREATE TYPE order_status AS ENUM (
  'pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'
);

-- Roles de usuario
CREATE TYPE app_role AS ENUM ('admin', 'user', 'gestor');
```

### Funciones de Base de Datos

| Función | Tipo | Propósito |
|---------|------|-----------|
| `is_admin(uuid)` | `SECURITY DEFINER` | Verifica si un usuario es admin |
| `is_gestor(uuid)` | `SECURITY DEFINER` | Verifica si un usuario es gestor |
| `has_role(uuid, app_role)` | `SECURITY DEFINER` | Verifica un rol específico |
| `user_owns_order(uuid, uuid)` | `SECURITY DEFINER` | Verifica propiedad de un pedido |
| `check_stock_availability(jsonb)` | `SECURITY DEFINER` | Valida stock de múltiples productos |
| `validate_coupon(text, numeric)` | `SECURITY DEFINER` | Valida y calcula descuento de cupón |
| `update_updated_at_column()` | Trigger | Auto-actualiza `updated_at` |
| `log_order_status_change()` | Trigger | Registra cambios de estado en historial |
| `reduce_stock_on_order_confirm()` | Trigger | Reduce/restaura stock al confirmar/cancelar |
| `increment_coupon_usage()` | Trigger | Incrementa uso del cupón al crear pedido |

---

## Autenticación y Roles

### Flujo de Autenticación

```
1. Usuario se registra → email de verificación
2. Confirma email → puede iniciar sesión
3. Al iniciar sesión → AuthProvider verifica roles via RPC
4. Roles determinan acceso a rutas y funcionalidades
```

### Sistema de Roles (RBAC)

| Rol | Acceso |
|-----|--------|
| `user` | Comprar, reseñar, gestionar perfil y pedidos |
| `gestor` | Todo lo de user + CRUD de productos propios |
| `admin` | Acceso completo: usuarios, pedidos, categorías, cupones, reportes |

> ⚠️ Los roles se almacenan en `user_roles` (tabla separada), **nunca** en `profiles`. Esto previene ataques de escalación de privilegios.

### Verificación de Roles (Server-side)

```sql
-- Las funciones SECURITY DEFINER bypasean RLS para evitar recursión
CREATE FUNCTION is_admin(_user_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = 'admin'
  )
$$;
```

---

## Funcionalidades Principales

### 🛒 Carrito de Compras

- **Store**: `src/lib/store.ts` — Zustand con `persist` middleware (localStorage)
- **Validación de stock**: Al entrar al carrito, se consultan precios y stock actuales desde la BD
- **Multi-moneda**: `useCartPrices` hook calcula totales por moneda
- **Protecciones UX**: Confirmación antes de vaciar, toast al eliminar/agregar

### 📦 Flujo de Pedidos

```
Carrito → Checkout (3 pasos) → Validación de stock → Crear pedido → Confirmación
                                                        ↓
                                               Edge Function:
                                            send-order-confirmation
```

**Cambios de estado** disparan automáticamente:
- `log_order_status_change()` — Registra en `order_status_history`
- `reduce_stock_on_order_confirm()` — Reduce stock al confirmar, restaura al cancelar
- `increment_coupon_usage()` — Incrementa usos del cupón

### 💰 Sistema Multi-Moneda

Cada producto tiene un precio base en CUP (`products.price`) y precios opcionales en otras monedas (`product_prices` tabla). El carrito calcula totales por cada moneda disponible.

### ⭐ Sistema de Reseñas

- Solo **compradores verificados** pueden dejar reseñas
- Verificación: `order_items` con `orders.status IN ('confirmed','preparing','shipped','delivered')`
- Moderación: Admin puede ocultar reseñas (`is_visible`)
- Bulk ratings: `useBulkRatings` hook optimiza N+1 queries en listas

### 🔍 Búsqueda y Filtros

- **GlobalSearch** (`Ctrl+K`): Búsqueda full-text en productos
- **Filtros**: Categoría, rango de precio, disponibilidad
- **Ordenamiento**: Precio ↑↓, nombre A-Z, más recientes
- **Paginación**: "Cargar más" con conteo de restantes

---

## Estado del Cliente (Zustand)

### Cart Store (`src/lib/store.ts`)

```typescript
interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}
```

### Recently Viewed Store (`src/hooks/useRecentlyViewed.ts`)

```typescript
interface RecentlyViewedStore {
  ids: string[];           // Últimos 10 IDs de productos vistos
  add: (id: string) => void;
}
```

Ambos stores usan `persist` middleware para mantener estado entre sesiones.

---

## Edge Functions

| Función | Ruta | Propósito |
|---------|------|-----------|
| `send-order-confirmation` | `POST` | Envía email de confirmación al crear pedido |
| `send-order-status-update` | `POST` | Envía email cuando cambia el estado del pedido |

### Secrets necesarios

| Secret | Propósito |
|--------|-----------|
| `RESEND_API_KEY` | API key de Resend para envío de emails |
| `SUPABASE_URL` | URL del proyecto (auto-configurado) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (auto-configurado) |

---

## Seguridad (RLS)

Todas las tablas tienen Row Level Security (RLS) habilitado. Resumen de políticas:

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `products` | Activos: público / Inactivos: admin | Admin + Gestor | Admin o Gestor (propios) | Admin |
| `categories` | Público | Admin | Admin | Admin |
| `orders` | Propios o Admin | Auth (propio user_id) | Propios o Admin | ❌ |
| `order_items` | Propios o Admin | Propios o Admin | ❌ | ❌ |
| `profiles` | Propios o Admin | Propios | Propios | ❌ |
| `reviews` | Visibles o Admin | Auth (propio) | Propios o Admin | Propios o Admin |
| `favorites` | Propios | Propios | ❌ | Propios |
| `user_roles` | Propios o Admin | Admin | ❌ | Admin |
| `coupons` | Activos: público | Admin | Admin | Admin |
| `contact_messages` | Admin | Público | Admin | ❌ |
| `product_prices` | Público | Admin + Gestor | Admin + Gestor | Admin + Gestor |
| `product_images` | Público | Admin + Gestor | Admin + Gestor | Admin + Gestor |
| `stock_alerts` | Propios o Admin | Público | Admin | Admin |

---

## SEO y PWA

### SEO

- **`SEOHead` component**: Meta tags dinámicos con `react-helmet-async`
- **JSON-LD**: Schema.org `Product` con `AggregateRating` en detalle de producto
- **`sitemap.xml`**: Mapa del sitio estático en `/public`
- **`robots.txt`**: Configuración para crawlers
- **Semantic HTML**: `<main>`, `<section>`, `<nav>`, `<article>`

### PWA

- **`manifest.json`**: Configuración de app instalable
- **`sw.js`**: Service Worker básico
- **Iconos**: 192x192 y 512x512 para instalación

---

## Guía para Escalar

### 🔄 Rendimiento

1. **Imágenes**: Migrar a un CDN con transformaciones (ej: Cloudflare Images, imgix). Actualmente se usan URLs de Unsplash.
2. **Paginación server-side**: Actualmente se cargan todos los productos y se paginan en cliente. Para >100 productos, implementar `range` queries en Supabase.
3. **Search**: Para búsqueda avanzada, considerar Supabase Full-Text Search (`to_tsvector`/`to_tsquery`) o Algolia/Meilisearch.
4. **Caché**: React Query ya cachea con `staleTime: 30s`. Ajustar según necesidades.

### 📊 Analytics

- Integrar un servicio de analytics (ej: Plausible, PostHog)
- Trackear: vistas de producto, add-to-cart rate, abandono de checkout

### 💳 Pagos

- Integrar pasarela de pago (ej: Stripe, TropiPay para Cuba)
- Actualmente el pago es offline (transferencia, efectivo)

### 📧 Emails Transaccionales

- Las Edge Functions usan Resend. Considerar plantillas HTML más elaboradas.
- Agregar emails para: bienvenida, carrito abandonado, producto en stock

### 🌐 Internacionalización (i18n)

- Actualmente todo está en español
- Para multi-idioma: usar `react-i18next` con archivos de traducción

### 📱 App Nativa

- La PWA actual es instalable en móvil
- Para app nativa: considerar Capacitor (React → iOS/Android)

### 🔒 Seguridad Adicional

- Implementar rate limiting en Edge Functions
- Agregar CAPTCHA en registro y contacto
- Configurar CSP headers
- Auditoría de dependencias periódica (`npm audit`)

### 📦 Inventario Avanzado

- Sistema de variantes (talla, color)
- Precios por volumen / mayoreo
- Gestión de almacenes múltiples
- Códigos de barras / SKU

### 🚚 Logística

- Integración con servicios de mensajería
- Cálculo de costos de envío por provincia
- Tracking de envíos en tiempo real

---

## Variables de Entorno

Las siguientes variables son auto-configuradas por Lovable Cloud:

| Variable | Descripción |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto backend |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave pública (anon key) |
| `VITE_SUPABASE_PROJECT_ID` | ID del proyecto |

> ⚠️ **No editar** `.env`, `supabase/config.toml`, ni `src/integrations/supabase/client.ts` — son auto-generados.

---

## Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo (Vite)

# Build
npm run build        # Build de producción

# Tests
npm run test         # Ejecuta tests con Vitest

# Lint
npm run lint         # Verifica código con ESLint
```

---

## Desarrollo Local

```bash
# 1. Clonar el repositorio
git clone <YOUR_GIT_URL>

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

> La app se conecta automáticamente al backend en la nube. No es necesario configurar variables de entorno localmente.

---

## Convenciones de Código

| Convención | Detalle |
|-----------|---------|
| **Componentes** | PascalCase, un componente por archivo |
| **Hooks** | `use` prefix, archivo separado en `src/hooks/` |
| **Estilos** | Tokens semánticos de Tailwind (`bg-primary`, no `bg-blue-500`) |
| **Queries** | React Query con `queryKey` descriptivo |
| **Estado** | Zustand para global persistente, `useState` para local |
| **Formularios** | React Hook Form + Zod para validación |
| **Imports** | Alias `@/` apunta a `src/` |
| **Archivos auto-generados** | No editar: `client.ts`, `types.ts`, `config.toml`, `.env` |

---

## Licencia

Proyecto privado. Todos los derechos reservados © FerreHogar.
