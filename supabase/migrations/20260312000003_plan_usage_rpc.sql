CREATE OR REPLACE FUNCTION increment_plan_usage(p_mosque_id UUID, p_month DATE)
RETURNS void AS $$
  INSERT INTO plan_usage (mosque_id, month, online_donations)
  VALUES (p_mosque_id, p_month, 1)
  ON CONFLICT (mosque_id, month)
  DO UPDATE SET online_donations = plan_usage.online_donations + 1;
$$ LANGUAGE sql VOLATILE SECURITY DEFINER;
