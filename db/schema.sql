CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE regions (
  region_id text PRIMARY KEY,
  name text NOT NULL UNIQUE
);

CREATE TABLE categories (
  category_id text PRIMARY KEY,
  name text NOT NULL UNIQUE
);

CREATE TABLE firms (
  firm_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  region_id text NOT NULL REFERENCES regions
);

CREATE TABLE routing_rules (
  region_id text REFERENCES regions,
  category_id text REFERENCES categories,
  firm_id integer NOT NULL REFERENCES firms,
  PRIMARY KEY (region_id, category_id)
);

CREATE TABLE users (
  user_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('plaintiff', 'attorney', 'paralegal', 'admin')),
  firm_id integer REFERENCES firms,
  fname text NOT NULL,
  lname text NOT NULL,
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  CHECK ((firm_id IS NOT NULL) = (role IN ('attorney', 'paralegal')))
);

CREATE TABLE leads (
  lead_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  plaintiff_id integer NOT NULL REFERENCES users,
  firm_id integer REFERENCES firms,
  region_id text NOT NULL REFERENCES regions,
  category_id text NOT NULL REFERENCES categories,
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  progress text CHECK (progress IN ('intake', 'investigation', 'negotiation', 'litigation', 'closed')),
  is_case boolean GENERATED ALWAYS AS (progress IS NOT NULL) STORED,
  time_submit timestamptz NOT NULL DEFAULT now(),
  CHECK (status = 'pending' OR (firm_id IS NOT NULL AND progress IS NOT NULL))
);

CREATE TABLE documents (
  document_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lead_id integer NOT NULL REFERENCES leads,
  uploaded_by integer NOT NULL REFERENCES users,
  file_name text NOT NULL,
  storage_key text NOT NULL UNIQUE,
  size_bytes integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notes (
  note_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lead_id integer NOT NULL REFERENCES leads,
  firm_id integer NOT NULL REFERENCES firms,
  author_id integer NOT NULL REFERENCES users,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE history (
  history_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lead_id integer NOT NULL REFERENCES leads,
  actor_id integer REFERENCES users,
  field text NOT NULL CHECK (field IN ('firm', 'status', 'progress')),
  old_value text,
  new_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON leads (firm_id, status, time_submit);
CREATE INDEX ON leads (plaintiff_id);
CREATE INDEX ON leads (time_submit, lead_id);
CREATE INDEX ON leads USING gin (title gin_trgm_ops);
CREATE INDEX ON users USING gin ((fname || ' ' || lname) gin_trgm_ops);
CREATE INDEX ON documents (lead_id);
CREATE INDEX ON notes (lead_id, firm_id);
CREATE INDEX ON history (lead_id, created_at);
