
-- Workspace services catalog
CREATE TABLE public.workspace_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'addon',
  icon TEXT NOT NULL DEFAULT 'zap',
  is_addon BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Subscriptions
CREATE TABLE public.workspace_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days')::date,
  status TEXT NOT NULL DEFAULT 'active',
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Invoices
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subscription_id UUID REFERENCES public.workspace_subscriptions(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  total_amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '14 days')::date,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT DEFAULT 'cash',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Invoice line items
CREATE TABLE public.invoice_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.workspace_services(id) ON DELETE SET NULL,
  service_title TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.workspace_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_services ENABLE ROW LEVEL SECURITY;

-- Services are public read
CREATE POLICY "Services are viewable by everyone" ON public.workspace_services FOR SELECT USING (true);

-- Subscriptions: user sees own
CREATE POLICY "Users can view own subscriptions" ON public.workspace_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own subscriptions" ON public.workspace_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.workspace_subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Invoices: user sees own
CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Invoice services: user sees via invoice
CREATE POLICY "Users can view own invoice services" ON public.invoice_services FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND i.user_id = auth.uid())
);
CREATE POLICY "Users can create own invoice services" ON public.invoice_services FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND i.user_id = auth.uid())
);

-- Indexes
CREATE INDEX idx_subscriptions_user ON public.workspace_subscriptions(user_id);
CREATE INDEX idx_invoices_user ON public.invoices(user_id);
CREATE INDEX idx_invoice_services_invoice ON public.invoice_services(invoice_id);

-- Seed services
INSERT INTO public.workspace_services (title, description, price, category, icon, is_addon) VALUES
  ('مكتب خاص', 'مكتب خاص مجهز بالكامل لشخص واحد', 100, 'office', 'building', false),
  ('مكتب مشترك', 'مقعد في مساحة عمل مشتركة مفتوحة', 70, 'office', 'users', false),
  ('إنترنت فائق السرعة', 'إنترنت 100MB غير محدود', 20, 'utility', 'wifi', true),
  ('كهرباء مستمرة 24/7', 'كهرباء متواصلة مع UPS احتياطي', 15, 'utility', 'zap', true),
  ('قهوة ومشروبات', 'قهوة ومشروبات ساخنة وباردة مجانية طوال اليوم', 10, 'addon', 'coffee', true),
  ('قاعة اجتماعات', 'حجز قاعة اجتماعات مجهزة (بالساعة)', 10, 'addon', 'calendar', true),
  ('طباعة وتصوير', 'خدمة طباعة وتصوير مستندات', 5, 'addon', 'file-text', true);
