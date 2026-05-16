-- Seed the background catalog. Preview assets live in /public/backgrounds.

insert into public.backgrounds (name, category, is_free, preview_url) values
  ('Crema clásica',        'classic',   true,  '/backgrounds/classic-cream.svg'),
  ('Rosa nupcial',         'wedding',   true,  '/backgrounds/wedding-rose.svg'),
  ('Confeti',              'party',     true,  '/backgrounds/party-confetti.svg'),
  ('Pastel infantil',      'kids',      true,  '/backgrounds/kids-pastel.svg'),
  ('Pizarra corporativa',  'corporate', true,  '/backgrounds/corporate-slate.svg'),
  ('Oro nupcial',          'wedding',   false, '/backgrounds/wedding-gold.svg'),
  ('Neón de fiesta',       'party',     false, '/backgrounds/party-neon.svg'),
  ('Vintage',              'classic',   false, '/backgrounds/classic-vintage.svg');
