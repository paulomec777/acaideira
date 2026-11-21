-- Dois papéis: 'loja' (dia a dia) e 'agencia' (marketing e configurações).
update public.equipe set papel = 'loja' where papel is distinct from 'agencia';
alter table public.equipe drop constraint if exists equipe_papel_check;
alter table public.equipe alter column papel set default 'loja';
alter table public.equipe add constraint equipe_papel_valido check (papel in ('loja','agencia'));

create or replace function privado.is_agencia()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.equipe where user_id = auth.uid() and papel = 'agencia');
$$;
revoke all on function privado.is_agencia() from public;
grant execute on function privado.is_agencia() to authenticated;

-- Configurações da loja: a loja só pode abrir/fechar; o resto é da agência.
create or replace function privado.protege_config()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is null or privado.is_agencia() then return new; end if;
  if (new.horario, new.pedido_minimo, new.tempo_entrega, new.tempo_retirada, new.whatsapp, new.pix_nome, new.pix_cidade)
     is distinct from (old.horario, old.pedido_minimo, old.tempo_entrega, old.tempo_retirada, old.whatsapp, old.pix_nome, old.pix_cidade) then
    raise exception 'Somente a agência pode alterar essas configurações.' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists protege_config on public.loja_config;
create trigger protege_config before update on public.loja_config for each row execute function privado.protege_config();

-- Bairros e taxas: só a agência altera.
drop policy if exists bairros_equipe on public.bairros;
create policy bairros_agencia on public.bairros for all to authenticated using (privado.is_agencia()) with check (privado.is_agencia());

-- Destaques (stories do site), mantidos pela agência.
create table public.destaques (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(titulo) between 1 and 60),
  texto text check (char_length(texto) <= 160),
  midia_url text not null,
  tipo text not null check (tipo in ('foto','video')),
  botao_texto text check (char_length(botao_texto) <= 30),
  botao_link text check (char_length(botao_link) <= 300),
  ordem int not null default 0,
  ativo boolean not null default true,
  inicio date,
  fim date,
  criado_em timestamptz not null default now()
);
alter table public.destaques enable row level security;
create policy destaques_publicos on public.destaques for select to anon, authenticated
  using (ativo and (inicio is null or inicio <= current_date) and (fim is null or fim >= current_date));
create policy destaques_agencia on public.destaques for all to authenticated using (privado.is_agencia()) with check (privado.is_agencia());
create index destaques_ordem_idx on public.destaques (ordem);

-- Arquivos de fotos e vídeos: leitura pública pelo link, envio só pela agência.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('midia', 'midia', true, 52428800, array['image/jpeg','image/png','image/webp','video/mp4'])
on conflict (id) do nothing;
create policy midia_agencia_envia on storage.objects for insert to authenticated with check (bucket_id = 'midia' and privado.is_agencia());
create policy midia_agencia_altera on storage.objects for update to authenticated using (bucket_id = 'midia' and privado.is_agencia());
create policy midia_agencia_apaga on storage.objects for delete to authenticated using (bucket_id = 'midia' and privado.is_agencia());
