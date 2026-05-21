-- Seed market_prices
INSERT INTO market_prices (crop_name, price_per_kg, market_location, recorded_date) VALUES
  ('Mahindi', 650, 'Dar es Salaam', CURRENT_DATE),
  ('Mahindi', 600, 'Dodoma', CURRENT_DATE),
  ('Mahindi', 580, 'Mbeya', CURRENT_DATE),
  ('Mahindi', 620, 'Arusha', CURRENT_DATE),
  ('Mchele', 1800, 'Dar es Salaam', CURRENT_DATE),
  ('Mchele', 1650, 'Dodoma', CURRENT_DATE),
  ('Mchele', 1700, 'Arusha', CURRENT_DATE),
  ('Mchele', 1600, 'Mbeya', CURRENT_DATE),
  ('Nyanya', 800, 'Dar es Salaam', CURRENT_DATE),
  ('Nyanya', 650, 'Dodoma', CURRENT_DATE),
  ('Nyanya', 750, 'Arusha', CURRENT_DATE),
  ('Nyanya', 600, 'Mbeya', CURRENT_DATE),
  ('Maharage', 1400, 'Dar es Salaam', CURRENT_DATE),
  ('Maharage', 1300, 'Dodoma', CURRENT_DATE),
  ('Maharage', 1350, 'Arusha', CURRENT_DATE),
  ('Maharage', 1250, 'Mbeya', CURRENT_DATE),
  ('Vitunguu', 500, 'Dar es Salaam', CURRENT_DATE),
  ('Vitunguu', 450, 'Dodoma', CURRENT_DATE),
  ('Vitunguu', 480, 'Arusha', CURRENT_DATE),
  ('Vitunguu', 420, 'Mbeya', CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- Seed educational_content
INSERT INTO educational_content (title, description, video_url, category, crop_name, language) VALUES
  (
    'Jinsi ya Kupanda Mahindi Tanzania',
    'Mwongozo kamili wa kupanda mahindi kwa wakulima wadogo — kuandaa shamba, kupanda, na kutunza.',
    'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    'kupanda', 'Mahindi', 'Kiswahili'
  ),
  (
    'Umwagiliaji Bora kwa Mboga',
    'Njia rahisi za kumwagilia mboga kwa matumizi ya maji kidogo lakini mavuno makubwa.',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'umwagiliaji', 'Mboga', 'Kiswahili'
  ),
  (
    'Magonjwa ya Nyanya na Jinsi ya Kuyatibu',
    'Tambua magonjwa ya nyanya mapema na uchague dawa sahihi za asili na za duka.',
    'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    'magonjwa', 'Nyanya', 'Kiswahili'
  ),
  (
    'Kulinda Mazao dhidi ya Wadudu',
    'Mbinu za asili na za kisayansi za kupigana na viwavi, nzi, na wadudu wengine.',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'magonjwa', 'Mazao Mengi', 'Kiswahili'
  ),
  (
    'Mbolea Bora kwa Udongo wa Tanzania',
    'Aina za mbolea, wakati wa kutumia, na kiasi kinachofaa kwa udongo wa Tanzania.',
    'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    'kupanda', 'Mazao Mengi', 'Kiswahili'
  )
ON CONFLICT DO NOTHING;
