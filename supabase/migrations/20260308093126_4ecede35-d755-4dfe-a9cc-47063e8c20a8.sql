CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  text text NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  location text NOT NULL DEFAULT '',
  is_visible boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible testimonials" ON public.testimonials
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Admins can manage testimonials" ON public.testimonials
  FOR ALL USING (is_admin(auth.uid()));

-- Seed with existing static data
INSERT INTO public.testimonials (name, text, rating, location, display_order) VALUES
  ('María García', 'Excelente servicio y entrega rápida. Los productos llegaron en perfectas condiciones. ¡100% recomendado!', 5, 'La Habana', 0),
  ('Carlos Rodríguez', 'La mejor ferretería online que he encontrado. Precios justos y gran variedad de herramientas profesionales.', 5, 'Santiago de Cuba', 1),
  ('Ana López', 'Me encanta poder comprar desde casa. El proceso de pedido es muy fácil y el equipo siempre está disponible para ayudar.', 4, 'Camagüey', 2);