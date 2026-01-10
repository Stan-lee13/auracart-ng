-- Enable the pg_net extension to make HTTP requests
create extension if not exists pg_net;

-- Create the trigger function
create or replace function public.handle_product_changes()
returns trigger as $$
begin
  perform net.http_post(
    url := 'https://ctjattuedycmgewumqeh.supabase.co/functions/v1/shopify-sync',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := jsonb_build_object(
      'type', TG_OP,
      'record', NEW,
      'old_record', OLD
    )
  );
  return null;
end;
$$ language plpgsql security definer;

-- Create the trigger
drop trigger if exists on_product_change on public.products;
create trigger on_product_change
  after insert or update or delete on public.products
  for each row execute procedure public.handle_product_changes();
