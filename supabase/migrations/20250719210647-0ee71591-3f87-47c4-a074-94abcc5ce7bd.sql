-- Create orders table for one-time payments
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  stripe_session_id TEXT UNIQUE,
  paypal_order_id TEXT UNIQUE,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed, cancelled
  payment_method TEXT NOT NULL, -- stripe, paypal
  product_name TEXT NOT NULL,
  guest_checkout BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create subscribers table for recurring subscriptions
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT,
  subscription_end TIMESTAMPTZ,
  payment_method TEXT, -- stripe, paypal
  guest_checkout BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Policies for orders table
CREATE POLICY "Users can view their own orders" 
ON public.orders FOR SELECT 
USING (user_id = auth.uid() OR (guest_checkout = true AND email = auth.email()));

CREATE POLICY "Insert orders" ON public.orders
FOR INSERT WITH CHECK (true);

CREATE POLICY "Update orders" ON public.orders
FOR UPDATE USING (true);

-- Policies for subscribers table
CREATE POLICY "Users can view their own subscription" 
ON public.subscribers FOR SELECT
USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Update subscription" ON public.subscribers
FOR UPDATE USING (true);

CREATE POLICY "Insert subscription" ON public.subscribers
FOR INSERT WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscribers_updated_at
  BEFORE UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();