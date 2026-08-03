-- General trip manager permissions and NFC administration.

alter table public.nfc_links enable row level security;

drop policy if exists nfc_links_admin_all on public.nfc_links;
create policy nfc_links_admin_all on public.nfc_links
for all to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

grant select, insert, update, delete on public.nfc_links to authenticated;
grant execute on function public.is_admin_user() to authenticated;

create unique index if not exists nfc_links_one_active_per_trip_idx
  on public.nfc_links (trip_id)
  where is_active = true;
