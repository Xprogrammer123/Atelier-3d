-- Scan-to-mesh pipeline: job type tracks how 3D is produced

create type job_type as enum ('photos', 'upload', 'scan');

alter table public.processing_jobs
  add column if not exists job_type job_type not null default 'photos';

create index if not exists jobs_job_type_status_idx
  on public.processing_jobs (job_type, status);
