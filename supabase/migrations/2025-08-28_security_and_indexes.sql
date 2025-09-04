-- === Partner scoping helper (idempotent) ===
create or replace function public.current_partner_id()
returns uuid
language sql
stable
as $$
select coalesce(
  nullif(current_setting('app.current_partner_id', true), '')::uuid,
  nullif(auth.jwt() ->> 'partner_id', '')::uuid
) $$;

-- === Enable RLS on sensitive tables (enabling twice is fine) ===
alter table public.individual_profiles  enable row level security;
alter table public.company_profiles     enable row level security;
alter table public.identifications      enable row level security;
alter table public.financial_accounts   enable row level security;
alter table public.transactions         enable row level security;
alter table public.partners             enable row level security;
alter table public.assessments          enable row level security;  -- already on in your env, safe anyway
alter table public.entities             enable row level security;   -- already on in your env, safe anyway

-- === Individual profiles: owner + partner visibility ===
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='individual_profiles'
      and policyname='indv_select_owner'
  ) then
    create policy indv_select_owner
    on public.individual_profiles for select to authenticated
    using (entity_id in (select id from public.entities where created_by = auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='individual_profiles'
      and policyname='indv_select_partner'
  ) then
    create policy indv_select_partner
    on public.individual_profiles for select to authenticated
    using (
      entity_id in (
        select a.entity_id
        from public.assessments a
        where a.partner_id = public.current_partner_id()
      )
    );
  end if;
end $$;

-- === Company profiles: owner + partner visibility ===
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='company_profiles'
      and policyname='company_select_owner'
  ) then
    create policy company_select_owner
    on public.company_profiles for select to authenticated
    using (entity_id in (select id from public.entities where created_by = auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='company_profiles'
      and policyname='company_select_partner'
  ) then
    create policy company_select_partner
    on public.company_profiles for select to authenticated
    using (
      entity_id in (
        select a.entity_id
        from public.assessments a
        where a.partner_id = public.current_partner_id()
      )
    );
  end if;
end $$;

-- === Identifications (PII): owner + partner visibility ===
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='identifications'
      and policyname='ids_select_owner'
  ) then
    create policy ids_select_owner
    on public.identifications for select to authenticated
    using (entity_id in (select id from public.entities where created_by = auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='identifications'
      and policyname='ids_select_partner'
  ) then
    create policy ids_select_partner
    on public.identifications for select to authenticated
    using (
      entity_id in (
        select a.entity_id
        from public.assessments a
        where a.partner_id = public.current_partner_id()
      )
    );
  end if;
end $$;

-- === Financial accounts: owner + partner visibility ===
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='financial_accounts'
      and policyname='accounts_select_owner'
  ) then
    create policy accounts_select_owner
    on public.financial_accounts for select to authenticated
    using (entity_id in (select id from public.entities where created_by = auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='financial_accounts'
      and policyname='accounts_select_partner'
  ) then
    create policy accounts_select_partner
    on public.financial_accounts for select to authenticated
    using (
      entity_id in (
        select a.entity_id
        from public.assessments a
        where a.partner_id = public.current_partner_id()
      )
    );
  end if;
end $$;

-- === Transactions: owner + partner visibility ===
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='transactions'
      and policyname='tx_select_owner'
  ) then
    create policy tx_select_owner
    on public.transactions for select to authenticated
    using (entity_id in (select id from public.entities where created_by = auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='transactions'
      and policyname='tx_select_partner'
  ) then
    create policy tx_select_partner
    on public.transactions for select to authenticated
    using (
      entity_id in (
        select a.entity_id
        from public.assessments a
        where a.partner_id = public.current_partner_id()
      )
    );
  end if;
end $$;

-- === Partners: self visibility only ===
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='partners'
      and policyname='partner_self_select'
  ) then
    create policy partner_self_select
    on public.partners for select to authenticated
    using (id = public.current_partner_id());
  end if;
end $$;

-- === Update legacy policies to use helper (no hard dependency on GUC) ===
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='assessments'
      and policyname='Partners can create assessments'
  ) then
    alter policy "Partners can create assessments"
      on public.assessments
      with check (partner_id = public.current_partner_id());
  else
    create policy "Partners can create assessments"
      on public.assessments for insert to public
      with check (partner_id = public.current_partner_id());
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='assessments'
      and policyname='Partners can view their own assessments'
  ) then
    alter policy "Partners can view their own assessments"
      on public.assessments
      using (partner_id = public.current_partner_id());
  else
    create policy "Partners can view their own assessments"
      on public.assessments for select to public
      using (partner_id = public.current_partner_id());
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='entities'
      and policyname='Partners can view assessed entities'
  ) then
    alter policy "Partners can view assessed entities"
      on public.entities
      using (
        exists (
          select 1
          from public.assessments a
          where a.entity_id = entities.id
            and a.partner_id = public.current_partner_id()
        )
      );
  else
    create policy "Partners can view assessed entities"
      on public.entities for select to public
      using (
        exists (
          select 1
          from public.assessments a
          where a.entity_id = entities.id
            and a.partner_id = public.current_partner_id()
        )
      );
  end if;
end $$;

-- === Supporting FK child indexes (idempotent) ===
CREATE INDEX IF NOT EXISTS idx_assessments_decision_by   ON public.assessments(decision_by);
CREATE INDEX IF NOT EXISTS idx_blacklist_added_by        ON public.blacklist(added_by);
CREATE INDEX IF NOT EXISTS idx_blacklist_reviewed_by     ON public.blacklist(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_entities_created_by       ON public.entities(created_by);
CREATE INDEX IF NOT EXISTS idx_fraud_investigated_by     ON public.fraud_indicators(investigated_by);
CREATE INDEX IF NOT EXISTS idx_identifications_verified  ON public.identifications(verified_by);
CREATE INDEX IF NOT EXISTS idx_lending_decisions_assess  ON public.lending_decisions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_ml_models_created_by      ON public.ml_models(created_by);
CREATE INDEX IF NOT EXISTS idx_notifications_template_id ON public.notifications(template_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id   ON public.transactions(account_id);

chore(db): add partner-scoped RLS + FK child indexes