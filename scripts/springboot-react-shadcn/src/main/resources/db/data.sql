-- ScorietTemplate sample data (loaded once by the setup wizard)

INSERT INTO postal_codes (pc_country_code, pc_postal_code, pc_city, pc_state) VALUES
  ('AT', '1010', 'Vienna',      'Vienna'),
  ('AT', '1220', 'Vienna',      'Vienna'),
  ('AT', '3100', 'St. Poelten', 'Lower Austria'),
  ('AT', '4020', 'Linz',        'Upper Austria'),
  ('AT', '5020', 'Salzburg',    'Salzburg'),
  ('AT', '8010', 'Graz',        'Styria'),
  ('DE', '10115', 'Berlin',     'Berlin'),
  ('DE', '80331', 'Munich',     'Bavaria'),
  ('DE', '20095', 'Hamburg',    'Hamburg'),
  ('CH', '8001',  'Zurich',     'Zurich');

INSERT INTO companies (comp_name, comp_vat_number, comp_website, comp_phone, comp_industry) VALUES
  ('Alpine Software GmbH',   'ATU12345678', 'https://alpine-software.example', '+43 1 2345678',  'Software'),
  ('Donau Logistik AG',      'ATU87654321', 'https://donau-logistik.example',  '+43 732 998877', 'Logistics'),
  ('Berliner Medien GmbH',   'DE123456789', 'https://berliner-medien.example', '+49 30 445566',  'Media'),
  ('Helvetia Consulting AG', 'CHE-123.456.789', 'https://helvetia-consulting.example', '+41 44 1122334', 'Consulting');

INSERT INTO customers
  (cust_nr, cust_first_name, cust_last_name, cust_email, cust_phone,
   cust_street, cust_house_number, cust_postal_code_id, cust_company_id, cust_status, cust_notes) VALUES
  ('C-1001', 'Anna',     'Huber',    'anna.huber@example.com',    '+43 664 1111111', 'Stephansplatz',    '4',   1, 1, 'ACTIVE',   'Key account since 2022.'),
  ('C-1002', 'Bernhard', 'Maier',    'b.maier@example.com',       '+43 664 2222222', 'Donaustadtstrasse','12/3', 2, 2, 'ACTIVE',   NULL),
  ('C-1003', 'Claudia',  'Berger',   'claudia.berger@example.com','+43 676 3333333', 'Rathausplatz',     '1',   3, NULL, 'PROSPECT', 'Met at trade fair.'),
  ('C-1004', 'David',    'Wagner',   'd.wagner@example.com',      '+43 699 4444444', 'Landstrasse',      '45',  4, 2, 'ACTIVE',   NULL),
  ('C-1005', 'Eva',      'Pichler',  'eva.pichler@example.com',   '+43 662 5555555', 'Getreidegasse',    '9',   5, NULL, 'LEAD',     NULL),
  ('C-1006', 'Franz',    'Steiner',  'franz.steiner@example.com', '+43 316 6666666', 'Herrengasse',      '16',  6, 1, 'INACTIVE', 'Contract paused.'),
  ('C-1007', 'Greta',    'Schmidt',  'greta.schmidt@example.com', '+49 30 7777777',  'Invalidenstrasse', '110', 7, 3, 'ACTIVE',   NULL),
  ('C-1008', 'Hans',     'Bauer',    'hans.bauer@example.com',    '+49 89 8888888',  'Marienplatz',      '8',   8, 3, 'ACTIVE',   NULL),
  ('C-1009', 'Ingrid',   'Keller',   'ingrid.keller@example.com', '+41 44 9999999',  'Bahnhofstrasse',   '21',  10, 4, 'ACTIVE',  'Prefers contact by email.'),
  ('C-1010', 'Jakob',    'Lehmann',  'jakob.lehmann@example.com', '+49 40 1010101',  'Moenckebergstrasse','7',  9, NULL, 'ARCHIVED', 'Moved abroad.');
