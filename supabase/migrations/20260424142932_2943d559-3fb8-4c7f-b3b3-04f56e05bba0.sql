
CREATE OR REPLACE FUNCTION public.set_invoice_no()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.invoice_no IS NULL OR NEW.invoice_no = '' THEN
    NEW.invoice_no := 'MC-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.bill_invoice_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;
