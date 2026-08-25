-- ============================================================================
-- TalkWithIcons — reporting queries against the calls table.
-- Paste any of these into the Neon SQL editor, or wire into the admin dashboard.
-- ============================================================================

-- 1) PER-ICON BREAKDOWN (the headline report)
--    total calls, avg + total minutes, paid conversions, conversion rate, revenue
SELECT
  character_name,
  COUNT(*)                                             AS calls,
  ROUND(AVG(duration_minutes), 2)                      AS avg_minutes,
  ROUND(SUM(duration_minutes), 1)                      AS total_minutes,
  SUM(CASE WHEN converted THEN 1 ELSE 0 END)           AS paid_calls,
  ROUND(100.0 * SUM(CASE WHEN converted THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0), 1)
                                                       AS conversion_pct,
  ROUND(SUM(CASE WHEN converted THEN revenue_cents  ELSE 0 END) / 100.0, 2) AS revenue_usd,
  ROUND(SUM(CASE WHEN converted THEN donation_cents ELSE 0 END) / 100.0, 2) AS donation_usd
FROM calls
WHERE call_type = 'standard'
GROUP BY character_name
ORDER BY revenue_usd DESC NULLS LAST;

-- 2) PER-ICON, LAST 30 DAYS ONLY (use for campaign attribution windows)
SELECT
  character_name,
  COUNT(*)                                             AS calls_30d,
  ROUND(AVG(duration_minutes), 2)                      AS avg_minutes,
  SUM(CASE WHEN converted THEN 1 ELSE 0 END)           AS paid_calls_30d
FROM calls
WHERE ended_at >= now() - interval '30 days'
GROUP BY character_name
ORDER BY calls_30d DESC;

-- 3) DAILY TOTALS (overall trend line for the dashboard)
SELECT
  date_trunc('day', ended_at)::date                    AS day,
  COUNT(*)                                             AS calls,
  SUM(CASE WHEN converted THEN 1 ELSE 0 END)           AS paid_calls,
  ROUND(SUM(revenue_cents) / 100.0, 2)                 AS revenue_usd
FROM calls
GROUP BY day
ORDER BY day DESC
LIMIT 60;

-- 4) CALL-LENGTH DISTRIBUTION per icon (are people hanging up before the gate?)
SELECT
  character_name,
  SUM(CASE WHEN duration_minutes <  2 THEN 1 ELSE 0 END) AS under_2min,
  SUM(CASE WHEN duration_minutes >= 2 AND duration_minutes < 6 THEN 1 ELSE 0 END) AS two_to_six,
  SUM(CASE WHEN duration_minutes >= 6 THEN 1 ELSE 0 END) AS six_plus
FROM calls
GROUP BY character_name
ORDER BY six_plus DESC;

-- 5) GRAND TOTAL (single-row summary for the top of the dashboard)
SELECT
  COUNT(*)                                             AS total_calls,
  COUNT(DISTINCT character_name)                       AS characters_called,
  ROUND(SUM(duration_minutes), 1)                      AS total_minutes,
  SUM(CASE WHEN converted THEN 1 ELSE 0 END)           AS total_paid_calls,
  ROUND(SUM(revenue_cents)  / 100.0, 2)                AS total_revenue_usd,
  ROUND(SUM(donation_cents) / 100.0, 2)                AS total_donation_usd
FROM calls;

-- 6) INTEGRITY CHECK: money recorded but converted=false. Should return zero rows. Nonzero = write-path bug.
SELECT id, character_name, ended_at, converted, revenue_cents, donation_cents
FROM calls
WHERE converted = false AND (revenue_cents <> 0 OR donation_cents <> 0)
ORDER BY ended_at DESC;
