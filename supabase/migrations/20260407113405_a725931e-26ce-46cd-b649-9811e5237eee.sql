
-- Create category enum
CREATE TYPE public.task_category AS ENUM ('personal', 'printers', 'rv_park');

-- Add new columns
ALTER TABLE public.tasks
  ADD COLUMN category public.task_category NOT NULL DEFAULT 'personal',
  ADD COLUMN start_hour time WITHOUT TIME ZONE,
  ADD COLUMN estimated_minutes integer;
