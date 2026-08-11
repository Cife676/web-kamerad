-- ============================================================
-- KAMERAD basecamp edition - Full Booking & Admin Management Schema
-- Copy and paste this script into your Supabase SQL Editor.
-- ============================================================

DROP TABLE IF EXISTS public.rental_items CASCADE;
DROP TABLE IF EXISTS public.rentals CASCADE;
DROP TABLE IF EXISTS public.items CASCADE;

-- 1. Items Inventory Table
CREATE TABLE public.items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_base_2days NUMERIC NOT NULL,
  price_extra_day NUMERIC NOT NULL,
  original_price NUMERIC,
  is_promo BOOLEAN DEFAULT FALSE,
  promo_tag TEXT,
  specs TEXT[] DEFAULT '{}',
  image TEXT NOT NULL,
  description TEXT,
  stock INT NOT NULL DEFAULT 10,
  weight TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Rentals Booking Table with Status Tracking (PENDING, CONFIRMED, CANCELLED, COMPLETED)
CREATE TABLE public.rentals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_code TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT DEFAULT '',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days INT NOT NULL,
  payment_method TEXT NOT NULL,
  grand_total NUMERIC NOT NULL,
  dp_amount NUMERIC NOT NULL,
  balance_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'PENDING', -- 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Rental Line Items Table
CREATE TABLE public.rental_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rental_id UUID REFERENCES public.rentals(id) ON DELETE CASCADE,
  item_id TEXT REFERENCES public.items(id),
  quantity INT NOT NULL DEFAULT 1,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Security Policies (RLS)
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read of items" ON public.items;
CREATE POLICY "Allow public read of items" ON public.items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public update of items stock" ON public.items;
CREATE POLICY "Allow public update of items stock" ON public.items FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public insert of items" ON public.items;
CREATE POLICY "Allow public insert of items" ON public.items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public insert of rentals" ON public.rentals;
CREATE POLICY "Allow public insert of rentals" ON public.rentals FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read of rentals" ON public.rentals;
CREATE POLICY "Allow public read of rentals" ON public.rentals FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public update of rentals" ON public.rentals;
CREATE POLICY "Allow public update of rentals" ON public.rentals FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public insert of rental_items" ON public.rental_items;
CREATE POLICY "Allow public insert of rental_items" ON public.rental_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read of rental_items" ON public.rental_items;
CREATE POLICY "Allow public read of rental_items" ON public.rental_items FOR SELECT USING (true);

-- 5. Booking Creation Stored Procedure (Initial PENDING Status)
CREATE OR REPLACE FUNCTION public.process_rental_booking(
  p_order_code TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_email TEXT,
  p_start_date DATE,
  p_end_date DATE,
  p_duration_days INT,
  p_payment_method TEXT,
  p_grand_total NUMERIC,
  p_dp_amount NUMERIC,
  p_balance_amount NUMERIC,
  p_notes TEXT,
  p_items JSONB
) RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $func$
DECLARE
  v_new_id UUID;
BEGIN
  -- Insert Rental Order Header with PENDING status
  INSERT INTO public.rentals (
    order_code, customer_name, customer_phone, customer_email, start_date, end_date,
    duration_days, payment_method, grand_total, dp_amount, balance_amount, status, notes
  ) VALUES (
    p_order_code, p_customer_name, p_customer_phone, COALESCE(p_customer_email, ''), p_start_date, p_end_date,
    p_duration_days, p_payment_method, p_grand_total, p_dp_amount, p_balance_amount, 'PENDING', COALESCE(p_notes, '')
  ) RETURNING id INTO v_new_id;

  -- Bulk Insert Line Items
  INSERT INTO public.rental_items (rental_id, item_id, quantity, total_price)
  SELECT 
    v_new_id,
    (elem->>'id')::TEXT,
    COALESCE((elem->>'qty')::INT, 1),
    COALESCE((elem->>'itemTotal')::NUMERIC, 0)
  FROM jsonb_array_elements(p_items) AS elem;

  RETURN jsonb_build_object('success', true, 'rental_id', v_new_id, 'order_code', p_order_code);
END;
$func$;

