-- ============================================================
-- Amazon Returns & Grading Platform - Supabase Database Schema
-- Run this entire script in your Supabase SQL Editor
-- ============================================================

-- -------------------------
-- 1. PROFILES TABLE
-- -------------------------
create table if not exists public.profiles (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  full_name text,
  green_credits integer default 320,
  trees_planted integer default 14,
  causes_helped integer default 8,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- -------------------------
-- 2. RETURNS TABLE
-- -------------------------
create table if not exists public.returns (
  id text primary key,
  customer_id uuid references public.profiles(id) on delete set null,
  customer_name text,
  time_window text,
  address text,
  district text,
  item_name text not null,
  category text not null,
  price numeric(10,2) not null,
  sku text,
  img_url text,
  reason text,
  comments text,
  status text default 'Pending',
  user_grade text,
  user_confidence text,
  defects jsonb default '[]'::jsonb,
  agent_grade text default '',
  agent_defects text default '',
  disagreement_count integer default 0,
  downgrade_rate text,
  routing text,
  risk_tier text,
  trend_30d text,
  flag_reason text,
  ai_request_id text,
  ai_status text,
  ai_notes_contradict boolean default false,
  ai_requires_human_review boolean default false,
  condition_answers jsonb default '{}'::jsonb,
  subcategory text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- -------------------------
-- 3. P2P PRODUCTS TABLE
-- -------------------------
create table if not exists public.p2p_products (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  price numeric(10,2) not null,
  original_price numeric(10,2),
  category text not null,
  location text,
  seller_id uuid references public.profiles(id) on delete set null,
  seller_name text not null,
  seller_img text,
  seller_member_since text,
  seller_items_count integer default 0,
  verified boolean default false,
  condition text not null,
  rating numeric(2,1) default 5.0,
  reviews_count integer default 0,
  description text,
  image text,
  thumbnails jsonb default '[]'::jsonb,
  time_ago text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- -------------------------
-- 4. P2P CHATS TABLE
-- -------------------------
create table if not exists public.p2p_chats (
  id uuid default gen_random_uuid() primary key,
  category text default 'buying',
  item_title text not null,
  item_price numeric(10,2) not null,
  item_image text,
  sender_name text,
  sender_img text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- -------------------------
-- 5. P2P MESSAGES TABLE
-- -------------------------
create table if not exists public.p2p_messages (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid references public.p2p_chats(id) on delete cascade not null,
  sender_name text not null,
  text text not null,
  is_me boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- -------------------------
-- 6. NGO CAMPAIGNS TABLE
-- -------------------------
create table if not exists public.ngo_campaigns (
  id text primary key,
  title text not null,
  ngo_name text not null,
  ngo_logo text,
  description text,
  image text,
  urgency text default 'standard',
  category text not null,
  progress integer default 0,
  received numeric(10,2) default 0,
  target numeric(10,2) not null,
  unit text not null,
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- -------------------------
-- 7. DONATION HISTORY TABLE
-- -------------------------
create table if not exists public.donation_history (
  id text primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  date text not null,
  ngo text not null,
  logo text,
  action text not null,
  credits integer not null,
  is_me boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- -------------------------
-- 8. LEADERBOARD TABLE
-- -------------------------
create table if not exists public.leaderboard (
  rank integer primary key,
  name text not null,
  verified_count integer default 0,
  accuracy text not null,
  avg_speed text not null,
  score integer default 0
);

-- ============================================================
-- SEED DATA - Insert initial mock data
-- ============================================================

-- Default user profile
insert into public.profiles (id, email, full_name, green_credits, trees_planted, causes_helped)
values ('00000000-0000-0000-0000-000000000001', 'user99218@amazon.com', 'USER_99218', 320, 14, 8)
on conflict (id) do nothing;

-- Leaderboard
insert into public.leaderboard (rank, name, verified_count, accuracy, avg_speed, score) values
(1, 'David Chen', 342, '99.4%', '1m 24s', 980),
(2, 'Sarah Jenkins', 318, '98.8%', '1m 35s', 955),
(3, 'Maria Rodriguez', 295, '98.2%', '1m 42s', 920),
(4, 'James Wilson', 288, '97.9%', '1m 38s', 905),
(5, 'Emily Taylor', 274, '97.5%', '1m 50s', 880)
on conflict (rank) do nothing;

-- Returns
insert into public.returns (id, customer_name, time_window, address, district, item_name, category, price, sku, img_url, reason, comments, status, user_grade, user_confidence, defects, agent_grade, agent_defects, disagreement_count, downgrade_rate, routing, risk_tier, trend_30d, flag_reason) values
('ITEM-88291-ZX', 'USER_99218', '2:00 PM - 4:00 PM', '1248 North Industrial Blvd, Suite 402', 'Downtown Logistics Center', 'Sony Alpha a7 IV Mirrorless Camera', 'ELECTRONICS', 1249.00, '884120394-B09JZT6YSS', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsTYRDNWcz7hABHcTI73TqyLm7IBQnVg7zSoyKvuqauJU36bZkGye0iWQMljQLgrdpylt_-SD008l6_RSIp0hbXD7gPUtM-S0Mr2xMqgTfB_p0WNpl4Eo3hLW7ExRYdkknwdqifjJcIqKqLsSORlrHiiIqO96YHuOGU3SfwkQHec1-y1CObWPVhZkoNY9725LYxlQyHhEW9Pd4WsRe7CB3Mo9OjUjPtc8ONgz1QO2RpgVncdWm7Pg-cvKETx4w_THA-QNiJfqH6MPF', 'defective', 'Visual inspection confirms light scratching on the external body.', 'In Progress', 'F-GRADE', '94%', '[{"type":"Surface scratches on body","desc":"Multiple micro-abrasions detected."},{"type":"Missing lens cap","desc":"Primary lens accessory missing."}]', '', '', 14, '12.4%', 'Refurbish', 'Moderate Risk', 'up', 'Stage 1/2 Disagreement'),
('ITEM-22104', 'CUST-****-9003', '4:30 PM - 6:30 PM', '829 S Oakhurst Dr, Apartment 3B', 'Westside Residential District', 'Sony WH-1000XM4 Wireless Headphones', 'ACCESSORIES', 348.00, '109283471-B07C1XXR99', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCh4E7sKkKlwLI8BPTSwbMLmDj5p6mMhi9NCAbkoAu6qtx2oTiuZhpwOIetPjP6iHWc-IvJ8FdpAjPwkLspEU7htZbeu-L0zvSK2STgSZWTiwfWrGN12cWZKLgvc7wQ-mKPLz25g82ylrO0lNwi4eqSHn_WmCrQv4uB3mBx3pwQSt8RXj2lQoLgxQlj7yStQuHj5AWyHH55fd4OT4XCpzv6cVCyaNinDoF05XCZFyAoC9Fk8DK8oKX0yyCiog6ab2-ku97OYeQdZ-ZR', 'wrong_item', 'Received headphones with cosmetic scuffs.', 'Pending', 'C GRADE', '99%', '[]', 'B+ GRADE', 'Verified headphone condition in field.', 6, '4.1%', 'Restock', 'Medium Risk', 'flat', 'Reason Mismatch'),
('ITEM-04491', 'CUST-****-1152', '9:00 AM - 11:00 AM', '4422 E Highland Ave, Unit 12', 'Commerce Park East', 'Apple Watch Series 8 GPS + Cellular', 'APPAREL', 399.00, '440291039-B08YYR33KK', 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9KGWSpK19ckwLldu4wFVfQ0LGEF6V4NYEqj52uQGhBqxbhcG_k-e0MSpEUqDAlUwEToRqwY-IXDGQuEb9ejylP7E9ox0nhp3iSvMYLX0SKnNkNofRC54EfhhtiSEnxVeMv6M_V2nnR61zFX6ZlKAB3WoHdpLcVa8MGaLr1V-JEMZFG8amkoRTn_bfP07jYvut7lZOsKfd2ZlnkD4RZ143Nfss5DayBLTpX_LQPuqjESNXK_aRtuNUfRmzZJeCsi12j2BfgErGE8Xk', 'no_longer_needed', 'Return requested by customer.', 'Pending', 'D GRADE', '98%', '[]', '', '', 1, '0.8%', 'Restock', 'Critical Risk', 'down', 'High-Risk Account'),
('RTN-90214-X', 'CUST-****-7214', '10:00 AM - 12:00 PM', '891 Sunset Blvd, Suite 100', 'West Hollywood', 'iPhone 15 Pro Max', 'ELECTRONICS', 1199.00, 'IPH15PM-B0C8V291FF', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=100&auto=format&fit=crop', 'Defective', 'Phone screen is unresponsive on boot.', 'Pending', 'GRADE A', '99%', '[{"type":"Display Mismatch","desc":"Screen unresponsive"}]', 'GRADE C', 'Verified unresponsive display on site.', 8, '85.2%', 'Manual Review', 'Critical Risk', 'up', 'Stage 1/2 Disagreement'),
('RTN-88120-K', 'CUST-****-3310', '1:00 PM - 3:00 PM', '742 Evergreen Terrace', 'Springfield Log Center', 'Logitech MX Mech', 'ACCESSORIES', 199.00, 'LOGMX-B09LK1Z91S', 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=100&auto=format&fit=crop', 'Changed Mind', 'Keys are too loud for office work.', 'Completed', 'GRADE A', '100%', '[]', 'GRADE A', 'Brand new, sealed condition.', 0, '0.0%', 'Back to Seller', 'Baseline', 'flat', 'Normal Return'),
('RTN-77341-P', 'CUST-****-8821', '3:00 PM - 5:00 PM', '1048 Peachtree St NE', 'Midtown Hub', 'Bose QC45 Black', 'ACCESSORIES', 329.00, 'BOSEQC45-B098FH299S', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&auto=format&fit=crop', 'Performance', 'Bluetooth connection drops frequently.', 'Completed', 'GRADE B', '95%', '[]', 'GRADE B', 'Tested connectivity, working as expected.', 1, '1.2%', 'Renewed Prep', 'Baseline', 'down', 'General Dispute'),
('RTN-66412-M', 'CUST-****-4451', '11:00 AM - 1:00 PM', '221B Baker St', 'London Logistics Depot', 'KitchenAid Mixer', 'ELECTRONICS', 449.00, 'KITCHMIX-B00004SGFW', 'https://images.unsplash.com/photo-1578643463396-0997cb5328c1?w=100&auto=format&fit=crop', 'Damaged Box', 'Mixer is fine but outer packaging is completely torn.', 'Completed', 'GRADE C', '98%', '[{"type":"Packaging Damage","desc":"Torn outer carton"}]', 'GRADE C', 'Confirmed torn outer carton. Mixer undamaged.', 0, '0.0%', 'Donation', 'Baseline', 'flat', 'Packaging Defect')
on conflict (id) do nothing;

-- NGO Campaigns
insert into public.ngo_campaigns (id, title, ngo_name, ngo_logo, description, image, urgency, category, progress, received, target, unit, location) values
('camp-food', 'Emergency Meals for Coastal Displaced Families', 'Global Relief Food Bank', 'https://lh3.googleusercontent.com/aida-public/AB6AXuALL3Mlt1wuaYveBNMH_OKXC7MIZVtGMj6pKPrRBSX21ZjBCK0LxF1glNTQ5j1MdVMuoB4havgXpbtqA7M7QyupeFZS8t1372PCBL5EEStbZzZZtsDaSWesS1JHpCyaNjT1v69d5AsHaAUmnBeBkgXdulzJI9-jRlsGJaSV4TkU-grpxP6ffvynOYAkYzwctqrcheRBuXsLDn1oSeLMfwP83zd-zgcwq_LS-lui2U4rJTJ1Hqn8eb3luJw', 'Providing essential food parcels and nutrition boxes to displaced coastal communities in South India.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtxhwG-BqBNhrwQj46c44uU5m6UzvYlKpM0QNQE_tzz8Z_GVgMtl75EOjhBKf5S0TAhauxJkfJt3V1GF-UMyYyw_vMgfmFnIFIx6WFx8DFJNKbzRqmAVGZ-hqTjeSTJd7T5FQaG7P-UjQv-FuokjohKo9YtFRyDdNNsRjC9ty5_6KtZ8BW0GtBwkWm3sCVLbFfBGI6WbmK8lGUk5R52ilQ3S7igZ1Zu1WJQhXvhIFpDmFg5iFRn5EX2w', 'high', 'Food Security', 64, 32, 50, 'packages', 'Chennai, Tamil Nadu'),
('camp-digital', 'Digital Literacy Kits for Rural Students', 'LearnForward Global', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwfTWCFM9JVbDdxCgRarK_1Q8t-zySJRyyLRLcTdrFVrre5z3bq7ZHaB31j7y1_OLqfIJbgCgU7nzxfrCm_7JNsgf8xWfV6kc5Zhm-qp_xnU-1puAVNVfcqIDOudMjQk6vZPTtIuRYrM46EMY5cWbqvSuABJYmp78evzSOznK-dWplmXgczBuozuUauY7uS5RJmAZQUt5C5jFKfvtdIueLjGG_Xs4lScCHmt5LAXL6TLyKNVOtfToi9g', 'Procuring and distributing educational kits and tablets for rural classrooms lacking basic tech setup.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTuPh9OTxaTgSjHP0yHaw6nkpPWYi0TwSwLSWPVgX6TEHe-1ZRUf-U0SmKFesPz6ZLs1cV96I_tVIU4AGOZJXGC5NVzuuF9BMGh0V8fE429iD9BiU6pUSfu5cfMmxH7SjLTw3LGs8kgvhjpnQySktSM-iYqwunungzTq_tzY2yEELjS52OOwb5NWaaO00f78Cef3REldGtHlRA1HaJjuOFJO5LsH6G489-Pf-Vg-Rsu2elSien7a59EA', 'standard', 'Education', 24, 12, 50, 'kits', 'Pune, Maharashtra'),
('camp-housing', 'Safe Housing Units for Single Mothers', 'ShelterSolutions Int.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUeN1KM2YnkW4urp-tKH2cptNA_itZFbV9-iYXV7C3FCPJnK9pQqYzZeIC3vi6CzFePslKslMvxadNYwPiQVu2BaGBHu2NF0cWoGmQMWJPtlS7agKw0fSKT5M_wqkzm0ANyNdK4KmoGczsPN1FR5u3LAXVEBpV9jCDGybG-bteQShHeb696lPqZHPZts7R0iYnCFTDGW7LCybcjywZNOKVkBR9ibQNGbAh4m9iTd1gckSON1vC81R96A', 'Building transitional eco-friendly shelter units with clean amenities for low-income single mothers.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuB68YDjh71LZnm3SDdlfG478aqGt-s2izF1ucw5M1WiT1_l3pVaqTcRMBl5zkuBOib_aeZ5VTxbuh6p8SZLEk6EasEWbGA-V1XkGvbyZcvadW5K94pFStQuBzZ_-SPKTQxPC4wR8FDdSc-gKMNeEYMviU4hA5oNV1U-Bj39bC_DTDiZttUVfOG8D1rd9B0pSyllu2elRLqdZMNg8MOFV_YlRw5ysN_bTfJJYI26t2fYFHi9YKrAsm3aBg', 'standard', 'Emergency Shelter', 90, 45, 50, 'funded', 'Bengaluru, Karnataka'),
('camp-water', 'Clean Water Initiative: Solar Pumps', 'GreenEarth Alliance', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdBKOC5aGKXtP3QmmGYlZpUjq9T2MG1zN8WtjPPnTfgutZV_4uXWOq74g-nnrwSdOcXJfr5OzVmbt9EhRAHYCdo2jKGZBXonAdQM3QnJsSXhHeY7AeMWS59YFGlw4NdceAwvmkqtungcqlwV9IXmXt81EyBs1nWL6LI1k-lfFb2L7Jz0aIMiVjujT5aGyP95MXpPGUQ9wgVw-NtkMUJ3m0alWfgQfMNBwQ5ARFdte6DJbae3c-0T-X7A', 'Providing sustainable water access through solar-powered pumps for drought-affected areas.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-s9i63pIhk7HllMd6iOdnldZHEy_yQTFKglJ6bO6MMjcqyJkS1ytJ8TvBGsDueUuy6G44dYZCwK5KWU2Mu0WRHQWlcLVg1x-ypa9CSEKISDbpx_6pC7Gme12qY_Yzm9AuAUPmB8CI5QV58FtnH6z3NV04Pz1Z6b670vJF62hVXg1KnOQ-vbCQKUo-D_7H4XVfvHuQ9dv2wRNuLD_lDxtpLLMZ2BnKeW_NQofAIrIk_-gjso-b12XQQ', 'high', 'Sustainability', 75, 15, 20, 'pumps', 'Hyderabad, Telangana'),
('camp-reforest', 'Amazon Basin Reforestation', 'GreenEarth Alliance', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdBKOC5aGKXtP3QmmGYlZpUjq9T2MG1zN8WtjPPnTfgutZV_4uXWOq74g-nnrwSdOcXJfr5OzVmbt9EhRAHYCdo2jKGZBXonAdQM3QnJsSXhHeY7AeMWS59YFGlw4NdceAwvmkqtungcqlwV9IXmXt81EyBs1nWL6LI1k-lfFb2L7Jz0aIMiVjujT5aGyP95MXpPGUQ9wgVw-NtkMUJ3m0alWfgQfMNBwQ5ARFdte6DJbae3c-0T-X7A', 'Restoring rainforest cover through native species planting and community stewardship.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCQkCtwokaRMdYsoLYToIyQtjrzQYelfPYqsBtkXGigmpMtd1KTg-EemDtvTkC3uPRHrVN0vJH488vaPh_hrhXB90xUWv7MyEMPpz8ciOkYjjKU2Nl0qumlWIXsAOdHCuqAJ8Op7U4aUK1lebePPLE5KEOZiqBHtFLRqTkwsyLQBnDx_YSxzdcCeyOaOByMTikjWZpa1CC_iEAZ403u2ntm37u3fTvskDEVF1rveE1yJ1vrU450eD-Pw', 'standard', 'Sustainability', 42, 42, 100, 'acres', 'Nairobi, Kenya'),
('camp-science', 'Secondary Science Lab Equipment', 'Global Literacy Initiative', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwfTWCFM9JVbDdxCgRarK_1Q8t-zySJRyyLRLcTdrFVrre5z3bq7ZHaB31j7y1_OLqfIJbgCgU7nzxfrCm_7JNsgf8xWfV6kc5Zhm-qp_xnU-1puAVNVfcqIDOudMjQk6vZPTtIuRYrM46EMY5cWbqvSuABJYmp78evzSOznK-dWplmXgczBuozuUauY7uS5RJmAZQUt5C5jFKfvtdIueLjGG_Xs4lScCHmt5LAXL6TLyKNVOtfToi9g', 'Procuring and setting up biology and chemistry laboratory kits for higher secondary classrooms.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6qJsw7Is1nszzoHXJNX7JxsX191vYRMzzpv8MllL4rBtJ7_rf27rKcu4bM2pFpXD5-FZKiZ1d3poINO_mTZgb7z80vDL3i7L7BGzb1w3wGGUwS3tuUB9rfeDftRt2R0oOXoKmTl7mAwxbdjUxx7Fifl_6YswZ1y_KjsFvi3PCR8zyd8FfN9IjZJxrwV9-DnUsBpaLTyxtOH6s9ZiwLiC6vlpuVQdM9hqsf9UouWn6E_Ew9_JLhdw6_Q', 'standard', 'Education', 40, 12, 30, 'kits', 'Mumbai, Maharashtra')
on conflict (id) do nothing;

-- Donation History (using default user)
insert into public.donation_history (id, user_id, date, ngo, logo, action, credits, is_me) values
('tx-1', '00000000-0000-0000-0000-000000000001', 'Oct 24, 2026', 'GreenEarth Foundation', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcBOdx-t4JAYW_02uJ4afwhHNlB0av7y8AoRmG0v877q8Fw9z9FoVWNutehuXcggvVu3VMEcN_PEgPpgt2f6EI6_eA1fQv1KYX9FzBwZiWViboLI9ScBeJOhlMdVrky_mbKvBDU7HMAxRjCrer-941KtUWa_yNeDEPGRMk1PziaAM8OG4koBiPaofPafAPRjD25u4FfZyfFIcwRBD1lnwf3JhYKF0pkfa4jgrBENTfqgkufnOVz_Tm5g', 'Direct Donation', 50, true),
('tx-2', '00000000-0000-0000-0000-000000000001', 'Oct 18, 2026', 'WaterCare Int.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgHEZbD7WMhq6QjH1NcSWZjDN3NGKLonCjswAEBXO3Mv5o6IVevR6rcCkgBxK8ltc66uB4Y4pQG4ByyOrmHTRtWYEEHScgoHXk59rEBiNzemCgOuLyydF-YtT-tNzQnMJntjoCxYdNi7HSSPRJMZjMpfR9hdDImrUOdhsz6LqWI8coMjn7sUtxkirOf9pkua8AyhpIKkzNAGWKB2XrNjrWaExETQCKv_Udof6RF_faCUSm0ECpwAw7bw', 'Campaign Support', 25, true),
('tx-3', '00000000-0000-0000-0000-000000000001', 'Oct 12, 2026', 'MarketConnect Store', '', 'Redemption (Listing)', -100, false),
('tx-4', '00000000-0000-0000-0000-000000000001', 'Oct 05, 2026', 'EduReach Global', 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9NljDma2gixaoV0GaJVGccPK5E7xOsmyW1RYAn9qKacLY94xohIYASE3pItA5rwZLkSiK1pth3XO33AP2qJKWdDuO8BUWFOFobAsvispldoXrfmrzbt6ZAGpHP2GSyFWvIxQURb_JwnnoPxhQHzKfoJY7mdbhwPRcv0ky34LAqibR8lR6XFjLHTim8-ejElxhp_xgtFdNhnfTm_ozOENAC6rIkx_eShEYbIzJ2gDJdMMs3Q2Jia_WJQ', 'Monthly Contribution', 100, true),
('tx-5', '00000000-0000-0000-0000-000000000001', 'Sep 28, 2026', 'Paws & Hearts', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDi9AFuaWDtWEoMrBoieQiZVa3gsm0TP86ocMdCqR_g-kJeTEU8otbK-LWptsx6StuItGi3ZxFy0u3WX77VVSurSyHoaf-s30A_Xhn3R5w6pamRYGnvw-voCFCpqbzXFtcmX5psEjbg61egvAWDcP2zdjoCd18BRh3VaeXoGMFlbDwjU_refte0ZoVssIkA7Kx0MGoL5RY0bacy4xqH1k7srccvtJ8aRz1aWy7hh-FVPXRHnHLm8qO2NQ', 'Matching Gift', 200, true)
on conflict (id) do nothing;
