insert into portfolios (id, name, base_currency, owner_name)
values ('11111111-1111-1111-1111-111111111111', 'Franklin Global Portfolio', 'USD', 'Franklin');

insert into positions (id, portfolio_id, product_type, product_name, currency, notional, issuer, opened_at, maturity_at, notes)
values
('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'fcn', 'FCN Energy', 'SGD', 500000, 'Citi', '2026-03-12', '2026-07-12', 'Energy basket FCN'),
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'fcn', 'FCN Tech', 'USD', 500000, 'Nomura', '2026-03-12', '2026-07-12', 'Tech basket FCN');

insert into structured_products (id, position_id, structure_type, coupon_pa, strike_pct, ko_barrier_pct, observation_freq, tenor_months, memory_coupon, denomination, settlement_currency)
values
('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222221', 'fcn', 8, 85.46, 100, 'monthly', 4, true, 500000, 'SGD'),
('33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222222', 'fcn', 12, 72.05, 92, 'monthly', 4, true, 500000, 'USD');

insert into underlyings (structured_product_id, ticker, name, market)
values
('33333333-3333-3333-3333-333333333331', 'XOM', 'Exxon Mobil Corp', 'NYSE'),
('33333333-3333-3333-3333-333333333331', 'SHEL', 'Shell plc', 'LSE'),
('33333333-3333-3333-3333-333333333331', 'CVX', 'Chevron Corp', 'NYSE'),
('33333333-3333-3333-3333-333333333332', 'SMSN', 'Samsung Electronics', 'KRX'),
('33333333-3333-3333-3333-333333333332', 'TSM', 'Taiwan Semiconductor Manufacturing', 'NYSE'),
('33333333-3333-3333-3333-333333333332', 'NVDA', 'NVIDIA Corp', 'NASDAQ');

insert into transactions (portfolio_id, position_id, txn_type, amount, currency, fee, fx_rate, occurred_at, notes)
values
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'buy', 500000, 'SGD', 0, 1, '2026-03-12T10:00:00+08:00', 'Initial FCN Energy booking'),
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'buy', 500000, 'USD', 0, 1, '2026-03-12T10:00:00+08:00', 'Initial FCN Tech booking'),
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'coupon', 20000, 'USD', 0, 1, '2026-04-12T10:00:00+08:00', 'Nomura FCN monthly coupon');