-- 6. Admin Update Booking Status Stored Procedure (Handles Stock Deduction on Confirm & Restoration on Cancel)
CREATE OR REPLACE FUNCTION public.admin_update_rental_status(
  p_rental_id UUID,
  p_new_status TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_old_status TEXT;
  r_item RECORD;
BEGIN
  SELECT status INTO v_old_status FROM public.rentals WHERE id = p_rental_id;
  IF v_old_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Rental order not found');
  END IF;

  -- If status changes from PENDING to CONFIRMED: Deduct stock
  IF v_old_status != 'CONFIRMED' AND p_new_status = 'CONFIRMED' THEN
    FOR r_item IN SELECT item_id, quantity FROM public.rental_items WHERE rental_id = p_rental_id LOOP
      UPDATE public.items 
      SET stock = GREATEST(0, stock - r_item.quantity)
      WHERE id = r_item.item_id;
    END LOOP;
  -- If status changes from CONFIRMED to CANCELLED: Restore stock
  ELSIF v_old_status = 'CONFIRMED' AND p_new_status = 'CANCELLED' THEN
    FOR r_item IN SELECT item_id, quantity FROM public.rental_items WHERE rental_id = p_rental_id LOOP
      UPDATE public.items 
      SET stock = stock + r_item.quantity
      WHERE id = r_item.item_id;
    END LOOP;
  END IF;

  -- Update Rental status
  UPDATE public.rentals 
  SET status = p_new_status 
  WHERE id = p_rental_id;

  RETURN jsonb_build_object('success', true, 'rental_id', p_rental_id, 'new_status', p_new_status);
END;
$func$;

-- 7. Seed Initial Inventory Catalog Data (IDR Rupiah Rates)
INSERT INTO public.items (id, name, category, price_base_2days, price_extra_day, original_price, is_promo, promo_tag, specs, image, description, stock, weight)
VALUES
('kmrd-p1', 'KAMERAD Summit Alpine Bundle (Tent + Pack + Bag)', 'promo', 100000, 40000, 140000, true, 'SPECIAL BUNDLE - 30% OFF', ARRAY['Complete 2-Person Kit', '4-Season Geodesic Tent', '65L Technical Pack'], 'assets/hero_banner.jpg', 'The ultimate basecamp combo for 2 adventurers.', 5, '7.2 kg total'),
('kmrd-p2', 'Weekend Fastpack Promo Kit (Tent + Stove)', 'promo', 65000, 25000, 90000, true, 'HOT DEAL - 25% OFF', ARRAY['Solo Trekker Pack', 'Ultralight 1P Tent', 'Windproof Jet Stove'], 'assets/tent_4season.jpg', 'Lightweight solo setup designed for fast weekend summit pushes.', 8, '3.1 kg total'),
('kmrd-t1', 'KAMERAD Arcus-XT 4-Person Expedition Tent', 'tents', 50000, 20000, NULL, false, NULL, ARRAY['4 Person', 'Geodesic Alloy Frame', '10,000mm Waterproof'], 'assets/tent_4season.jpg', 'Stormproof 4-person geodesic tent built to withstand extreme mountain ridge winds.', 12, '3.4 kg'),
('kmrd-t2', 'KAMERAD MicroLite 2P Trekking Tent', 'tents', 35000, 15000, NULL, false, NULL, ARRAY['2 Person', 'Freestanding', '3-Season'], 'assets/tent_4season.jpg', 'Quick pitch 3-season tent with dual entry vestibules.', 15, '1.9 kg'),
('kmrd-b1', 'KAMERAD Vanguard 65L Expedition Pack', 'backpacks', 30000, 10000, NULL, false, NULL, ARRAY['65L Capacity', 'Adjustable Spine Harness', 'Rain Cover Included'], 'assets/hero_banner.jpg', 'Heavy load carrier with ergo-fit hipbelt.', 10, '2.1 kg'),
('kmrd-b2', 'KAMERAD Ridge 45L Alpine Pack', 'backpacks', 25000, 10000, NULL, false, NULL, ARRAY['45L Capacity', 'Ice Axe Loops', 'Waterproof Fabric'], 'assets/hero_banner.jpg', 'Streamlined alpine pack engineered for technical ascents.', 14, '1.4 kg'),
('kmrd-s1', 'KAMERAD Inferno 800 Down Sleeping Bag (-5°C)', 'sleeping', 25000, 10000, NULL, false, NULL, ARRAY['800 Fill Down', '-5°C Comfort Rating'], 'assets/hero_banner.jpg', 'Plush sub-zero down mummy sleeping bag.', 20, '980 g'),
('kmrd-s2', 'KAMERAD ThermoCell Insulated Air Pad', 'sleeping', 15000, 5000, NULL, false, NULL, ARRAY['R-Value 4.8', 'Quick Pump Sack'], 'assets/tent_4season.jpg', 'High insulation inflatable sleeping mat.', 25, '520 g'),
('kmrd-c1', 'KAMERAD JetBoil Rapid Cooking System', 'stoves', 15000, 5000, NULL, false, NULL, ARRAY['Boils 1L in 100s', 'Piezo Igniter'], 'assets/tent_4season.jpg', 'Ultra efficient windproof stove burner.', 18, '430 g'),
('kmrd-l1', 'KAMERAD Beacon 900 Lumens Headlamp', 'lighting', 10000, 5000, NULL, false, NULL, ARRAY['900 Lumens', 'Rechargeable USB-C', 'IPX8 Waterproof'], 'assets/hero_banner.jpg', 'Long-range headlamp with wide flood beam.', 30, '110 g');
