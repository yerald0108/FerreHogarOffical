# 🔧 FerreHogar — E-Commerce de Ferretería para Cuba

> Plataforma de comercio electrónico completa para una ferretería con entrega a domicilio en las 16 provincias de Cuba. Soporte multi-moneda, gestión de pedidos en tiempo real, notificaciones push, y panel de administración.

---

## 📑 Tabla de Contenidos

- [Visión General](#visión-general)
- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura del Proyecto](#arquitectura-del-proyecto)
- [Estructura de Archivos](#estructura-de-archivos)
- [Base de Datos](#base-de-datos)
- [Autenticación y Roles](#autenticación-y-roles)
- [Funcionalidades Principales](#funcionalidades-principales)
- [Sistema de Notificaciones](#sistema-de-notificaciones)
- [Estado del Cliente (Zustand)](#estado-del-cliente-zustand)
- [Edge Functions](#edge-functions)
- [Seguridad (RLS)](#seguridad-rls)
- [Rendimiento y Optimización](#rendimiento-y-optimización)
- [Accesibilidad (a11y)](#accesibilidad-a11y)
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
| 📊 Barra de progreso | `OrderProgressTracker` animado con Framer Motion en Mis Pedidos y Confirmación |
| ✅ Confirmación de entrega | Botón para que el cliente confirme la recepción del pedido (estado `shipped`) |
| 👤 Autenticación | Email con verificación, recuperación de contraseña |
| 🔐 Roles | Admin, Gestor, Usuario — con RBAC vía funciones `SECURITY DEFINER` |
| 🔔 Notificaciones | Sistema en tiempo real con Supabase Realtime, paginación infinita, badge de no leídas |
| 🔔 Alertas admin | Notificación automática a admins cuando se crea un nuevo pedido |
| ⭐ Reseñas | Solo compradores verificados pueden dejar reseñas |
| ❤️ Favoritos | Lista de deseos persistente con opción de compartir vía link |
| 🎟️ Cupones | Descuentos porcentuales o fijos con validación server-side |
| 📊 Admin Panel | Dashboard con estadísticas, gestión de productos/categorías/pedidos/usuarios/testimonios/banners |
| 🔔 Alertas de stock | Notificación cuando un producto vuelve a estar disponible |
| 📱 PWA | Service Worker, manifest.json, iconos para instalación en móvil |
| 🔍 SEO | Meta tags dinámicos, JSON-LD, sitemap.xml, robots.txt |
| ♿ Accesibilidad | Skip-to-content, aria-labels en botones icon-only, VisuallyHidden en modales |
| 🔄 Realtime | Cache de productos invalidado automáticamente cuando admin edita |

---

## Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| **Frontend** | React 18 + TypeScript | UI declarativa con tipado fuerte |
| **Build** | Vite | Bundler ultra-rápido con HMR |
| **Estilos** | Tailwind CSS + shadcn/ui | Sistema de diseño con tokens semánticos |
| **Estado global** | Zustand | Carrito de compras persistente |
| **Data fetching** | TanStack React Query | Cache, refetch automático, infinite queries |
| **Routing** | React Router v6 | Rutas lazy-loaded con code splitting |
| **Animaciones** | Framer Motion | Transiciones de página y micro-interacciones |
| **Backend** | Supabase (Lovable Cloud) | PostgreSQL, Auth, Storage, Edge Functions, Realtime |
| **Validación** | Zod + React Hook Form | Validación de formularios client y server-side |
| **Confetti** | canvas-confetti | Celebración visual al confirmar pedido |

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
                      │ HTTPS (REST + Realtime WebSocket)
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
│  ┌────────────────┐  ┌─────────────────────────┐ │
│  │ Storage        │  │ Realtime                │ │
│  │ (product-images│  │ (notifications, orders, │ │
│  │  avatars)      │  │  products)              │ │
│  └────────────────┘  └─────────────────────────┘ │
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
│   ├── Header.tsx             # Navegación principal, búsqueda, menú usuario (con aria-labels)
│   ├── Footer.tsx             # Footer con enlaces, contacto, legal
│   ├── BottomNav.tsx          # Navegación inferior móvil (bottom tab bar)
│   ├── BackToTop.tsx          # Botón flotante "volver arriba"
│   ├── WhatsAppFAB.tsx        # Botón flotante WhatsApp para soporte
│   ├── NotificationBell.tsx   # Campana de notificaciones con badge y popover
│   ├── ProductCard.tsx        # Tarjeta de producto (ratings, precios multi-moneda)
│   ├── ProductGallery.tsx     # Galería de imágenes del producto
│   ├── GlobalSearch.tsx       # Búsqueda global con Ctrl+K, historial, empty state
│   ├── HeroSection.tsx        # Banner principal del homepage
│   ├── Testimonials.tsx       # Social proof en homepage
│   ├── ShareButton.tsx        # Compartir producto (WhatsApp, copiar link)
│   ├── RecentlyViewed.tsx     # Productos vistos recientemente
│   ├── RelatedProducts.tsx    # Productos relacionados
│   ├── FavoriteButton.tsx     # Botón de favorito (corazón)
│   ├── MiniCart.tsx           # Preview del carrito tras agregar producto
│   ├── OrderProgressTracker.tsx # Barra de progreso animada del pedido (Framer Motion)
│   ├── OrderTimeline.tsx      # Timeline visual del estado del pedido (legacy)
│   ├── SEOHead.tsx            # Meta tags dinámicos + JSON-LD
│   ├── Breadcrumbs.tsx        # Migas de pan para navegación
│   ├── CategoryCard.tsx       # Tarjeta de categoría en homepage
│   ├── CategoryIcon.tsx       # Iconos dinámicos por categoría (Lucide)
│   ├── StockAlertForm.tsx     # Formulario "avisame cuando haya stock"
│   ├── MultiCurrencyDisplay.tsx # Display de precios en múltiples monedas
│   ├── PriceHistoryChart.tsx  # Gráfico de historial de precios (Recharts)
│   ├── ProductViewTracker.tsx # Tracker de vistas de producto
│   ├── QuickView.tsx          # Vista rápida de producto
│   ├── ScrollReveal.tsx       # Animación de aparición al hacer scroll
│   ├── PageTransition.tsx     # Transición animada entre páginas
│   ├── ErrorBoundary.tsx      # Error boundary global
│   ├── RouteLoadingIndicator.tsx # Indicador de carga entre rutas
│   ├── OptimizedImage.tsx     # Componente de imagen con lazy loading
│   ├── TrustBadges.tsx        # Badges de confianza
│   ├── ScrollToTop.tsx        # Scroll to top en cambio de ruta
│   │
│   ├── admin/                 # Componentes del panel de administración
│   │   ├── AdminDashboard.tsx # Estadísticas generales
│   │   ├── AdminProducts.tsx  # CRUD de productos
│   │   ├── AdminCategories.tsx# CRUD de categorías
│   │   ├── AdminOrders.tsx    # Gestión de pedidos (con notificación al cambiar estado)
│   │   ├── AdminUsers.tsx     # Gestión de usuarios y roles
│   │   ├── AdminCoupons.tsx   # Gestión de cupones
│   │   ├── AdminReviews.tsx   # Moderación de reseñas
│   │   ├── AdminMessages.tsx  # Mensajes de contacto
│   │   ├── AdminBanners.tsx   # Gestión de banners del homepage
│   │   ├── AdminTestimonials.tsx # Gestión de testimonios
│   │   ├── AdminProductViews.tsx # Analytics de vistas de productos
│   │   ├── AdminReports.tsx   # Reportes y analytics
│   │   └── IconPicker.tsx     # Selector de iconos para categorías
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
│   ├── useProducts.ts         # Query: productos y categorías + realtime invalidation
│   ├── useProductPrices.ts    # Query: precios multi-moneda
│   ├── useOrders.ts           # Query: pedidos del usuario + admin + create/update
│   ├── useNotifications.ts    # Query: notificaciones (simple + infinite) + realtime
│   ├── useReviews.ts          # Query: reseñas, ratings, compra verificada
│   ├── useFavorites.ts        # Query + mutations: favoritos
│   ├── useNewFavoritesBadge.ts # Badge de nuevos favoritos
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
│   ├── Index.tsx              # Homepage (hero, categorías, productos destacados, testimonios)
│   ├── Products.tsx           # Catálogo con filtros, ordenamiento, paginación
│   ├── ProductDetail.tsx      # Detalle de producto (galería, reseñas, related, historial precios)
│   ├── Cart.tsx               # Carrito de compras con validación de stock
│   ├── Checkout.tsx           # Flujo de checkout multi-paso
│   ├── OrderConfirmation.tsx  # Confirmación post-compra con confetti + confirmación de entrega
│   ├── MyOrders.tsx           # Historial de pedidos (barra progreso animada, cancelar, repetir, confirmar entrega)
│   ├── Login.tsx              # Inicio de sesión
│   ├── Register.tsx           # Registro multi-paso
│   ├── ForgotPassword.tsx     # Recuperación de contraseña
│   ├── ResetPassword.tsx      # Restablecimiento de contraseña
│   ├── Profile.tsx            # Perfil (datos, cambio de contraseña, avatar)
│   ├── Favorites.tsx          # Lista de favoritos (compartir, empty state con CTA)
│   ├── Notifications.tsx      # Centro de notificaciones con paginación infinita
│   ├── SharedWishlist.tsx     # Lista de deseos compartida (acceso público por código)
│   ├── Admin.tsx              # Panel de administración (tabs)
│   ├── GestorPanel.tsx        # Panel para gestores (subset del admin)
│   ├── About.tsx              # Sobre nosotros
│   ├── Contact.tsx            # Formulario de contacto (con validación anti-spam)
│   ├── FAQ.tsx                # Preguntas frecuentes (acordeón)
│   ├── Terms.tsx              # Términos y condiciones
│   ├── Privacy.tsx            # Política de privacidad
│   ├── Returns.tsx            # Política de devoluciones
│   └── NotFound.tsx           # 404 con sugerencias de productos
│
├── lib/
│   ├── store.ts               # Zustand cart store (Product, CartItem types)
│   ├── utils.ts               # Utilidades (cn para classnames)
│   └── validators.ts          # Validaciones de formularios
│
├── data/
│   └── cuba-locations.ts      # Provincias y municipios de Cuba (16 provincias)
│
├── integrations/supabase/
│   ├── client.ts              # Cliente Supabase (AUTO-GENERADO, no editar)
│   └── types.ts               # Tipos TypeScript del schema (AUTO-GENERADO)
│
supabase/
├── config.toml                # Configuración del proyecto (AUTO-GENERADO)
└── functions/
    ├── send-order-confirmation/index.ts      # Email de confirmación de pedido
    ├── send-order-status-update/index.ts     # Email de cambio de estado
    ├── send-welcome-email/index.ts           # Email de bienvenida al registrarse
    ├── send-abandoned-cart-email/index.ts    # Email de carrito abandonado
    ├── send-back-in-stock-email/index.ts     # Email de producto en stock
    └── send-new-order-admin-notification/index.ts # Email al admin por nuevo pedido
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
                     │ compare_at_  │
                     │  price       │     ┌──────────────────┐
                     │ stock        │     │  product_prices  │
                     │ is_active    │     │──────────────────│
                     │ image_url    │────►│ product_id (FK)  │
                     │ description  │     │ currency (USD..) │
                     │ created_by   │     │ price            │
                     └──────┬───────┘     └──────────────────┘
                            │
                            │             ┌──────────────────────┐
                            │             │ product_payment_     │
                            │             │ methods              │
                            │             │──────────────────────│
                            └────────────►│ product_id (FK)      │
                            │             │ method               │
                            │             └──────────────────────┘
                            │
                            │             ┌──────────────────┐
                            │             │  price_history   │
                            │             │──────────────────│
                            └────────────►│ product_id (FK)  │
                            │             │ price            │
                            │             │ changed_at       │
                            │             └──────────────────┘
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

     ┌──────────────┐
     │ product_views│
     │──────────────│
     │ product_id   │
     │ user_id      │
     │ viewed_at    │
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
│ cancellation_│
│  reason      │
│ tracking_info│
│ admin_notes  │
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
│ avatar_url   │                          └──────────────┘
└──────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ contact_messages │     │  notifications   │     │shared_wishlists  │
│──────────────────│     │──────────────────│     │──────────────────│
│ name, email      │     │ user_id          │     │ user_id          │
│ phone, subject   │     │ title, message   │     │ share_code       │
│ message, is_read │     │ type             │     └──────────────────┘
└──────────────────┘     │ reference_id     │
                         │ is_read          │
┌──────────────────┐     └──────────────────┘
│  testimonials    │
│──────────────────│     ┌──────────────────┐
│ name, text       │     │    banners       │
│ rating, location │     │──────────────────│
│ is_visible       │     │ title, subtitle  │
│ display_order    │     │ image_url        │
└──────────────────┘     │ link_url         │
                         │ is_active        │
                         │ display_order    │
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
| `log_price_change()` | Trigger | Registra cambios de precio en `price_history` |
| `reduce_stock_on_order_confirm()` | Trigger | Reduce stock al confirmar, restaura al cancelar |
| `increment_coupon_usage()` | Trigger | Incrementa uso del cupón al crear pedido |
| `notify_order_status_change()` | Trigger | Crea notificación al usuario cuando cambia estado (con dedup) |
| `notify_admins_new_order()` | Trigger | Notifica a admins cuando se crea un pedido (con dedup) |

### Triggers

| Trigger | Tabla | Evento | Función |
|---------|-------|--------|---------|
| `trg_orders_updated_at` | `orders` | BEFORE UPDATE | `update_updated_at_column()` |
| `trg_log_order_status_change` | `orders` | AFTER UPDATE (status changed) | `log_order_status_change()` |
| `trg_notify_order_status_change` | `orders` | AFTER UPDATE (status changed) | `notify_order_status_change()` |
| `trg_reduce_stock_on_order_confirm` | `orders` | AFTER UPDATE | `reduce_stock_on_order_confirm()` |
| `trg_increment_coupon_usage` | `orders` | AFTER INSERT | `increment_coupon_usage()` |
| `on_new_order_notify_admins` | `orders` | AFTER INSERT | `notify_admins_new_order()` |

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
| `user` | Comprar, reseñar, gestionar perfil y pedidos, confirmar entrega |
| `gestor` | Todo lo de user + CRUD de productos propios |
| `admin` | Acceso completo: usuarios, pedidos, categorías, cupones, banners, testimonios, reportes |

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
                                    ┌─────────────────────┤
                                    │                     │
                              Edge Function:       DB Triggers:
                           send-order-confirmation  • notify_admins_new_order
                                                    • increment_coupon_usage
```

**Cambios de estado** disparan automáticamente:
- `log_order_status_change()` — Registra en `order_status_history`
- `notify_order_status_change()` — Crea notificación in-app para el usuario (con dedup 5s)
- `reduce_stock_on_order_confirm()` — Reduce stock al confirmar, restaura al cancelar
- Edge Function `send-order-status-update` — Envía email al usuario

### ✅ Confirmación de Entrega

Cuando un pedido tiene estado `shipped`, el cliente puede:
- En **Mis Pedidos**: Botón "Confirmar recepción" con `AlertDialog`
- En **Confirmación de Pedido** (`/pedido/:id`): Botón "Confirmar que recibí mi pedido"

Ambos actualizan el estado a `delivered` vía Supabase.

### 💰 Sistema Multi-Moneda

Cada producto tiene un precio base en CUP (`products.price`) y precios opcionales en otras monedas (`product_prices` tabla). El carrito calcula totales por cada moneda disponible.

### ⭐ Sistema de Reseñas

- Solo **compradores verificados** pueden dejar reseñas
- Verificación: `order_items` con `orders.status IN ('confirmed','preparing','shipped','delivered')`
- Moderación: Admin puede ocultar reseñas (`is_visible`)
- Bulk ratings: `useBulkRatings` hook optimiza N+1 queries en listas

### 🔍 Búsqueda y Filtros

- **GlobalSearch** (`Ctrl+K`): Búsqueda full-text en productos y categorías
- **Historial de búsqueda**: Últimas 5 búsquedas almacenadas en localStorage
- **Empty state amigable**: Icono + sugerencia cuando no hay resultados
- **Filtros**: Categoría, rango de precio, disponibilidad
- **Ordenamiento**: Precio ↑↓, nombre A-Z, más recientes
- **Paginación**: "Cargar más" con conteo de restantes

### ❤️ Favoritos y Wishlist Compartida

- Lista de favoritos persistente en base de datos
- Botón "Compartir" genera un link público (`/wishlist/:code`)
- Empty state con CTA "Ver productos"
- Badge de nuevos favoritos

---

## Sistema de Notificaciones

### Arquitectura

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│  DB Triggers │────►│  notifications  │◄────│  Supabase    │
│  (INSERT)    │     │  (table)        │     │  Realtime    │
└──────────────┘     └────────┬────────┘     └──────┬───────┘
                              │                     │
                    ┌─────────▼─────────┐    ┌──────▼───────┐
                    │ useNotifications  │    │ WebSocket    │
                    │ useUnreadCount    │    │ subscription │
                    │ useInfiniteNotifs │    └──────────────┘
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │ NotificationBell  │  (popover, latest 20)
                    │ Notifications.tsx │  (full page, infinite scroll)
                    └───────────────────┘
```

### Tipos de Notificación

| Tipo | Icono | Destino al click | Generado por |
|------|-------|-------------------|--------------|
| `order_update` | 📦 Package | `/pedido/:id` | `notify_order_status_change()` trigger |
| `new_order` | 🛒 ShoppingCart | `/admin?tab=orders` (solo admin) | `notify_admins_new_order()` trigger |

### Hooks

- **`useNotifications()`** — Query simple (últimas 20) para `NotificationBell`
- **`useInfiniteNotifications()`** — Infinite query con paginación de 20 para `/notificaciones`
- **`useUnreadCount()`** — Conteo de no leídas (badge)
- **`useMarkAsRead()`** — Mutation para marcar individual o todas como leídas

### Deduplicación

Los triggers incluyen un guard de deduplicación que previene notificaciones duplicadas si la misma notificación se crea en los últimos 5 segundos (protección contra double-triggers).

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

| Función | Propósito |
|---------|-----------|
| `send-order-confirmation` | Envía email de confirmación al crear pedido |
| `send-order-status-update` | Envía email cuando cambia el estado del pedido |
| `send-welcome-email` | Email de bienvenida al registrarse |
| `send-abandoned-cart-email` | Email de carrito abandonado |
| `send-back-in-stock-email` | Email cuando un producto vuelve a estar disponible |
| `send-new-order-admin-notification` | Email al admin cuando se recibe un nuevo pedido |

### Secrets necesarios

| Secret | Propósito |
|--------|-----------|
| `RESEND_API_KEY` | API key de Resend para envío de emails |
| `LOVABLE_API_KEY` | API key para funcionalidades de Lovable AI |
| `SUPABASE_URL` | URL del proyecto (auto-configurado) |
| `SUPABASE_ANON_KEY` | Clave anónima (auto-configurado) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (auto-configurado) |
| `SUPABASE_DB_URL` | URL de la base de datos (auto-configurado) |

---

## Seguridad (RLS)

Todas las tablas tienen Row Level Security (RLS) habilitado. Resumen de políticas:

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `products` | Activos: público / Inactivos: admin | Admin + Gestor | Admin o Gestor (propios) | Admin |
| `categories` | Público | Admin | Admin | Admin |
| `orders` | Propios o Admin | Auth (propio user_id) | Propios o Admin | ❌ |
| `order_items` | Propios o Admin | Propios o Admin | ❌ | ❌ |
| `order_status_history` | Propios o Admin | Sistema (true) | ❌ | ❌ |
| `profiles` | Propios o Admin | Propios | Propios | ❌ |
| `reviews` | Visibles o Admin | Auth (propio) | Propios o Admin | Propios o Admin |
| `favorites` | Propios | Propios | ❌ | Propios |
| `user_roles` | Propios o Admin | Admin | ❌ | Admin |
| `notifications` | Propios | Sistema (true) | Propios | ❌ |
| `coupons` | Activos: público | Admin | Admin | Admin |
| `contact_messages` | Admin | Público | Admin | Admin |
| `product_prices` | Público | Admin + Gestor | Admin + Gestor | Admin + Gestor |
| `product_images` | Público | Admin + Gestor | Admin + Gestor | Admin + Gestor |
| `product_payment_methods` | Público | Admin + Gestor | Admin + Gestor | Admin + Gestor |
| `price_history` | Público | Sistema (true) | ❌ | ❌ |
| `product_views` | Admin | Público | ❌ | ❌ |
| `stock_alerts` | Propios o Admin | Público | Admin | Admin |
| `banners` | Activos: público | Admin | Admin | Admin |
| `testimonials` | Visibles: público | Admin | Admin | Admin |
| `shared_wishlists` | Público (por code) / Propios | Propios | ❌ | ❌ |

### Storage Buckets

| Bucket | Público | Uso |
|--------|---------|-----|
| `product-images` | ✅ | Imágenes de productos |
| `avatars` | ✅ | Fotos de perfil de usuarios |

---

## Rendimiento y Optimización

### Carga y Rendering

- **Lazy loading de rutas**: Todas las páginas excepto `Index` se cargan dinámicamente con `React.lazy()`
- **Code splitting**: Cada ruta genera un chunk separado en build
- **OptimizedImage**: Componente con lazy loading nativo (`loading="lazy"`)
- **Skeletons**: Loading states para ProductCard, ProductDetail, CategoryCard

### Caché y Data Fetching

- **React Query**: Cache con `staleTime: 30s` por defecto, `60s` para productos, `5min` para categorías
- **Realtime invalidation**: `useProducts` suscrito a cambios en tabla `products` vía Supabase Realtime
- **Bulk queries**: `useBulkRatings` y `useAllProductPrices` eliminan N+1 queries
- **Service Worker**: Estrategia `stale-while-revalidate` para API y activos

### Realtime Subscriptions

| Canal | Tabla | Evento | Propósito |
|-------|-------|--------|-----------|
| `products-realtime` | `products` | `*` | Invalidar cache cuando admin edita |
| `user-notifications` | `notifications` | `INSERT` | Toast + refresh notificaciones |
| `unread-count` | `notifications` | `*` | Actualizar badge de no leídas |
| `user-orders-realtime` | `orders` | `UPDATE` | Refresh pedidos del usuario |
| `order-status-{id}` | `orders` | `UPDATE` | Actualizar estado en confirmación |

---

## Accesibilidad (a11y)

- **Skip to content**: Link oculto en `index.html` que salta al contenido principal
- **Aria labels**: Todos los botones icon-only tienen `aria-label` descriptivo (carrito, menú, notificaciones)
- **VisuallyHidden titles**: Todos los `Dialog`, `Lightbox` y `Modal` usan `VisuallyHidden` `DialogTitle` para screen readers
- **Semántica HTML**: `<main>`, `<nav>`, `<section>`, `<article>` correctamente usados
- **Focus management**: Componentes de shadcn/ui con manejo de foco accesible
- **Contraste**: Tokens semánticos con contraste adecuado en modo claro y oscuro

---

## SEO y PWA

### SEO

- **`SEOHead` component**: Meta tags dinámicos con `react-helmet-async`
- **JSON-LD**: Schema.org `Product` con `AggregateRating` en detalle de producto
- **JSON-LD**: Schema.org `LocalBusiness` en página de contacto
- **`sitemap.xml`**: Mapa del sitio estático en `/public`
- **`robots.txt`**: Configuración para crawlers
- **Semantic HTML**: `<main>`, `<section>`, `<nav>`, `<article>`

### PWA

- **`manifest.json`**: Configuración de app instalable
- **`sw.js`**: Service Worker con cache de API y activos
- **Iconos**: 192x192 y 512x512 para instalación

---

## Guía para Escalar

### 🔄 Rendimiento

1. **Imágenes**: Migrar a un CDN con transformaciones (ej: Cloudflare Images, imgix). Actualmente se usan URLs de Unsplash.
2. **Paginación server-side**: Actualmente se cargan todos los productos y se paginan en cliente. Para >100 productos, implementar `range` queries en Supabase.
3. **Search**: Para búsqueda avanzada, considerar Supabase Full-Text Search (`to_tsvector`/`to_tsquery`) o Algolia/Meilisearch.

### 📊 Analytics

- Integrar un servicio de analytics (ej: Plausible, PostHog)
- Trackear: vistas de producto, add-to-cart rate, abandono de checkout

### 💳 Pagos

- Integrar pasarela de pago (ej: Stripe, TropiPay para Cuba)
- Actualmente el pago es offline (transferencia, efectivo)

### 📧 Emails Transaccionales

- Las Edge Functions usan Resend. Considerar plantillas HTML más elaboradas.
- Edge Functions disponibles: bienvenida, confirmación, cambio de estado, carrito abandonado, producto en stock, notificación admin

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
- Considerar Web Push API para notificaciones del navegador

### 📦 Inventario Avanzado

- Sistema de variantes (talla, color)
- Precios por volumen / mayoreo
- Gestión de almacenes múltiples
- Códigos de barras / SKU

### 🚚 Logística

- Integración con servicios de mensajería
- Cálculo de costos de envío por provincia
- Tracking de envíos en tiempo real

### 🎯 UX Avanzada

- Sistema de puntos / fidelización
- Generación de reportes PDF
- Notificaciones push del navegador (Web Push API)
- Chat en vivo con soporte

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
| **Accesibilidad** | `aria-label` en botones icon-only, `VisuallyHidden` en modales |
| **Triggers DB** | Guard de deduplicación en funciones que insertan notificaciones |

---

## Changelog Reciente

### Marzo 2026

- ✅ **Barra de progreso animada** en Mis Pedidos (`OrderProgressTracker` con Framer Motion)
- ✅ **Paginación infinita** de notificaciones con `useInfiniteQuery`
- ✅ **Confirmación de entrega** por el cliente (botón en Mis Pedidos y Confirmación)
- ✅ **Realtime product cache** — invalidación automática cuando admin edita productos
- ✅ **Notificaciones admin** — trigger automático al recibir nuevo pedido
- ✅ **Deduplicación de notificaciones** — guard en triggers para prevenir duplicados
- ✅ **Empty states mejorados** — Favoritos, Mis Pedidos, Búsqueda global con CTAs claros
- ✅ **Accesibilidad** — Skip-to-content, aria-labels en botones icon-only
- ✅ **Validación anti-spam** en formulario de contacto (longitud, formato)
- ✅ **Búsqueda global** — historial de búsquedas, empty state amigable

---

## Licencia

Proyecto privado. Todos los derechos reservados © FerreHogar.
