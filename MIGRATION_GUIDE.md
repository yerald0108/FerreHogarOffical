# Guía de Migración: Lovable Cloud → Node.js + PostgreSQL

> Guía completa paso a paso para migrar el backend de este proyecto desde Lovable Cloud (Supabase) a un servidor Node.js con PostgreSQL propio.

---

## Tabla de Contenidos

1. [Requisitos Previos](#1-requisitos-previos)
2. [Configurar PostgreSQL](#2-configurar-postgresql)
3. [Migrar el Esquema de Base de Datos](#3-migrar-el-esquema-de-base-de-datos)
4. [Migrar los Datos Existentes](#4-migrar-los-datos-existentes)
5. [Crear el Servidor Node.js](#5-crear-el-servidor-nodejs)
6. [Implementar Autenticación](#6-implementar-autenticación)
7. [Crear los Endpoints de la API](#7-crear-los-endpoints-de-la-api)
8. [Implementar Autorización (Roles)](#8-implementar-autorización-roles)
9. [Migrar Edge Functions (Emails)](#9-migrar-edge-functions-emails)
10. [Migrar Storage (Imágenes)](#10-migrar-storage-imágenes)
11. [Migrar Realtime (Notificaciones)](#11-migrar-realtime-notificaciones)
12. [Actualizar el Frontend](#12-actualizar-el-frontend)
13. [Seguridad y Rate Limiting](#13-seguridad-y-rate-limiting)
14. [Validación con Zod](#14-validación-con-zod)
15. [Variables de Entorno](#15-variables-de-entorno)
16. [Deploy en Producción](#16-deploy-en-producción)
17. [Checklist Final](#17-checklist-final)

---

## 1. Requisitos Previos

### Software necesario

| Software | Versión mínima | Propósito |
|----------|---------------|-----------|
| Node.js | 18+ | Runtime del servidor |
| PostgreSQL | 15+ | Base de datos |
| npm o yarn | Última | Gestor de paquetes |
| Git | Última | Control de versiones |

### Instalar Node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# macOS (con Homebrew)
brew install node

# Windows → descargar de https://nodejs.org
```

### Instalar PostgreSQL

```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql@15
brew services start postgresql@15

# Windows → descargar de https://www.postgresql.org/download/
```

---

## 2. Configurar PostgreSQL

### 2.1. Crear la base de datos y el usuario

```bash
# Acceder a PostgreSQL como superusuario
sudo -u postgres psql
```

```sql
-- Crear usuario
CREATE USER ferrehogar_user WITH PASSWORD 'tu_contraseña_segura';

-- Crear base de datos
CREATE DATABASE ferrehogar_db OWNER ferrehogar_user;

-- Dar permisos
GRANT ALL PRIVILEGES ON DATABASE ferrehogar_db TO ferrehogar_user;

-- Salir
\q
```

### 2.2. Verificar conexión

```bash
psql -U ferrehogar_user -d ferrehogar_db -h localhost
```

---

## 3. Migrar el Esquema de Base de Datos

### 3.1. Crear los tipos ENUM

```sql
-- Conectarse a la base de datos
\c ferrehogar_db

-- Crear enums
CREATE TYPE app_role AS ENUM ('admin', 'user', 'gestor');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled');
```

### 3.2. Crear las tablas

Ejecutar este SQL en orden (respetando dependencias de foreign keys):

```sql
-- ============================================
-- EXTENSIÓN UUID
-- ============================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLA: users (reemplaza auth.users de Supabase)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token TEXT,
    password_reset_token TEXT,
    password_reset_expires TIMESTAMPTZ,
    refresh_token TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLA: profiles
-- ============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    municipality TEXT,
    province TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- ============================================
-- TABLA: user_roles
-- ============================================
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, role)
);

-- ============================================
-- TABLA: categories
-- ============================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLA: products
-- ============================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    compare_at_price NUMERIC,
    image_url TEXT,
    category_id UUID REFERENCES categories(id),
    stock INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLA: product_images
-- ============================================
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLA: product_prices (multi-moneda)
-- ============================================
CREATE TABLE product_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    currency TEXT NOT NULL,
    price NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLA: product_payment_methods
-- ============================================
CREATE TABLE product_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    method TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLA: orders
-- ============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    status order_status NOT NULL DEFAULT 'pending',
    total_amount NUMERIC NOT NULL,
    discount_amount NUMERIC DEFAULT 0,
    delivery_address TEXT NOT NULL,
    municipality TEXT NOT NULL,
    province TEXT,
    phone TEXT NOT NULL,
    delivery_time TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    notes TEXT,
    coupon_code TEXT,
    cancellation_reason TEXT,
    tracking_info TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLA: order_items
-- ============================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price_at_purchase NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLA: order_status_history
-- ============================================
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    previous_status order_status,
    new_status order_status NOT NULL,
    changed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLA: reviews
-- ============================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLA: favorites
-- ============================================
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- ============================================
-- TABLA: coupons
-- ============================================
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL,
    discount_value NUMERIC NOT NULL,
    min_order_amount NUMERIC DEFAULT 0,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLA: notifications
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'order_update',
    reference_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLA: contact_messages
-- ============================================
CREATE TABLE contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLA: stock_alerts
-- ============================================
CREATE TABLE stock_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    email TEXT,
    phone TEXT,
    notified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLA: testimonials
-- ============================================
CREATE TABLE testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    text TEXT NOT NULL,
    location TEXT DEFAULT '',
    rating INTEGER DEFAULT 5,
    is_visible BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.3. Crear los triggers

```sql
-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger para registrar cambios de estado de pedidos
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, NULL);
        -- Nota: changed_by se puede setear desde la aplicación pasándolo como contexto
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_status_log
    AFTER UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

-- Trigger para reducir/restaurar stock
CREATE OR REPLACE FUNCTION handle_stock_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
        UPDATE products p
        SET stock = p.stock - oi.quantity
        FROM order_items oi
        WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
    END IF;

    IF NEW.status = 'cancelled' AND OLD.status IN ('pending', 'confirmed', 'preparing') THEN
        UPDATE products p
        SET stock = p.stock + oi.quantity
        FROM order_items oi
        WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stock_management
    AFTER UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION handle_stock_on_status_change();

-- Trigger para incrementar uso de cupón
CREATE OR REPLACE FUNCTION increment_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.coupon_code IS NOT NULL AND NEW.coupon_code != '' THEN
        UPDATE coupons SET current_uses = current_uses + 1
        WHERE code = NEW.coupon_code;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_coupon_usage
    AFTER INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION increment_coupon_usage();

-- Trigger para crear notificación al cambiar estado de pedido
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
    status_label TEXT;
    status_message TEXT;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        CASE NEW.status
            WHEN 'confirmed' THEN status_label := 'Confirmado'; status_message := 'Tu pedido ha sido confirmado.';
            WHEN 'preparing' THEN status_label := 'En Preparación'; status_message := 'Estamos preparando tu pedido.';
            WHEN 'shipped' THEN status_label := 'Enviado'; status_message := '¡Tu pedido está en camino!';
            WHEN 'delivered' THEN status_label := 'Entregado'; status_message := '¡Tu pedido ha sido entregado!';
            WHEN 'cancelled' THEN status_label := 'Cancelado'; status_message := 'Tu pedido ha sido cancelado. ' || COALESCE(NEW.cancellation_reason, '');
            ELSE status_label := NEW.status::TEXT; status_message := 'El estado de tu pedido ha cambiado.';
        END CASE;

        INSERT INTO notifications (user_id, title, message, type, reference_id)
        VALUES (
            NEW.user_id,
            'Pedido #' || UPPER(LEFT(NEW.id::TEXT, 8)) || ' - ' || status_label,
            status_message,
            'order_update',
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_notification
    AFTER UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION notify_order_status_change();
```

### 3.4. Crear funciones de utilidad en la base de datos

```sql
-- Función para validar cupones (reemplaza supabase.rpc('validate_coupon'))
CREATE OR REPLACE FUNCTION validate_coupon(p_code TEXT, p_order_amount NUMERIC)
RETURNS TABLE(valid BOOLEAN, discount NUMERIC, message TEXT)
LANGUAGE plpgsql AS $$
DECLARE
    v_coupon RECORD;
    v_discount NUMERIC;
BEGIN
    SELECT * INTO v_coupon FROM coupons
    WHERE code = UPPER(p_code) AND is_active = true;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 0::NUMERIC, 'Cupón no encontrado'::TEXT;
        RETURN;
    END IF;

    IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
        RETURN QUERY SELECT false, 0::NUMERIC, 'Cupón expirado'::TEXT;
        RETURN;
    END IF;

    IF v_coupon.max_uses IS NOT NULL AND v_coupon.current_uses >= v_coupon.max_uses THEN
        RETURN QUERY SELECT false, 0::NUMERIC, 'Cupón agotado'::TEXT;
        RETURN;
    END IF;

    IF p_order_amount < v_coupon.min_order_amount THEN
        RETURN QUERY SELECT false, 0::NUMERIC, ('Monto mínimo: ' || v_coupon.min_order_amount)::TEXT;
        RETURN;
    END IF;

    IF v_coupon.discount_type = 'percentage' THEN
        v_discount := ROUND(p_order_amount * v_coupon.discount_value / 100, 2);
    ELSE
        v_discount := LEAST(v_coupon.discount_value, p_order_amount);
    END IF;

    RETURN QUERY SELECT true, v_discount, ('Descuento aplicado: ' || v_discount)::TEXT;
END;
$$;

-- Función para verificar stock (reemplaza supabase.rpc('check_stock_availability'))
CREATE OR REPLACE FUNCTION check_stock_availability(p_items JSONB)
RETURNS TABLE(product_id UUID, product_name TEXT, requested INTEGER, available INTEGER, is_available BOOLEAN)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (item->>'product_id')::UUID,
        p.name,
        (item->>'quantity')::INTEGER,
        p.stock,
        p.stock >= (item->>'quantity')::INTEGER
    FROM jsonb_array_elements(p_items) AS item
    JOIN products p ON p.id = (item->>'product_id')::UUID;
END;
$$;
```

### 3.5. Crear índices para rendimiento

```sql
-- Índices de búsqueda y filtrado
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_created_by ON products(created_by);
CREATE INDEX idx_products_name_search ON products USING gin(to_tsvector('spanish', name));

-- Índices de pedidos
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Índices de usuario
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_product ON favorites(product_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_user_roles_user ON user_roles(user_id);

-- Índices de productos auxiliares
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_product_prices_product ON product_prices(product_id);
CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_payment_methods_product ON product_payment_methods(product_id);

-- Índices de alertas
CREATE INDEX idx_stock_alerts_product ON stock_alerts(product_id);
CREATE INDEX idx_stock_alerts_not_notified ON stock_alerts(product_id) WHERE notified = false;

-- Índices de usuarios
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;
CREATE INDEX idx_users_verification_token ON users(email_verification_token) WHERE email_verification_token IS NOT NULL;
```

---

## 4. Migrar los Datos Existentes

### 4.1. Exportar datos desde Lovable Cloud

Usa la API REST de Supabase para exportar los datos:

```bash
# Variables (reemplazar con tus valores reales)
SUPABASE_URL="https://qteipiljcipcvovjfwtf.supabase.co"
ANON_KEY="TU_ANON_KEY"
SERVICE_ROLE_KEY="TU_SERVICE_ROLE_KEY"

# Exportar cada tabla
for TABLE in categories products product_images product_prices product_payment_methods \
             orders order_items order_status_history reviews favorites coupons \
             notifications contact_messages stock_alerts testimonials profiles user_roles; do
  curl "${SUPABASE_URL}/rest/v1/${TABLE}?select=*" \
    -H "apikey: ${ANON_KEY}" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    > "data/${TABLE}.json"
  echo "✅ Exportado: ${TABLE}"
done
```

### 4.2. Script de importación completo

Crear `scripts/import-data.js`:

```javascript
const { Pool } = require('pg');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://ferrehogar_user:tu_contraseña@localhost:5432/ferrehogar_db'
});

async function importTable(tableName, filePath, transform) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Archivo no encontrado: ${filePath}, saltando...`);
    return;
  }
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  let imported = 0;
  
  for (const row of data) {
    const transformed = transform ? transform(row) : row;
    const columns = Object.keys(transformed);
    const values = Object.values(transformed);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    try {
      await pool.query(
        `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
        values
      );
      imported++;
    } catch (err) {
      console.error(`  Error en ${tableName}:`, err.message);
    }
  }
  
  console.log(`✅ ${imported}/${data.length} registros importados en ${tableName}`);
}

async function importUsers() {
  // Los usuarios de Supabase auth.users no se pueden exportar directamente con contraseñas.
  // Opciones:
  // 1. Crear usuarios nuevos a partir de los perfiles y forzar reset de contraseña
  // 2. Si tienes acceso al service_role_key, exportar los hashes de auth.users
  
  const profilesPath = './data/profiles.json';
  if (!fs.existsSync(profilesPath)) return;
  
  const profiles = JSON.parse(fs.readFileSync(profilesPath, 'utf-8'));
  let created = 0;
  
  for (const profile of profiles) {
    // Crear usuario con contraseña temporal (requerirá reset)
    const tempPassword = await bcrypt.hash('TEMP_RESET_REQUIRED', 12);
    
    try {
      await pool.query(
        `INSERT INTO users (id, email, password_hash, email_verified) 
         VALUES ($1, $2, $3, true) ON CONFLICT DO NOTHING`,
        [profile.user_id, profile.email, tempPassword]
      );
      created++;
    } catch (err) {
      console.error(`  Error creando usuario ${profile.email}:`, err.message);
    }
  }
  
  console.log(`✅ ${created} usuarios creados (necesitarán resetear contraseña)`);
}

async function main() {
  console.log('🚀 Iniciando importación de datos...\n');
  
  // 1. Crear usuarios primero (tablas con dependencias)
  await importUsers();
  
  // 2. Importar en orden de dependencias
  await importTable('profiles', './data/profiles.json');
  await importTable('user_roles', './data/user_roles.json');
  await importTable('categories', './data/categories.json');
  await importTable('products', './data/products.json');
  await importTable('product_images', './data/product_images.json');
  await importTable('product_prices', './data/product_prices.json');
  await importTable('product_payment_methods', './data/product_payment_methods.json');
  await importTable('orders', './data/orders.json');
  await importTable('order_items', './data/order_items.json');
  await importTable('order_status_history', './data/order_status_history.json');
  await importTable('reviews', './data/reviews.json');
  await importTable('favorites', './data/favorites.json');
  await importTable('coupons', './data/coupons.json');
  await importTable('notifications', './data/notifications.json');
  await importTable('contact_messages', './data/contact_messages.json');
  await importTable('stock_alerts', './data/stock_alerts.json');
  await importTable('testimonials', './data/testimonials.json');
  
  await pool.end();
  console.log('\n🎉 Importación completada');
}

main().catch(console.error);
```

> **⚠️ IMPORTANTE sobre usuarios:** Los hashes de contraseñas están en la tabla `auth.users` de Supabase, que no es accesible vía API REST normal. Opciones:
> 1. Usar `pg_dump` si tienes acceso directo a la base de datos de Supabase
> 2. Forzar a todos los usuarios a hacer "Olvidé mi contraseña" después de la migración
> 3. Contactar al soporte de Supabase para exportar los hashes

---

## 5. Crear el Servidor Node.js

### 5.1. Inicializar el proyecto backend

```bash
mkdir ferrehogar-api
cd ferrehogar-api
npm init -y
```

### 5.2. Instalar dependencias

```bash
# Core
npm install express cors helmet dotenv

# Base de datos
npm install pg

# Autenticación
npm install bcryptjs jsonwebtoken

# Validación
npm install zod

# Email
npm install resend

# Uploads
npm install multer sharp

# Utilidades
npm install uuid crypto

# Rate Limiting
npm install express-rate-limit

# Cron jobs (para emails de carrito abandonado)
npm install node-cron

# Dev
npm install -D typescript @types/express @types/node @types/pg @types/bcryptjs \
  @types/jsonwebtoken @types/multer @types/node-cron nodemon ts-node
```

### 5.3. Configurar TypeScript

Crear `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 5.4. Estructura del proyecto

```
ferrehogar-api/
├── src/
│   ├── config/
│   │   └── database.ts          # Conexión a PostgreSQL
│   ├── middleware/
│   │   ├── auth.ts              # Verificar JWT
│   │   ├── roles.ts             # Verificar roles (admin/gestor)
│   │   ├── validate.ts          # Validación con Zod
│   │   └── rateLimit.ts         # Rate limiting
│   ├── routes/
│   │   ├── auth.routes.ts       # Login, registro, recuperar contraseña, verificar email
│   │   ├── products.routes.ts   # CRUD productos + stock check
│   │   ├── categories.routes.ts # CRUD categorías
│   │   ├── orders.routes.ts     # CRUD pedidos + historial de estado
│   │   ├── reviews.routes.ts    # CRUD reseñas + ratings bulk
│   │   ├── favorites.routes.ts  # Favoritos (toggle)
│   │   ├── coupons.routes.ts    # CRUD cupones + validación
│   │   ├── notifications.routes.ts  # Listar, marcar como leídas
│   │   ├── profiles.routes.ts   # Ver/actualizar perfil + avatar
│   │   ├── contact.routes.ts    # Enviar mensaje de contacto
│   │   ├── testimonials.routes.ts  # CRUD testimonios
│   │   ├── stockAlerts.routes.ts   # Alertas de stock
│   │   ├── upload.routes.ts     # Subida de imágenes
│   │   └── admin.routes.ts      # Estadísticas, gestión usuarios
│   ├── services/
│   │   ├── email.service.ts     # Envío de emails con Resend
│   │   └── storage.service.ts   # Gestión de archivos
│   ├── types/
│   │   └── index.ts             # Tipos TypeScript
│   ├── utils/
│   │   └── helpers.ts
│   └── index.ts                 # Entry point
├── uploads/                     # Almacenamiento de imágenes
│   ├── products/
│   └── avatars/
├── scripts/
│   └── import-data.js           # Script de migración de datos
├── data/                        # JSONs exportados de Supabase
├── .env
├── package.json
└── tsconfig.json
```

### 5.5. Conexión a la base de datos

Crear `src/config/database.ts`:

```typescript
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Verificar conexión al iniciar
pool.query('SELECT NOW()')
  .then(() => console.log('✅ PostgreSQL conectado'))
  .catch((err) => {
    console.error('❌ Error conectando a PostgreSQL:', err);
    process.exit(1);
  });

export default pool;
```

### 5.6. Entry point del servidor

Crear `src/index.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

// Rutas
import authRoutes from './routes/auth.routes';
import productsRoutes from './routes/products.routes';
import categoriesRoutes from './routes/categories.routes';
import ordersRoutes from './routes/orders.routes';
import reviewsRoutes from './routes/reviews.routes';
import favoritesRoutes from './routes/favorites.routes';
import couponsRoutes from './routes/coupons.routes';
import notificationsRoutes from './routes/notifications.routes';
import profilesRoutes from './routes/profiles.routes';
import contactRoutes from './routes/contact.routes';
import testimonialsRoutes from './routes/testimonials.routes';
import stockAlertsRoutes from './routes/stockAlerts.routes';
import uploadRoutes from './routes/upload.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware global
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/profiles', profilesRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/testimonials', testimonialsRoutes);
app.use('/api/stock-alerts', stockAlertsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Manejo de errores global
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

export default app;
```

### 5.7. Scripts en package.json

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "import-data": "node scripts/import-data.js"
  }
}
```

---

## 6. Implementar Autenticación

### 6.1. Middleware de autenticación

Crear `src/middleware/auth.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; type?: string };
    
    // Rechazar refresh tokens usados como access tokens
    if (decoded.type === 'refresh') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// Middleware opcional: permite acceso sin auth pero adjunta userId si existe
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      req.userId = decoded.userId;
    } catch {
      // Token inválido, continuar sin auth
    }
  }
  
  next();
}
```

### 6.2. Rutas de autenticación completas

Crear `src/routes/auth.routes.ts`:

```typescript
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendWelcomeEmail, sendPasswordResetEmail, sendVerificationEmail } from '../services/email.service';

const router = Router();

// ============================================
// POST /api/auth/register — Registro de usuario
// ============================================
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, full_name, phone, address, municipality, province } = req.body;

  // Validaciones básicas
  if (!email || !password || !full_name || !phone) {
    return res.status(400).json({ error: 'Campos obligatorios: email, password, full_name, phone' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    // Verificar si el email ya existe
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hash de la contraseña
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Token de verificación de email
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Crear usuario
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, email_verification_token) 
       VALUES ($1, $2, $3) RETURNING id`,
      [email.toLowerCase(), passwordHash, verificationToken]
    );
    const userId = userResult.rows[0].id;

    // Crear perfil
    await pool.query(
      `INSERT INTO profiles (user_id, full_name, phone, address, municipality, province, email)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, full_name, phone, address || null, municipality || null, province || null, email.toLowerCase()]
    );

    // Asignar rol por defecto
    await pool.query(
      'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
      [userId, 'user']
    );

    // Enviar email de verificación
    try {
      await sendVerificationEmail(email, full_name, verificationToken);
    } catch (emailErr) {
      console.error('Error enviando email de verificación:', emailErr);
    }

    // Enviar email de bienvenida
    try {
      await sendWelcomeEmail(email, full_name);
    } catch (emailErr) {
      console.error('Error enviando email de bienvenida:', emailErr);
    }

    res.status(201).json({
      message: 'Cuenta creada. Revisa tu correo para verificar tu email.',
      user: { id: userId, email },
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// ============================================
// POST /api/auth/login — Inicio de sesión
// ============================================
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  try {
    const result = await pool.query(
      'SELECT id, email, password_hash, email_verified FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar email (opcional: puedes permitir login sin verificar)
    if (!user.email_verified) {
      return res.status(403).json({ error: 'Debes verificar tu email antes de iniciar sesión' });
    }

    // Generar tokens
    const accessToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    // Guardar refresh token en la BD
    await pool.query(
      'UPDATE users SET refresh_token = $1 WHERE id = $2',
      [refreshToken, user.id]
    );

    // Obtener roles
    const rolesResult = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = $1',
      [user.id]
    );
    const roles = rolesResult.rows.map(r => r.role);

    res.json({
      user: { id: user.id, email: user.email, roles },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// ============================================
// POST /api/auth/refresh — Renovar access token
// ============================================
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token requerido' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as { userId: string; type: string };
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Verificar que el refresh token está en la BD
    const userResult = await pool.query(
      'SELECT id, email, refresh_token FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0 || userResult.rows[0].refresh_token !== refreshToken) {
      return res.status(401).json({ error: 'Refresh token inválido o revocado' });
    }

    // Generar nuevo access token
    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // Opcionalmente rotar el refresh token
    const newRefreshToken = jwt.sign(
      { userId: decoded.userId, type: 'refresh' },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    await pool.query(
      'UPDATE users SET refresh_token = $1 WHERE id = $2',
      [newRefreshToken, decoded.userId]
    );

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    return res.status(401).json({ error: 'Refresh token expirado o inválido' });
  }
});

// ============================================
// GET /api/auth/verify-email/:token — Verificar email
// ============================================
router.get('/verify-email/:token', async (req: Request, res: Response) => {
  const { token } = req.params;

  try {
    const result = await pool.query(
      'UPDATE users SET email_verified = true, email_verification_token = NULL WHERE email_verification_token = $1 RETURNING id, email',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Token de verificación inválido o ya usado' });
    }

    res.json({ message: 'Email verificado correctamente', email: result.rows[0].email });
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar email' });
  }
});

// ============================================
// POST /api/auth/forgot-password — Solicitar reset de contraseña
// ============================================
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email es obligatorio' });
  }

  try {
    const result = await pool.query('SELECT id, email FROM users WHERE email = $1', [email.toLowerCase()]);
    
    // Siempre responder OK para no revelar si el email existe
    if (result.rows.length === 0) {
      return res.json({ message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await pool.query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
      [resetToken, resetExpires, result.rows[0].id]
    );

    // Enviar email con enlace de reset
    try {
      await sendPasswordResetEmail(email, resetToken);
    } catch (emailErr) {
      console.error('Error enviando email de reset:', emailErr);
    }

    res.json({ message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña' });
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

// ============================================
// POST /api/auth/reset-password — Restablecer contraseña
// ============================================
router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token y nueva contraseña son obligatorios' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const result = await pool.query(
      'SELECT id FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await pool.query(
      'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
      [passwordHash, result.rows[0].id]
    );

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al restablecer contraseña' });
  }
});

// ============================================
// PUT /api/auth/change-password — Cambiar contraseña (autenticado)
// ============================================
router.put('/change-password', authenticate, async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Contraseña actual y nueva son obligatorias' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.userId]);
    const validPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, req.userId]);

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
});

// ============================================
// GET /api/auth/me — Obtener usuario actual con roles
// ============================================
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.email_verified,
              p.full_name, p.phone, p.address, p.municipality, p.province, p.avatar_url,
              array_agg(ur.role) as roles
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       WHERE u.id = $1
       GROUP BY u.id, p.id`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      email_verified: user.email_verified,
      full_name: user.full_name,
      phone: user.phone,
      address: user.address,
      municipality: user.municipality,
      province: user.province,
      avatar_url: user.avatar_url,
      roles: user.roles.filter(Boolean), // filtrar nulls
      isAdmin: user.roles.includes('admin'),
      isGestor: user.roles.includes('gestor'),
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// ============================================
// POST /api/auth/logout — Cerrar sesión (revocar refresh token)
// ============================================
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE users SET refresh_token = NULL WHERE id = $1', [req.userId]);
    res.json({ message: 'Sesión cerrada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
});

export default router;
```

---

## 7. Crear los Endpoints de la API

### 7.1. Mapeo completo de endpoints (Supabase → REST)

| Operación actual (Supabase) | Nuevo endpoint REST | Método | Auth |
|---|---|---|---|
| `supabase.from('products').select('*,categories(*)')` | `/api/products` | GET | Público |
| `supabase.from('products').select().eq('id',id)` | `/api/products/:id` | GET | Público |
| `supabase.from('products').insert(data)` | `/api/products` | POST | Admin/Gestor |
| `supabase.from('products').update(data).eq('id',id)` | `/api/products/:id` | PUT | Admin/Gestor(propio) |
| `supabase.from('products').update({is_active:false}).eq('id',id)` | `/api/products/:id` | DELETE | Admin |
| `supabase.rpc('check_stock_availability')` | `/api/products/check-stock` | POST | Público |
| `supabase.from('categories').select()` | `/api/categories` | GET | Público |
| `supabase.from('categories').insert()` | `/api/categories` | POST | Admin |
| `supabase.from('categories').update()` | `/api/categories/:id` | PUT | Admin |
| `supabase.from('categories').delete()` | `/api/categories/:id` | DELETE | Admin |
| `supabase.from('orders').select()` | `/api/orders` | GET | Auth (propios) |
| `supabase.from('orders').insert()` | `/api/orders` | POST | Auth |
| `supabase.from('orders').update()` | `/api/orders/:id/status` | PUT | Auth/Admin |
| `supabase.from('reviews').select()` | `/api/reviews?product_id=xxx` | GET | Público |
| `supabase.from('reviews').insert()` | `/api/reviews` | POST | Auth |
| `supabase.from('reviews').update()` | `/api/reviews/:id` | PUT | Auth (propio)/Admin |
| `supabase.from('reviews').delete()` | `/api/reviews/:id` | DELETE | Auth (propio)/Admin |
| Bulk ratings query | `/api/reviews/bulk-ratings` | POST | Público |
| `supabase.from('favorites').select()` | `/api/favorites` | GET | Auth |
| `supabase.from('favorites').insert()` | `/api/favorites` | POST | Auth |
| `supabase.from('favorites').delete()` | `/api/favorites/:productId` | DELETE | Auth |
| `supabase.rpc('validate_coupon')` | `/api/coupons/validate` | POST | Público |
| `supabase.from('coupons').select()` | `/api/coupons` | GET | Admin |
| `supabase.from('coupons').insert/update/delete` | `/api/coupons/:id` | POST/PUT/DELETE | Admin |
| `supabase.from('notifications').select()` | `/api/notifications` | GET | Auth |
| `supabase.from('notifications').update({is_read:true})` | `/api/notifications/mark-read` | PUT | Auth |
| Unread count query | `/api/notifications/unread-count` | GET | Auth |
| `supabase.from('profiles').select()` | `/api/profiles/me` | GET | Auth |
| `supabase.from('profiles').update()` | `/api/profiles/me` | PUT | Auth |
| Avatar upload to Supabase Storage | `/api/profiles/avatar` | POST | Auth |
| `supabase.from('contact_messages').insert()` | `/api/contact` | POST | Público |
| `supabase.from('contact_messages').select()` | `/api/contact` | GET | Admin |
| `supabase.from('contact_messages').update()` | `/api/contact/:id` | PUT | Admin |
| `supabase.from('testimonials').select()` | `/api/testimonials` | GET | Público |
| `supabase.from('testimonials').insert/update/delete` | `/api/testimonials/:id` | POST/PUT/DELETE | Admin |
| `supabase.from('stock_alerts').insert()` | `/api/stock-alerts` | POST | Público |
| `supabase.from('product_prices').select()` | `/api/products/:id/prices` | GET | Público |
| Bulk product prices | `/api/products/prices/bulk` | POST | Público |
| `supabase.from('product_images').select()` | `/api/products/:id/images` | GET | Público |
| `supabase.from('product_payment_methods').select()` | `/api/products/:id/payment-methods` | GET | Público |
| `supabase.rpc('is_admin')` | `/api/auth/me` (incluye roles) | GET | Auth |
| Admin stats queries | `/api/admin/stats` | GET | Admin |
| Admin users list | `/api/admin/users` | GET | Admin |
| Admin assign/remove role | `/api/admin/users/:id/role` | PUT/DELETE | Admin |
| Admin orders list | `/api/admin/orders` | GET | Admin |
| Product upload image | `/api/upload` | POST | Admin/Gestor |

### 7.2. Rutas de productos

Crear `src/routes/products.routes.ts`:

```typescript
import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();

// GET /api/products — Listar productos activos
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { category_id, search, sort } = req.query;

  try {
    let query = `
      SELECT p.*, c.name as category_name, c.icon as category_icon
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.is_active = true
    `;
    const params: any[] = [];

    if (category_id) {
      params.push(category_id);
      query += ` AND p.category_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`;
    }

    switch (sort) {
      case 'price_asc': query += ' ORDER BY p.price ASC'; break;
      case 'price_desc': query += ' ORDER BY p.price DESC'; break;
      case 'name': query += ' ORDER BY p.name ASC'; break;
      default: query += ' ORDER BY p.created_at DESC';
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error listando productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// GET /api/products/:id — Detalle de producto con imágenes, precios y métodos de pago
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await pool.query(
      `SELECT p.*, c.name as category_name, c.icon as category_icon
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = $1 AND p.is_active = true`,
      [id]
    );

    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Obtener datos relacionados en paralelo
    const [images, prices, paymentMethods] = await Promise.all([
      pool.query('SELECT * FROM product_images WHERE product_id = $1 ORDER BY display_order', [id]),
      pool.query('SELECT * FROM product_prices WHERE product_id = $1', [id]),
      pool.query('SELECT * FROM product_payment_methods WHERE product_id = $1', [id]),
    ]);

    res.json({
      ...product.rows[0],
      images: images.rows,
      extra_prices: prices.rows,
      payment_methods: paymentMethods.rows,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

// POST /api/products — Crear producto (admin/gestor)
router.post('/', authenticate, requireRole(['admin', 'gestor']), async (req: AuthRequest, res: Response) => {
  const { name, description, price, compare_at_price, image_url, category_id, stock } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO products (name, description, price, compare_at_price, image_url, category_id, stock, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, description, price, compare_at_price, image_url, category_id, stock || 0, req.userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// PUT /api/products/:id — Actualizar producto
// Gestores solo pueden editar sus propios productos
router.put('/:id', authenticate, requireRole(['admin', 'gestor']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, price, compare_at_price, image_url, category_id, stock, is_active } = req.body;

  try {
    // Verificar permisos: gestor solo edita los suyos
    const rolesResult = await pool.query('SELECT role FROM user_roles WHERE user_id = $1', [req.userId]);
    const isAdmin = rolesResult.rows.some(r => r.role === 'admin');
    
    if (!isAdmin) {
      const product = await pool.query('SELECT created_by FROM products WHERE id = $1', [id]);
      if (product.rows.length === 0 || product.rows[0].created_by !== req.userId) {
        return res.status(403).json({ error: 'No tienes permiso para editar este producto' });
      }
    }

    const result = await pool.query(
      `UPDATE products SET name=$1, description=$2, price=$3, compare_at_price=$4, 
       image_url=$5, category_id=$6, stock=$7, is_active=$8
       WHERE id=$9 RETURNING *`,
      [name, description, price, compare_at_price, image_url, category_id, stock, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// DELETE /api/products/:id — Eliminar producto (solo admin, soft delete)
router.delete('/:id', authenticate, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    await pool.query('UPDATE products SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// POST /api/products/check-stock — Verificar disponibilidad de stock
router.post('/check-stock', async (req: Request, res: Response) => {
  const { items } = req.body; // [{ product_id, quantity }]

  try {
    const results = [];
    for (const item of items) {
      const result = await pool.query(
        'SELECT id, name, stock FROM products WHERE id = $1',
        [item.product_id]
      );
      if (result.rows.length > 0) {
        const product = result.rows[0];
        results.push({
          product_id: product.id,
          product_name: product.name,
          requested: item.quantity,
          available: product.stock,
          is_available: product.stock >= item.quantity,
        });
      }
    }
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Error verificando stock' });
  }
});

// GET /api/products/:id/prices — Precios multi-moneda de un producto
router.get('/:id/prices', async (req: Request, res: Response) => {
  try {
    const { data } = await pool.query(
      'SELECT * FROM product_prices WHERE product_id = $1',
      [req.params.id]
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener precios' });
  }
});

// POST /api/products/prices/bulk — Precios bulk para múltiples productos
router.post('/prices/bulk', async (req: Request, res: Response) => {
  const { productIds } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM product_prices WHERE product_id = ANY($1)',
      [productIds]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener precios' });
  }
});

// GET /api/products/admin/all — Listar TODOS los productos (admin, incluye inactivos)
router.get('/admin/all', authenticate, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.name as category_name, c.icon as category_icon,
             prof.full_name as creator_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN profiles prof ON prof.user_id = p.created_by
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// GET /api/products/gestor/mine — Productos del gestor actual
router.get('/gestor/mine', authenticate, requireRole(['gestor']), async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.name as category_name, c.icon as category_icon
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.created_by = $1
      ORDER BY p.created_at DESC
    `, [req.userId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

export default router;
```

### 7.3. Rutas de pedidos

Crear `src/routes/orders.routes.ts`:

```typescript
import { Router, Response } from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { sendOrderConfirmation, sendOrderStatusUpdate } from '../services/email.service';

const router = Router();

// GET /api/orders — Pedidos del usuario autenticado
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await pool.query(
      `SELECT o.*, 
        json_agg(DISTINCT jsonb_build_object(
          'id', oi.id, 'product_id', oi.product_id, 'product_name', oi.product_name,
          'quantity', oi.quantity, 'price_at_purchase', oi.price_at_purchase
        )) FILTER (WHERE oi.id IS NOT NULL) as order_items,
        json_agg(DISTINCT jsonb_build_object(
          'id', osh.id, 'previous_status', osh.previous_status,
          'new_status', osh.new_status, 'created_at', osh.created_at
        )) FILTER (WHERE osh.id IS NOT NULL) as order_status_history
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN order_status_history osh ON osh.order_id = o.id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.userId]
    );
    res.json(orders.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

// POST /api/orders — Crear pedido
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { delivery_address, municipality, province, phone, delivery_time, 
          payment_method, notes, coupon_code, discount_amount, total_amount, items } = req.body;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Crear pedido
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, delivery_address, municipality, province, phone, 
       delivery_time, payment_method, notes, coupon_code, discount_amount, total_amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [req.userId, delivery_address, municipality, province, phone,
       delivery_time, payment_method, notes, coupon_code, discount_amount || 0, total_amount]
    );
    const order = orderResult.rows[0];

    // Crear items del pedido
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_purchase)
         VALUES ($1,$2,$3,$4,$5)`,
        [order.id, item.product_id, item.product_name, item.quantity, item.price_at_purchase]
      );
    }

    await client.query('COMMIT');

    // Enviar email de confirmación (fire and forget)
    const profile = await pool.query('SELECT full_name, email FROM profiles WHERE user_id = $1', [req.userId]);
    if (profile.rows[0]?.email) {
      sendOrderConfirmation(
        profile.rows[0].email, profile.rows[0].full_name, order.id, items, total_amount,
        delivery_address, municipality, delivery_time, payment_method
      ).catch(err => console.error('Error enviando email de confirmación:', err));
    }

    res.status(201).json(order);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Error al crear pedido' });
  } finally {
    client.release();
  }
});

// PUT /api/orders/:id/status — Actualizar estado (admin o cancelar propio)
router.put('/:id/status', authenticate, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, cancellation_reason } = req.body;

  try {
    // Verificar permisos
    const order = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (order.rows.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' });

    const rolesResult = await pool.query('SELECT role FROM user_roles WHERE user_id = $1', [req.userId]);
    const isAdmin = rolesResult.rows.some(r => r.role === 'admin');
    const isOwner = order.rows[0].user_id === req.userId;

    // Usuarios solo pueden cancelar sus propios pedidos pendientes
    if (!isAdmin) {
      if (!isOwner) return res.status(403).json({ error: 'No autorizado' });
      if (status !== 'cancelled') return res.status(403).json({ error: 'Solo puedes cancelar pedidos' });
      if (order.rows[0].status !== 'pending') return res.status(400).json({ error: 'Solo puedes cancelar pedidos pendientes' });
    }

    const updateData: any = { status };
    if (status === 'cancelled' && cancellation_reason) {
      updateData.cancellation_reason = cancellation_reason;
    }

    const result = await pool.query(
      `UPDATE orders SET status = $1, cancellation_reason = $2 WHERE id = $3 RETURNING *`,
      [status, updateData.cancellation_reason || null, id]
    );

    // Enviar email de cambio de estado
    const previousStatus = order.rows[0].status;
    if (previousStatus !== status) {
      const profile = await pool.query('SELECT email FROM profiles WHERE user_id = $1', [order.rows[0].user_id]);
      if (profile.rows[0]?.email) {
        sendOrderStatusUpdate(profile.rows[0].email, id, status)
          .catch(err => console.error('Error enviando email de estado:', err));
      }
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar pedido' });
  }
});

// PUT /api/orders/:id/admin-notes — Actualizar notas admin
router.put('/:id/admin-notes', authenticate, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  const { admin_notes, tracking_info } = req.body;
  try {
    const result = await pool.query(
      'UPDATE orders SET admin_notes = $1, tracking_info = $2 WHERE id = $3 RETURNING *',
      [admin_notes, tracking_info, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar notas' });
  }
});

export default router;
```

### 7.4. Rutas de reseñas

Crear `src/routes/reviews.routes.ts`:

```typescript
import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();

// GET /api/reviews?product_id=xxx — Reseñas de un producto
router.get('/', async (req: Request, res: Response) => {
  const { product_id } = req.query;
  if (!product_id) return res.status(400).json({ error: 'product_id requerido' });

  try {
    const result = await pool.query(
      `SELECT r.*, p.full_name as reviewer_name
       FROM reviews r
       LEFT JOIN profiles p ON p.user_id = r.user_id
       WHERE r.product_id = $1 AND r.is_visible = true
       ORDER BY r.created_at DESC`,
      [product_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener reseñas' });
  }
});

// POST /api/reviews/bulk-ratings — Ratings masivos para múltiples productos
router.post('/bulk-ratings', async (req: Request, res: Response) => {
  const { productIds } = req.body;
  if (!productIds?.length) return res.json({});

  try {
    const result = await pool.query(
      `SELECT product_id, AVG(rating) as avg_rating, COUNT(*) as total_reviews
       FROM reviews
       WHERE product_id = ANY($1) AND is_visible = true
       GROUP BY product_id`,
      [productIds]
    );
    
    const ratings: Record<string, { averageRating: number; totalReviews: number }> = {};
    result.rows.forEach(r => {
      ratings[r.product_id] = {
        averageRating: Math.round(parseFloat(r.avg_rating) * 10) / 10,
        totalReviews: parseInt(r.total_reviews),
      };
    });
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ratings' });
  }
});

// POST /api/reviews — Crear reseña
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { product_id, rating, comment } = req.body;

  try {
    // Verificar que el usuario ha comprado el producto
    const purchased = await pool.query(
      `SELECT oi.id FROM order_items oi
       INNER JOIN orders o ON o.id = oi.order_id
       WHERE oi.product_id = $1 AND o.user_id = $2 
       AND o.status IN ('confirmed', 'preparing', 'shipped', 'delivered')
       LIMIT 1`,
      [product_id, req.userId]
    );

    if (purchased.rows.length === 0) {
      return res.status(403).json({ error: 'Debes comprar el producto para dejar una reseña' });
    }

    // Verificar que no tiene ya una reseña
    const existing = await pool.query(
      'SELECT id FROM reviews WHERE product_id = $1 AND user_id = $2',
      [product_id, req.userId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Ya tienes una reseña para este producto' });
    }

    const result = await pool.query(
      'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.userId, product_id, rating, comment || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear reseña' });
  }
});

// PUT /api/reviews/:id — Actualizar reseña propia
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const { rating, comment } = req.body;

  try {
    // Verificar propiedad o admin
    const review = await pool.query('SELECT user_id FROM reviews WHERE id = $1', [req.params.id]);
    if (review.rows.length === 0) return res.status(404).json({ error: 'Reseña no encontrada' });

    const rolesResult = await pool.query('SELECT role FROM user_roles WHERE user_id = $1', [req.userId]);
    const isAdmin = rolesResult.rows.some(r => r.role === 'admin');

    if (review.rows[0].user_id !== req.userId && !isAdmin) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const result = await pool.query(
      'UPDATE reviews SET rating = $1, comment = $2 WHERE id = $3 RETURNING *',
      [rating, comment || null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar reseña' });
  }
});

// DELETE /api/reviews/:id — Eliminar reseña
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const review = await pool.query('SELECT user_id FROM reviews WHERE id = $1', [req.params.id]);
    if (review.rows.length === 0) return res.status(404).json({ error: 'Reseña no encontrada' });

    const rolesResult = await pool.query('SELECT role FROM user_roles WHERE user_id = $1', [req.userId]);
    const isAdmin = rolesResult.rows.some(r => r.role === 'admin');

    if (review.rows[0].user_id !== req.userId && !isAdmin) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    await pool.query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
    res.json({ message: 'Reseña eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar reseña' });
  }
});

export default router;
```

### 7.5. Rutas de favoritos

Crear `src/routes/favorites.routes.ts`:

```typescript
import { Router, Response } from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/favorites — Favoritos del usuario con datos del producto
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT f.id, f.product_id, f.created_at,
              p.id as product_id, p.name, p.price, p.image_url, p.stock, p.description, p.is_active,
              c.name as category_name
       FROM favorites f
       INNER JOIN products p ON p.id = f.product_id
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener favoritos' });
  }
});

// POST /api/favorites — Agregar favorito
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { product_id } = req.body;
  try {
    await pool.query(
      'INSERT INTO favorites (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.userId, product_id]
    );
    res.status(201).json({ message: 'Agregado a favoritos' });
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar favorito' });
  }
});

// DELETE /api/favorites/:productId — Eliminar favorito por product_id
router.delete('/:productId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND product_id = $2',
      [req.userId, req.params.productId]
    );
    res.json({ message: 'Eliminado de favoritos' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar favorito' });
  }
});

export default router;
```

### 7.6. Rutas de cupones

Crear `src/routes/coupons.routes.ts`:

```typescript
import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();

// POST /api/coupons/validate — Validar cupón (público, solo necesita código y monto)
router.post('/validate', async (req: Request, res: Response) => {
  const { code, orderAmount } = req.body;
  try {
    const result = await pool.query('SELECT * FROM validate_coupon($1, $2)', [code, orderAmount]);
    res.json(result.rows[0] || { valid: false, discount: 0, message: 'Cupón no encontrado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al validar cupón' });
  }
});

// GET /api/coupons — Listar cupones (admin)
router.get('/', authenticate, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM coupons ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener cupones' });
  }
});

// POST /api/coupons — Crear cupón (admin)
router.post('/', authenticate, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  const { code, discount_type, discount_value, min_order_amount, max_uses, expires_at } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_uses, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [code.toUpperCase(), discount_type, discount_value, min_order_amount, max_uses, expires_at]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear cupón' });
  }
});

// PUT /api/coupons/:id — Actualizar cupón (admin)
router.put('/:id', authenticate, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  const { code, discount_type, discount_value, min_order_amount, max_uses, expires_at, is_active } = req.body;
  try {
    const result = await pool.query(
      `UPDATE coupons SET code=$1, discount_type=$2, discount_value=$3, min_order_amount=$4, 
       max_uses=$5, expires_at=$6, is_active=$7 WHERE id=$8 RETURNING *`,
      [code?.toUpperCase(), discount_type, discount_value, min_order_amount, max_uses, expires_at, is_active, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar cupón' });
  }
});

// DELETE /api/coupons/:id — Eliminar cupón (admin)
router.delete('/:id', authenticate, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM coupons WHERE id = $1', [req.params.id]);
    res.json({ message: 'Cupón eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar cupón' });
  }
});

export default router;
```

### 7.7. Rutas de notificaciones

Crear `src/routes/notifications.routes.ts`:

```typescript
import { Router, Response } from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/notifications — Listar notificaciones del usuario
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

// GET /api/notifications/unread-count — Cantidad de no leídas
router.get('/unread-count', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.userId]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener conteo' });
  }
});

// PUT /api/notifications/mark-read — Marcar como leídas (una o todas)
router.put('/mark-read', authenticate, async (req: AuthRequest, res: Response) => {
  const { id } = req.body; // Si se pasa id, marca solo esa; si no, marca todas
  try {
    if (id) {
      await pool.query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [id, req.userId]);
    } else {
      await pool.query('UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false', [req.userId]);
    }
    res.json({ message: 'Notificaciones marcadas como leídas' });
  } catch (error) {
    res.status(500).json({ error: 'Error al marcar notificaciones' });
  }
});

export default router;
```

### 7.8. Rutas de perfiles

Crear `src/routes/profiles.routes.ts`:

```typescript
import { Router, Response } from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/profiles/me — Perfil del usuario actual
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [req.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Perfil no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// PUT /api/profiles/me — Actualizar perfil
router.put('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const { full_name, phone, address, municipality, province, email } = req.body;
  try {
    // Upsert: si existe actualizar, si no crear
    const existing = await pool.query('SELECT id FROM profiles WHERE user_id = $1', [req.userId]);
    
    if (existing.rows.length > 0) {
      const result = await pool.query(
        `UPDATE profiles SET full_name=$1, phone=$2, address=$3, municipality=$4, province=$5, email=$6
         WHERE user_id=$7 RETURNING *`,
        [full_name, phone, address, municipality, province, email, req.userId]
      );
      res.json(result.rows[0]);
    } else {
      const result = await pool.query(
        `INSERT INTO profiles (user_id, full_name, phone, address, municipality, province, email)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [req.userId, full_name, phone, address, municipality, province, email]
      );
      res.status(201).json(result.rows[0]);
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

export default router;
```

### 7.9. Rutas de contacto, testimonios, categorías, stock alerts y admin

Crear `src/routes/contact.routes.ts`:

```typescript
import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();

// POST /api/contact — Enviar mensaje (público)
router.post('/', async (req: Request, res: Response) => {
  const { name, email, phone, subject, message } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO contact_messages (name, email, phone, subject, message) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, email, phone, subject, message]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
});

// GET /api/contact — Listar mensajes (admin)
router.get('/', authenticate, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

// PUT /api/contact/:id — Marcar como leído (admin)
router.put('/:id', authenticate, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE contact_messages SET is_read = true WHERE id = $1', [req.params.id]);
    res.json({ message: 'Marcado como leído' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar mensaje' });
  }
});

export default router;
```

Crear `src/routes/testimonials.routes.ts`:

```typescript
import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();

// GET /api/testimonials — Testimonios visibles (público)
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM testimonials WHERE is_visible = true ORDER BY display_order ASC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener testimonios' });
  }
});

// POST /api/testimonials — Crear testimonio (admin)
router.post('/', authenticate, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  const { name, text, location, rating, is_visible, display_order } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO testimonials (name, text, location, rating, is_visible, display_order) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, text, location || '', rating || 5, is_visible ?? true, display_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear testimonio' });
  }
});

// PUT /api/testimonials/:id (admin)
router.put('/:id', authenticate, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  const { name, text, location, rating, is_visible, display_order } = req.body;
  try {
    const result = await pool.query(
      'UPDATE testimonials SET name=$1, text=$2, location=$3, rating=$4, is_visible=$5, display_order=$6 WHERE id=$7 RETURNING *',
      [name, text, location, rating, is_visible, display_order, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar testimonio' });
  }
});

// DELETE /api/testimonials/:id (admin)
router.delete('/:id', authenticate, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM testimonials WHERE id = $1', [req.params.id]);
    res.json({ message: 'Testimonio eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar testimonio' });
  }
});

export default router;
```

Crear `src/routes/categories.routes.ts`:

```typescript
import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();

router.get('/', async (_: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

router.post('/', authenticate, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  const { name, icon } = req.body;
  try {
    const result = await pool.query('INSERT INTO categories (name, icon) VALUES ($1,$2) RETURNING *', [name, icon]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

router.put('/:id', authenticate, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  const { name, icon } = req.body;
  try {
    const result = await pool.query('UPDATE categories SET name=$1, icon=$2 WHERE id=$3 RETURNING *', [name, icon, req.params.id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
});

router.delete('/:id', authenticate, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    res.json({ message: 'Categoría eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
});

export default router;
```

Crear `src/routes/stockAlerts.routes.ts`:

```typescript
import { Router, Request, Response } from 'express';
import pool from '../config/database';

const router = Router();

// POST /api/stock-alerts — Crear alerta de stock (público)
router.post('/', async (req: Request, res: Response) => {
  const { product_id, email, phone, user_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO stock_alerts (product_id, email, phone, user_id) VALUES ($1,$2,$3,$4) RETURNING *',
      [product_id, email, phone, user_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear alerta' });
  }
});

export default router;
```

Crear `src/routes/admin.routes.ts`:

```typescript
import { Router, Response } from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();

// GET /api/admin/stats — Estadísticas del dashboard
router.get('/stats', authenticate, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const [ordersResult, productsCount, usersCount, lowStock] = await Promise.all([
      pool.query('SELECT * FROM orders'),
      pool.query("SELECT COUNT(*) as count FROM products WHERE is_active = true"),
      pool.query('SELECT COUNT(*) as count FROM profiles'),
      pool.query("SELECT id, name, stock, image_url FROM products WHERE is_active = true AND stock <= 10 ORDER BY stock ASC LIMIT 10"),
    ]);

    const orders = ordersResult.rows;
    const totalSales = orders.reduce((sum: number, o: any) => sum + parseFloat(o.total_amount), 0);
    const pendingOrders = orders.filter((o: any) => o.status === 'pending').length;

    // Ventas por día (últimos 7 días)
    const salesByDate = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      const dayTotal = orders
        .filter((o: any) => o.created_at.split('T')[0] === dateStr)
        .reduce((sum: number, o: any) => sum + parseFloat(o.total_amount), 0);
      return { date: dateStr, total: dayTotal };
    });

    // Pedidos por estado
    const statusMap = new Map<string, number>();
    orders.forEach((o: any) => statusMap.set(o.status, (statusMap.get(o.status) || 0) + 1));
    const ordersByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

    res.json({
      totalSales,
      totalOrders: orders.length,
      totalUsers: parseInt(usersCount.rows[0].count),
      totalProducts: parseInt(productsCount.rows[0].count),
      pendingOrders,
      salesByDate,
      ordersByStatus,
      lowStockProducts: lowStock.rows,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// GET /api/admin/users — Listar usuarios con roles
router.get('/users', authenticate, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT p.*, ur.role
      FROM profiles p
      LEFT JOIN user_roles ur ON ur.user_id = p.user_id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// PUT /api/admin/users/:userId/role — Asignar rol
router.put('/users/:userId/role', authenticate, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  const { role } = req.body; // 'admin', 'gestor', 'user'
  const { userId } = req.params;
  try {
    // Eliminar rol anterior y asignar nuevo
    await pool.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
    await pool.query('INSERT INTO user_roles (user_id, role) VALUES ($1, $2)', [userId, role]);
    res.json({ message: `Rol ${role} asignado` });
  } catch (error) {
    res.status(500).json({ error: 'Error al asignar rol' });
  }
});

// GET /api/admin/orders — Todos los pedidos con info de cliente
router.get('/orders', authenticate, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT o.*, p.full_name as customer_name, p.email as customer_email,
        json_agg(DISTINCT jsonb_build_object(
          'id', oi.id, 'product_id', oi.product_id, 'product_name', oi.product_name,
          'quantity', oi.quantity, 'price_at_purchase', oi.price_at_purchase
        )) FILTER (WHERE oi.id IS NOT NULL) as order_items
      FROM orders o
      LEFT JOIN profiles p ON p.user_id = o.user_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id, p.full_name, p.email
      ORDER BY o.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

export default router;
```

---

## 8. Implementar Autorización (Roles)

### 8.1. Middleware de roles

Crear `src/middleware/roles.ts`:

```typescript
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import pool from '../config/database';

export function requireRole(roles: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    try {
      const result = await pool.query(
        'SELECT role FROM user_roles WHERE user_id = $1',
        [req.userId]
      );

      const userRoles = result.rows.map(r => r.role);
      const hasPermission = roles.some(role => userRoles.includes(role));

      if (!hasPermission) {
        return res.status(403).json({ error: 'No tienes permiso para esta acción' });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Error verificando permisos' });
    }
  };
}
```

### 8.2. Equivalencia con las RLS policies actuales

| RLS Policy (Supabase) | Implementación Node.js |
|---|---|
| `auth.uid() = user_id` | `authenticate` middleware + `WHERE user_id = req.userId` |
| `is_admin(auth.uid())` | `requireRole(['admin'])` middleware |
| `is_gestor(auth.uid())` | `requireRole(['gestor'])` middleware |
| `is_active = true` (SELECT público) | Sin middleware, filtro en query SQL |
| `user_owns_order(auth.uid(), order_id)` | Verificar en el handler con query `WHERE user_id = req.userId` |
| `(auth.uid() = user_id) OR is_admin(auth.uid())` | Verificar en handler: comprobar propiedad o admin |
| Gestores solo editan sus productos | `WHERE created_by = req.userId` si no es admin |

---

## 9. Migrar Edge Functions (Emails)

Las 5 Edge Functions de Supabase se convierten en un servicio de email centralizado.

### 9.1. Servicio de email completo

Crear `src/services/email.service.ts`:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'FerreHogar <noreply@tudominio.com>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ============================================
// 1. Email de bienvenida (reemplaza send-welcome-email)
// ============================================
export async function sendWelcomeEmail(email: string, name: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: '🎉 ¡Bienvenido/a a FerreHogar!',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white;">🔧 FerreHogar</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
          <h2>¡Bienvenido/a, ${name}!</h2>
          <p>Gracias por registrarte. Ahora tienes acceso a todo nuestro catálogo.</p>
          <ul>
            <li>Completa tu perfil para agilizar compras</li>
            <li>Agrega productos a favoritos ❤️</li>
            <li>Activa alertas de stock en productos agotados</li>
            <li>Usa cupones de descuento en el checkout</li>
          </ul>
        </div>
      </div>
    `,
  });
}

// ============================================
// 2. Verificación de email
// ============================================
export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verifyUrl = `${process.env.API_URL || 'http://localhost:3001'}/api/auth/verify-email/${token}`;
  
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: '✉️ Verifica tu email - FerreHogar',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hola ${name},</h2>
        <p>Haz clic en el siguiente enlace para verificar tu email:</p>
        <a href="${verifyUrl}" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
          Verificar Email
        </a>
        <p style="color: #6b7280; font-size: 14px;">Este enlace es válido por 24 horas.</p>
      </div>
    `,
  });
}

// ============================================
// 3. Reset de contraseña
// ============================================
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;
  
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: '🔐 Restablecer contraseña - FerreHogar',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Restablecer contraseña</h2>
        <p>Solicitaste restablecer tu contraseña. Haz clic en el enlace:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
          Restablecer Contraseña
        </a>
        <p style="color: #6b7280; font-size: 14px;">Este enlace expira en 1 hora. Si no solicitaste esto, ignora este email.</p>
      </div>
    `,
  });
}

// ============================================
// 4. Confirmación de pedido (reemplaza send-order-confirmation)
// ============================================
interface OrderItem {
  product_name: string;
  quantity: number;
  price_at_purchase: number;
}

export async function sendOrderConfirmation(
  email: string, name: string, orderId: string, items: OrderItem[],
  total: number, address: string, municipality: string, deliveryTime: string, paymentMethod: string
) {
  const shortId = orderId.slice(0, 8).toUpperCase();
  const itemsHtml = items.map(i => 
    `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${i.product_name}</td>
     <td style="padding:8px;text-align:center;">${i.quantity}</td>
     <td style="padding:8px;text-align:right;">$${i.price_at_purchase * i.quantity} CUP</td></tr>`
  ).join('');

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `✅ Pedido #${shortId} confirmado - FerreHogar`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>¡Gracias por tu pedido, ${name}!</h2>
        <p><strong>Pedido:</strong> #${shortId}</p>
        <table style="width:100%;border-collapse:collapse;">${itemsHtml}</table>
        <p style="font-size:18px;font-weight:bold;">Total: $${total} CUP</p>
        <p>📍 ${address}, ${municipality}</p>
        <p>🕐 ${deliveryTime}</p>
      </div>
    `,
  });
}

// ============================================
// 5. Actualización de estado (reemplaza send-order-status-update)
// ============================================
export async function sendOrderStatusUpdate(email: string, orderId: string, status: string) {
  const labels: Record<string, string> = {
    confirmed: 'Confirmado ✅', preparing: 'En Preparación 👨‍🍳',
    shipped: 'Enviado 🚚', delivered: 'Entregado 📦', cancelled: 'Cancelado ❌',
  };

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Pedido #${orderId.slice(0, 8).toUpperCase()} - ${labels[status] || status}`,
    html: `<h2>Tu pedido ha sido actualizado a: ${labels[status] || status}</h2>`,
  });
}

// ============================================
// 6. Back in stock (reemplaza send-back-in-stock-email)
// ============================================
export async function sendBackInStockEmail(email: string, productName: string, productPrice: number) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `🎊 ¡${productName} ya está disponible!`,
    html: `
      <h2>¡Ya está disponible!</h2>
      <p><strong>${productName}</strong> ha vuelto al stock.</p>
      <p>Precio: $${productPrice} CUP</p>
      <p>⚡ Stock limitado — ¡No esperes demasiado!</p>
    `,
  });
}

// ============================================
// 7. Carrito abandonado (reemplaza send-abandoned-cart-email)
// ============================================
export async function sendAbandonedCartEmail(
  email: string, name: string, items: { product_name: string; quantity: number; price: number }[], total: number
) {
  const itemsHtml = items.map(i => `<li>${i.product_name} x${i.quantity} — $${i.price * i.quantity} CUP</li>`).join('');

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: '🛒 ¡Tienes productos esperándote en tu carrito!',
    html: `
      <h2>¡${name}, olvidaste algo!</h2>
      <p>Dejaste productos en tu carrito:</p>
      <ul>${itemsHtml}</ul>
      <p style="font-size:18px;font-weight:bold;">Total: $${total} CUP</p>
      <p>⚡ La disponibilidad puede cambiar. ¡No te quedes sin ellos!</p>
    `,
  });
}
```

### 9.2. Cron job para back-in-stock (reemplaza la invocación manual)

En `src/index.ts`, agregar:

```typescript
import cron from 'node-cron';
import pool from './config/database';
import { sendBackInStockEmail } from './services/email.service';

// Verificar stock cada hora y notificar alertas
cron.schedule('0 * * * *', async () => {
  try {
    // Productos que volvieron al stock
    const alerts = await pool.query(`
      SELECT sa.id, sa.email, p.name, p.price, p.stock
      FROM stock_alerts sa
      INNER JOIN products p ON p.id = sa.product_id
      WHERE sa.notified = false AND sa.email IS NOT NULL AND p.stock > 0
    `);

    for (const alert of alerts.rows) {
      try {
        await sendBackInStockEmail(alert.email, alert.name, alert.price);
        await pool.query('UPDATE stock_alerts SET notified = true WHERE id = $1', [alert.id]);
      } catch (err) {
        console.error('Error enviando alerta de stock:', err);
      }
    }

    if (alerts.rows.length > 0) {
      console.log(`📧 ${alerts.rows.length} alertas de stock enviadas`);
    }
  } catch (error) {
    console.error('Error en cron de stock alerts:', error);
  }
});
```

---

## 10. Migrar Storage (Imágenes)

### 10.1. Opción A: Almacenamiento local con multer

Crear `src/routes/upload.routes.ts`:

```typescript
import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

// Asegurar que las carpetas existen
['uploads/products', 'uploads/avatars'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = (req.query.bucket as string) === 'avatars' ? 'uploads/avatars' : 'uploads/products';
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

const router = Router();

// POST /api/upload — Subir imagen
router.post('/', authenticate, upload.single('file'), (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
  
  const bucket = (req.query.bucket as string) === 'avatars' ? 'avatars' : 'products';
  const url = `${process.env.API_URL || 'http://localhost:3001'}/uploads/${bucket}/${req.file.filename}`;
  res.json({ url, path: `${bucket}/${req.file.filename}` });
});

export default router;
```

### 10.2. Opción B: AWS S3 / Cloudflare R2 (recomendado para producción)

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

```typescript
// src/services/storage.service.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
});

export async function uploadFile(buffer: Buffer, key: string, contentType: string): Promise<string> {
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  return `${process.env.S3_PUBLIC_URL}/${key}`;
}
```

### 10.3. Migrar imágenes existentes

Las imágenes actuales están en Supabase Storage. URLs tienen el formato:
```
https://qteipiljcipcvovjfwtf.supabase.co/storage/v1/object/public/product-images/...
https://qteipiljcipcvovjfwtf.supabase.co/storage/v1/object/public/avatars/...
```

Script para descargar y re-subir:

```javascript
// scripts/migrate-images.js
const https = require('https');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (res) => {
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

async function main() {
  // Migrar imágenes de productos
  const products = await pool.query('SELECT id, image_url FROM products WHERE image_url IS NOT NULL');
  for (const p of products.rows) {
    if (p.image_url.includes('supabase.co')) {
      const filename = path.basename(p.image_url);
      const destPath = `uploads/products/${filename}`;
      await downloadImage(p.image_url, destPath);
      const newUrl = `${process.env.API_URL}/uploads/products/${filename}`;
      await pool.query('UPDATE products SET image_url = $1 WHERE id = $2', [newUrl, p.id]);
      console.log(`✅ Migrada imagen: ${filename}`);
    }
  }

  // Migrar avatares
  const profiles = await pool.query('SELECT user_id, avatar_url FROM profiles WHERE avatar_url IS NOT NULL');
  for (const p of profiles.rows) {
    if (p.avatar_url.includes('supabase.co')) {
      const filename = path.basename(p.avatar_url);
      const destPath = `uploads/avatars/${filename}`;
      await downloadImage(p.avatar_url, destPath);
      const newUrl = `${process.env.API_URL}/uploads/avatars/${filename}`;
      await pool.query('UPDATE profiles SET avatar_url = $1 WHERE user_id = $2', [newUrl, p.user_id]);
    }
  }

  // Migrar product_images
  const images = await pool.query('SELECT id, image_url FROM product_images');
  for (const img of images.rows) {
    if (img.image_url.includes('supabase.co')) {
      const filename = path.basename(img.image_url);
      const destPath = `uploads/products/${filename}`;
      await downloadImage(img.image_url, destPath);
      const newUrl = `${process.env.API_URL}/uploads/products/${filename}`;
      await pool.query('UPDATE product_images SET image_url = $1 WHERE id = $2', [newUrl, img.id]);
    }
  }

  await pool.end();
  console.log('🎉 Migración de imágenes completada');
}

main().catch(console.error);
```

---

## 11. Migrar Realtime (Notificaciones)

### 11.1. Opción A: Polling (más simple)

```typescript
// En el frontend, reemplazar suscripción realtime por polling
useEffect(() => {
  const interval = setInterval(async () => {
    const res = await fetch('/api/notifications/unread-count', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setUnreadCount(data.count);
  }, 30000); // cada 30 segundos

  return () => clearInterval(interval);
}, [token]);
```

### 11.2. Opción B: WebSockets con Socket.io (recomendado)

```bash
npm install socket.io
# Frontend:
npm install socket.io-client
```

Backend (modificar `src/index.ts`):

```typescript
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
});

// Autenticar conexiones WebSocket
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    socket.data.userId = decoded.userId;
    next();
  } catch {
    next(new Error('No autenticado'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.data.userId;
  socket.join(`user:${userId}`);
  console.log(`Usuario ${userId} conectado vía WebSocket`);
  
  socket.on('disconnect', () => {
    console.log(`Usuario ${userId} desconectado`);
  });
});

export { io };

// Cambiar app.listen por:
httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
```

Emitir notificaciones desde las rutas:

```typescript
// En orders.routes.ts, después de cambiar estado:
import { io } from '../index';

io.to(`user:${order.user_id}`).emit('notification', {
  title: 'Pedido actualizado',
  message: `Tu pedido ha cambiado a: ${newStatus}`,
  type: 'order_update',
  reference_id: order.id,
});
```

Frontend hook:

```typescript
// src/hooks/useSocket.ts
import { io, Socket } from 'socket.io-client';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export function useSocket(token: string | null) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001', {
      auth: { token },
    });

    socket.on('notification', (data: { title: string; message: string }) => {
      toast.info(data.title, { description: data.message, duration: 6000 });
      // Invalidar queries de notificaciones
    });

    socketRef.current = socket;

    return () => { socket.disconnect(); };
  }, [token]);

  return socketRef.current;
}
```

---

## 12. Actualizar el Frontend

### 12.1. Crear cliente API

Reemplazar todas las importaciones de `@/integrations/supabase/client` por un cliente HTTP.

Crear `src/lib/api.ts`:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function setToken(token: string) {
  localStorage.setItem('auth_token', token);
}

export function setRefreshToken(token: string) {
  localStorage.setItem('refresh_token', token);
}

export function clearTokens() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const data = await response.json();
    setToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    return data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  // Si el token expiró, intentar renovar
  if (response.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, data?: unknown) => request<T>(endpoint, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  put: <T>(endpoint: string, data: unknown) => request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
```

### 12.2. Migración de cada hook (Antes → Después)

**useAuth.tsx:**

```typescript
// ANTES:
const { data, error } = await supabase.auth.signInWithPassword({ email, password });

// DESPUÉS:
const { user, accessToken, refreshToken } = await api.post<LoginResponse>('/auth/login', { email, password });
setToken(accessToken);
setRefreshToken(refreshToken);
```

**useProducts.ts:**

```typescript
// ANTES:
const { data, error } = await supabase.from('products').select('*, categories(*)').eq('is_active', true);

// DESPUÉS:
const data = await api.get<Product[]>('/products');
```

**useOrders.ts:**

```typescript
// ANTES:
const { data } = await supabase.from('orders').select('*, order_items(*, products(*))').eq('user_id', user.id);

// DESPUÉS:
const data = await api.get<Order[]>('/orders');
```

**useFavorites.ts:**

```typescript
// ANTES:
await supabase.from('favorites').insert({ user_id: user.id, product_id });
await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', productId);

// DESPUÉS:
await api.post('/favorites', { product_id: productId });
await api.delete(`/favorites/${productId}`);
```

**useReviews.ts:**

```typescript
// ANTES:
const { data } = await supabase.from('reviews').select('*').eq('product_id', productId);

// DESPUÉS:
const data = await api.get<Review[]>(`/reviews?product_id=${productId}`);
```

**useBulkRatings.ts:**

```typescript
// ANTES:
const { data } = await supabase.from('reviews').select('product_id, rating').in('product_id', productIds);

// DESPUÉS:
const data = await api.post<Record<string, BulkRating>>('/reviews/bulk-ratings', { productIds });
```

**useNotifications.ts:**

```typescript
// ANTES (realtime):
const channel = supabase.channel('user-notifications').on('postgres_changes', {...}).subscribe();

// DESPUÉS (polling o WebSocket):
// Polling:
const data = await api.get<Notification[]>('/notifications');
// Marcar leídas:
await api.put('/notifications/mark-read', { id });
```

**useCoupon.ts:**

```typescript
// ANTES:
const { data } = await supabase.rpc('validate_coupon', { p_code, p_order_amount });

// DESPUÉS:
const data = await api.post<CouponResult>('/coupons/validate', { code, orderAmount });
```

**useStockValidation.ts:**

```typescript
// ANTES:
const { data } = await supabase.rpc('check_stock_availability', { p_items: itemsJson });

// DESPUÉS:
const data = await api.post<StockCheckResult[]>('/products/check-stock', { items: itemsJson });
```

**useProfile.ts:**

```typescript
// ANTES:
const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();

// DESPUÉS:
const data = await api.get<Profile>('/profiles/me');
await api.put('/profiles/me', profileData);
```

**useProductPrices.ts:**

```typescript
// ANTES:
const { data } = await supabase.from('product_prices').select('*').eq('product_id', productId);

// DESPUÉS:
const data = await api.get<ProductPrice[]>(`/products/${productId}/prices`);
// Bulk:
const data = await api.post<ProductPrice[]>('/products/prices/bulk', { productIds });
```

**useAdminStats.ts:**

```typescript
// ANTES: Múltiples queries a supabase

// DESPUÉS:
const stats = await api.get<AdminStats>('/admin/stats');
const users = await api.get<UserWithRole[]>('/admin/users');
```

### 12.3. Lista completa de archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/hooks/useAuth.tsx` | Reemplazar `supabase.auth` por `api.post('/auth/...')`, gestionar tokens |
| `src/hooks/useProducts.ts` | Reemplazar queries por `api.get('/products')` |
| `src/hooks/useOrders.ts` | Reemplazar queries por `api.get/post('/orders')` |
| `src/hooks/useReviews.ts` | Reemplazar queries por `api.get/post('/reviews')` |
| `src/hooks/useFavorites.ts` | Reemplazar queries por `api.get/post/delete('/favorites')` |
| `src/hooks/useNotifications.ts` | Reemplazar canal realtime por polling o WebSocket |
| `src/hooks/useProfile.ts` | Reemplazar queries por `api.get/put('/profiles/me')` |
| `src/hooks/useCoupon.ts` | Reemplazar `supabase.rpc` por `api.post('/coupons/validate')` |
| `src/hooks/useProductPrices.ts` | Reemplazar queries por `api.get/post` |
| `src/hooks/useBulkRatings.ts` | Reemplazar query por `api.post('/reviews/bulk-ratings')` |
| `src/hooks/useAdminStats.ts` | Reemplazar queries por `api.get('/admin/stats')` |
| `src/hooks/useStockValidation.ts` | Reemplazar `supabase.rpc` por `api.post` |
| `src/hooks/useCartPrices.ts` | Si usa supabase, migrar |
| `src/hooks/useRateLimit.ts` | Verificar si usa supabase |
| `src/hooks/useRecentlyViewed.ts` | Probablemente localStorage, no necesita cambio |
| `src/hooks/useTheme.ts` | No usa supabase, no necesita cambio |
| `src/components/admin/*.tsx` | Actualizar todas las operaciones CRUD |
| `src/pages/Checkout.tsx` | Actualizar creación de pedido |
| `src/pages/Contact.tsx` | Actualizar envío de mensaje |
| `src/pages/Profile.tsx` | Actualizar carga/actualización de perfil y avatar |
| `src/pages/Login.tsx` | Actualizar autenticación |
| `src/pages/Register.tsx` | Actualizar registro |
| `src/pages/ForgotPassword.tsx` | Actualizar reset de contraseña |
| `src/pages/ResetPassword.tsx` | Actualizar con token en URL |
| `src/pages/GestorPanel.tsx` | Actualizar queries de gestor |

### 12.4. Eliminar dependencias de Supabase

```bash
npm uninstall @supabase/supabase-js
```

Eliminar archivos:
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- `supabase/` (toda la carpeta)
- `.env` (actualizar variables)

---

## 13. Seguridad y Rate Limiting

### 13.1. Rate limiting

Crear `src/middleware/rateLimit.ts`:

```typescript
import rateLimit from 'express-rate-limit';

// Limitar intentos de login
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 intentos
  message: { error: 'Demasiados intentos. Inténtalo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limitar requests generales de API
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requests por minuto
  message: { error: 'Demasiadas solicitudes. Inténtalo más tarde.' },
});

// Limitar envío de mensajes de contacto
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // Máximo 5 mensajes por hora
  message: { error: 'Has enviado demasiados mensajes. Inténtalo más tarde.' },
});
```

Aplicar en `src/index.ts`:

```typescript
import { authLimiter, apiLimiter } from './middleware/rateLimit';

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api', apiLimiter);
```

### 13.2. Seguridad adicional

```typescript
// En src/index.ts
import helmet from 'helmet';

app.use(helmet());

// Deshabilitar header X-Powered-By
app.disable('x-powered-by');

// Limitar tamaño del body
app.use(express.json({ limit: '10mb' }));

// CORS restrictivo
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
```

---

## 14. Validación con Zod

### 14.1. Middleware de validación

Crear `src/middleware/validate.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Datos inválidos',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
}
```

### 14.2. Esquemas de validación

Crear `src/types/schemas.ts`:

```typescript
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  full_name: z.string().min(2, 'Nombre muy corto'),
  phone: z.string().min(8, 'Teléfono inválido'),
  address: z.string().optional(),
  municipality: z.string().optional(),
  province: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export const productSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  price: z.number().positive('El precio debe ser positivo'),
  description: z.string().optional(),
  category_id: z.string().uuid().optional().nullable(),
  stock: z.number().int().min(0).optional(),
  compare_at_price: z.number().positive().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
});

export const orderSchema = z.object({
  delivery_address: z.string().min(5, 'Dirección muy corta'),
  municipality: z.string().min(2, 'Municipio requerido'),
  phone: z.string().min(8, 'Teléfono inválido'),
  delivery_time: z.string().min(1, 'Horario requerido'),
  payment_method: z.string().min(1, 'Método de pago requerido'),
  total_amount: z.number().positive(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    product_name: z.string(),
    quantity: z.number().int().positive(),
    price_at_purchase: z.number().positive(),
  })).min(1, 'El pedido debe tener al menos un producto'),
});

export const reviewSchema = z.object({
  product_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export const contactSchema = z.object({
  name: z.string().min(2, 'Nombre muy corto'),
  email: z.string().email('Email inválido'),
  subject: z.string().min(3, 'Asunto muy corto'),
  message: z.string().min(10, 'Mensaje muy corto'),
  phone: z.string().optional(),
});
```

### 14.3. Usar validación en las rutas

```typescript
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../types/schemas';

router.post('/register', validate(registerSchema), async (req, res) => { ... });
router.post('/login', validate(loginSchema), async (req, res) => { ... });
```

---

## 15. Variables de Entorno

### Backend (`ferrehogar-api/.env`)

```env
# Servidor
PORT=3001
NODE_ENV=production

# Base de datos
DATABASE_URL=postgresql://ferrehogar_user:tu_contraseña@localhost:5432/ferrehogar_db

# JWT (genera con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=tu_jwt_secret_muy_largo_y_seguro_de_al_menos_64_caracteres

# Email
RESEND_API_KEY=re_xxxxxxxx
FROM_EMAIL=FerreHogar <noreply@tudominio.com>

# Frontend URL (para CORS y enlaces en emails)
FRONTEND_URL=https://tudominio.com

# API URL pública (para generar URLs de imágenes)
API_URL=https://api.tudominio.com

# Storage (si usas S3/R2)
S3_REGION=auto
S3_ENDPOINT=https://xxx.r2.cloudflarestorage.com
S3_ACCESS_KEY=xxx
S3_SECRET_KEY=xxx
S3_BUCKET=ferrehogar-uploads
S3_PUBLIC_URL=https://cdn.tudominio.com
```

### Frontend (`.env`)

```env
# Reemplazar las variables de Supabase por:
VITE_API_URL=https://api.tudominio.com/api
```

---

## 16. Deploy en Producción

### 16.1. Opción A: VPS (DigitalOcean, Hetzner, etc.)

```bash
# 1. Conectar al servidor
ssh root@tu-servidor

# 2. Instalar Node.js y PostgreSQL
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs postgresql nginx certbot python3-certbot-nginx

# 3. Configurar PostgreSQL (ver Sección 2)

# 4. Clonar y construir
git clone https://github.com/tu-repo/ferrehogar-api.git
cd ferrehogar-api
npm install
npm run build

# 5. Configurar variables de entorno
cp .env.example .env
nano .env  # Editar con valores de producción

# 6. Ejecutar migraciones SQL
psql -U ferrehogar_user -d ferrehogar_db -f sql/schema.sql

# 7. Importar datos
npm run import-data

# 8. Usar PM2 para mantener el proceso vivo
npm install -g pm2
pm2 start dist/index.js --name ferrehogar-api
pm2 save
pm2 startup
```

**Configuración Nginx:**

```nginx
server {
    listen 80;
    server_name api.tudominio.com;

    # Redireccionar uploads grandes
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 9. SSL con Let's Encrypt
sudo certbot --nginx -d api.tudominio.com

# 10. Configurar backup automático de PostgreSQL
crontab -e
# Añadir: 0 3 * * * pg_dump ferrehogar_db | gzip > /backups/ferrehogar_$(date +\%Y\%m\%d).sql.gz
```

### 16.2. Opción B: Railway / Render (PaaS)

1. Crear cuenta en [Railway](https://railway.app) o [Render](https://render.com)
2. Conectar repositorio de GitHub
3. Agregar servicio PostgreSQL
4. Configurar variables de entorno (todas las del `.env`)
5. Deploy automático con cada push

### 16.3. Frontend en Vercel/Netlify

```bash
# Construir el frontend
npm run build

# El output en dist/ se sube a Vercel/Netlify
# Configurar la variable VITE_API_URL apuntando a tu API
```

**Configuración de Vercel (`vercel.json`):**

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

---

## 17. Checklist Final

### Pre-migración
- [ ] Exportar todos los datos de Lovable Cloud (cada tabla en JSON)
- [ ] Descargar todas las imágenes de Supabase Storage
- [ ] Documentar los roles de usuarios existentes
- [ ] Guardar las claves de API (RESEND_API_KEY, etc.)

### Base de datos
- [ ] PostgreSQL instalado y configurado
- [ ] Extensión pgcrypto habilitada
- [ ] Enums creados (`app_role`, `order_status`)
- [ ] Todas las 16 tablas creadas con el esquema correcto
- [ ] Todas las funciones de utilidad creadas (`validate_coupon`, `check_stock_availability`)
- [ ] 6 triggers implementados (updated_at, stock, notificaciones, historial, cupones)
- [ ] Índices creados para rendimiento (20+ índices)
- [ ] Datos migrados y verificados
- [ ] Imágenes descargadas y re-subidas

### Backend Node.js
- [ ] Servidor Express funcionando
- [ ] Conexión a PostgreSQL establecida
- [ ] **Autenticación completa:**
  - [ ] Registro con verificación de email
  - [ ] Login con JWT (access + refresh tokens)
  - [ ] Refresh token rotation
  - [ ] Verificación de email por enlace
  - [ ] Olvidé mi contraseña (enviar email con token)
  - [ ] Restablecer contraseña con token
  - [ ] Cambiar contraseña (requiere contraseña actual)
  - [ ] Logout (revocar refresh token)
  - [ ] GET /me (datos del usuario + roles)
- [ ] **Middleware de roles** (admin, gestor, user)
- [ ] **Todos los endpoints CRUD:**
  - [ ] Productos (GET lista, GET detalle, POST, PUT, DELETE soft)
  - [ ] Productos admin/all (incluye inactivos)
  - [ ] Productos gestor/mine (solo propios)
  - [ ] Verificación de stock (POST check-stock)
  - [ ] Precios multi-moneda (GET por producto, POST bulk)
  - [ ] Imágenes de producto (GET)
  - [ ] Métodos de pago por producto (GET)
  - [ ] Categorías (GET, POST, PUT, DELETE)
  - [ ] Pedidos (GET propios, POST crear con items, PUT estado)
  - [ ] Pedidos admin (GET todos con info cliente)
  - [ ] Notas admin en pedidos (PUT)
  - [ ] Reseñas (GET por producto, POST, PUT, DELETE)
  - [ ] Ratings bulk (POST)
  - [ ] Favoritos (GET, POST, DELETE por productId)
  - [ ] Cupones CRUD + validación
  - [ ] Notificaciones (GET, unread-count, mark-read)
  - [ ] Perfiles (GET me, PUT me)
  - [ ] Avatar upload
  - [ ] Contacto (POST público, GET/PUT admin)
  - [ ] Testimonios (GET público, CRUD admin)
  - [ ] Alertas de stock (POST público)
  - [ ] Upload de imágenes (productos y avatares)
  - [ ] Estadísticas admin (GET)
  - [ ] Gestión de usuarios admin (GET, PUT rol)
- [ ] **Servicio de email completo** (7 tipos de email)
- [ ] **Cron job** para alertas de back-in-stock
- [ ] **WebSocket o polling** para notificaciones
- [ ] **Validación con Zod** en todas las rutas
- [ ] **Rate limiting** en auth y API general
- [ ] **Manejo de errores** centralizado
- [ ] **CORS** configurado correctamente
- [ ] **Helmet** para headers de seguridad

### Frontend
- [ ] Cliente API (`api.ts`) creado con refresh token automático
- [ ] **Todos los hooks migrados** (15+ hooks):
  - [ ] useAuth → JWT con tokens
  - [ ] useProducts → api.get
  - [ ] useOrders → api.get/post
  - [ ] useReviews → api.get/post
  - [ ] useFavorites → api.get/post/delete
  - [ ] useNotifications → polling/WebSocket
  - [ ] useProfile → api.get/put
  - [ ] useCoupon → api.post
  - [ ] useProductPrices → api.get/post
  - [ ] useBulkRatings → api.post
  - [ ] useAdminStats → api.get
  - [ ] useStockValidation → api.post
- [ ] **Todas las páginas actualizadas** (Login, Register, ForgotPassword, ResetPassword, etc.)
- [ ] **Componentes admin actualizados**
- [ ] **Upload de imágenes** apuntando al nuevo endpoint
- [ ] **Variables de entorno** actualizadas (VITE_API_URL)
- [ ] Dependencia `@supabase/supabase-js` eliminada
- [ ] Archivos de integración Supabase eliminados

### Producción
- [ ] SSL/TLS configurado (Let's Encrypt)
- [ ] Variables de entorno de producción configuradas
- [ ] PM2 para gestión de procesos
- [ ] Nginx como reverse proxy (con WebSocket support)
- [ ] Backups automáticos de PostgreSQL (cron diario)
- [ ] Monitoreo de logs (PM2 logs, syslog)
- [ ] Rate limiting en producción
- [ ] CORS apuntando solo al dominio de producción
- [ ] Tests E2E pasando
- [ ] Dominio y DNS configurados

---

## Recursos Adicionales

- [Express.js Docs](https://expressjs.com/)
- [node-postgres (pg)](https://node-postgres.com/)
- [JWT.io](https://jwt.io/)
- [Socket.io Docs](https://socket.io/docs/)
- [Resend Docs](https://resend.com/docs)
- [PM2 Docs](https://pm2.keymetrics.io/)
- [Nginx Reverse Proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [Zod Docs](https://zod.dev/)
- [express-rate-limit](https://www.npmjs.com/package/express-rate-limit)
- [multer](https://www.npmjs.com/package/multer)
- [bcryptjs](https://www.npmjs.com/package/bcryptjs)

---

> **Nota:** Esta migración es un proceso gradual. Se recomienda hacerla endpoint por endpoint, manteniendo ambos backends funcionando en paralelo durante la transición. Prueba cada endpoint migrado antes de pasar al siguiente. El orden recomendado es:
> 1. Auth (registro, login, tokens)
> 2. Productos y categorías (lectura)
> 3. Perfiles
> 4. Pedidos
> 5. Favoritos y reseñas
> 6. Notificaciones
> 7. Admin panel
> 8. Storage (imágenes)
> 9. Emails
> 10. Eliminar Supabase
