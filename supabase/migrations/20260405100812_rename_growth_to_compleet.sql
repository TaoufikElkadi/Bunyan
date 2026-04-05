-- Rename 'growth' plan to 'compleet'
-- Drop constraint first so the UPDATE doesn't violate the old check

ALTER TABLE mosques DROP CONSTRAINT mosques_plan_check;
UPDATE mosques SET plan = 'compleet' WHERE plan = 'growth';
ALTER TABLE mosques ADD CONSTRAINT mosques_plan_check CHECK (plan IN ('free', 'starter', 'compleet'));
