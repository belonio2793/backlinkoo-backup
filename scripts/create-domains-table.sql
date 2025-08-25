-- domains table schema
-- This table stores all domains for the automation link building system

create table if not exists domains (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,            -- domain name (ex: example.com)
  site_id text,                         -- Netlify site ID (links to your site)
  source text default 'manual',         -- 'manual' or 'netlify'
  status text default 'active',         -- 'active', 'pending', 'verified', 'unverified', 'error'
  created_at timestamptz default now(), -- when added
  updated_at timestamptz default now()  -- when last updated
);

-- Create index for faster lookups
create index if not exists idx_domains_name on domains(name);
create index if not exists idx_domains_source on domains(source);
create index if not exists idx_domains_status on domains(status);

-- Keep updated_at fresh with trigger
create or replace function update_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Drop existing trigger if it exists
drop trigger if exists update_domains_updated_at on domains;

-- Create trigger for updated_at
create trigger update_domains_updated_at
  before update on domains
  for each row
  execute procedure update_timestamp();

-- Insert some example data (optional)
-- insert into domains (name, site_id, source, status) values 
--   ('example.com', 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809', 'manual', 'active'),
--   ('leadpages.org', 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809', 'netlify', 'verified')
-- on conflict (name) do nothing;

-- Grant permissions (adjust as needed)
grant select, insert, update, delete on domains to authenticated;
grant select, insert, update, delete on domains to anon;
