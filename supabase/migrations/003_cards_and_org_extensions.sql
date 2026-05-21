-- Card and org extensions for MVP

alter table cards add column if not exists job_type text
  check (job_type is null or job_type in (
    'maintenance', 'install', 'hardscape', 'cleanup', 'irrigation', 'other'
  ));

alter table cards add column if not exists checklist_json jsonb not null default '[]';

alter table organizations add column if not exists settings jsonb not null default '{}'::jsonb;

comment on column organizations.settings is 'Org flags e.g. pipelineMode: compact|full, features';
