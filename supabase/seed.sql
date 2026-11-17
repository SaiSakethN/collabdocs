-- Optional standalone seed; schema.sql also seeds these identities.
insert into public.demo_users (id, name, email) values
  ('alice', 'Alice', 'alice@collabdocs.demo'),
  ('bob', 'Bob', 'bob@collabdocs.demo')
on conflict (id) do nothing;
