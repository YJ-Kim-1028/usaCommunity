-- 0002_add_entertainment_topic.sql
-- "연예" 토픽 추가 (0001에서 만든 topics 테이블에 데이터만 추가)

insert into public.topics (slug, name, sort_order) values
  ('entertainment', '연예', 4)
on conflict (slug) do nothing;
