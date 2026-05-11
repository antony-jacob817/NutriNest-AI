-- =====================================================
-- NutriNest AI — Complete RLS Policy Setup
-- Run this ONCE in Supabase SQL Editor (Dashboard → SQL)
-- =====================================================
-- This script enables RLS and creates all policies
-- for the real schema. Safe to re-run (uses DROP IF EXISTS).
-- =====================================================

-- ── 1. USERS ───────────────────────────────────────────────────────────────
-- Fix: password_hash is NOT NULL but Supabase Auth owns passwords.
-- Our public.users table should never store or require a password hash.
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- ── FIX: family_members optional columns ─────────────────────────────────────
-- The bootstrap creates a member with only the user's name.
-- All other fields are filled in by the user via editing — they must be nullable.
ALTER TABLE family_members ALTER COLUMN age DROP NOT NULL;
ALTER TABLE family_members ALTER COLUMN gender DROP NOT NULL;
ALTER TABLE family_members ALTER COLUMN height_cm DROP NOT NULL;
ALTER TABLE family_members ALTER COLUMN weight_kg DROP NOT NULL;
ALTER TABLE family_members ALTER COLUMN activity_level DROP NOT NULL;
ALTER TABLE family_members ALTER COLUMN dietary_preference DROP NOT NULL;
ALTER TABLE family_members ALTER COLUMN calorie_goal DROP NOT NULL;
ALTER TABLE family_members ALTER COLUMN protein_goal DROP NOT NULL;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_self" ON users;
CREATE POLICY "users_self" ON users
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── 2. FAMILY PROFILES ─────────────────────────────────────────────────────
ALTER TABLE family_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "family_profiles_self" ON family_profiles;
CREATE POLICY "family_profiles_self" ON family_profiles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 3. FAMILY MEMBERS ──────────────────────────────────────────────────────
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "family_members_self" ON family_members;
CREATE POLICY "family_members_self" ON family_members
  FOR ALL
  USING (
    family_id IN (
      SELECT id FROM family_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    family_id IN (
      SELECT id FROM family_profiles WHERE user_id = auth.uid()
    )
  );

-- ── 4. MEMBER ALLERGIES ────────────────────────────────────────────────────
ALTER TABLE member_allergies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "member_allergies_self" ON member_allergies;
CREATE POLICY "member_allergies_self" ON member_allergies
  FOR ALL
  USING (
    member_id IN (
      SELECT fm.id FROM family_members fm
      JOIN family_profiles fp ON fm.family_id = fp.id
      WHERE fp.user_id = auth.uid()
    )
  );

-- ── 5. MEMBER HEALTH CONDITIONS ────────────────────────────────────────────
ALTER TABLE member_health_conditions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "member_health_conditions_self" ON member_health_conditions;
CREATE POLICY "member_health_conditions_self" ON member_health_conditions
  FOR ALL
  USING (
    member_id IN (
      SELECT fm.id FROM family_members fm
      JOIN family_profiles fp ON fm.family_id = fp.id
      WHERE fp.user_id = auth.uid()
    )
  );

-- ── 6. MEAL PLANS ──────────────────────────────────────────────────────────
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "meal_plans_self" ON meal_plans;
CREATE POLICY "meal_plans_self" ON meal_plans
  FOR ALL
  USING (
    family_id IN (
      SELECT id FROM family_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    family_id IN (
      SELECT id FROM family_profiles WHERE user_id = auth.uid()
    )
  );

-- ── 7. MEALS ───────────────────────────────────────────────────────────────
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "meals_self" ON meals;
CREATE POLICY "meals_self" ON meals
  FOR ALL
  USING (
    meal_plan_id IN (
      SELECT mp.id FROM meal_plans mp
      JOIN family_profiles fp ON mp.family_id = fp.id
      WHERE fp.user_id = auth.uid()
    )
  );

-- ── 8. GROCERY LISTS ───────────────────────────────────────────────────────
ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "grocery_lists_self" ON grocery_lists;
CREATE POLICY "grocery_lists_self" ON grocery_lists
  FOR ALL
  USING (
    family_id IN (
      SELECT id FROM family_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    family_id IN (
      SELECT id FROM family_profiles WHERE user_id = auth.uid()
    )
  );

-- ── 9. GROCERY ITEMS ───────────────────────────────────────────────────────
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "grocery_items_self" ON grocery_items;
CREATE POLICY "grocery_items_self" ON grocery_items
  FOR ALL
  USING (
    grocery_list_id IN (
      SELECT gl.id FROM grocery_lists gl
      JOIN family_profiles fp ON gl.family_id = fp.id
      WHERE fp.user_id = auth.uid()
    )
  );

-- ── 10. NUTRITION LOGS ─────────────────────────────────────────────────────
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nutrition_logs_self" ON nutrition_logs;
CREATE POLICY "nutrition_logs_self" ON nutrition_logs
  FOR ALL
  USING (
    member_id IN (
      SELECT fm.id FROM family_members fm
      JOIN family_profiles fp ON fm.family_id = fp.id
      WHERE fp.user_id = auth.uid()
    )
  );

-- ── 11. AI RECOMMENDATIONS ─────────────────────────────────────────────────
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_recommendations_self" ON ai_recommendations;
CREATE POLICY "ai_recommendations_self" ON ai_recommendations
  FOR ALL
  USING (
    family_id IN (
      SELECT id FROM family_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    family_id IN (
      SELECT id FROM family_profiles WHERE user_id = auth.uid()
    )
  );

-- ── 12. SUBSCRIPTIONS ──────────────────────────────────────────────────────
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscriptions_self" ON subscriptions;
CREATE POLICY "subscriptions_self" ON subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 13. PAYMENTS ───────────────────────────────────────────────────────────
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_self" ON payments;
CREATE POLICY "payments_self" ON payments
  FOR ALL
  USING (
    subscription_id IN (
      SELECT id FROM subscriptions WHERE user_id = auth.uid()
    )
  );

-- ── 14. NOTIFICATIONS ──────────────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_self" ON notifications;
CREATE POLICY "notifications_self" ON notifications
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 15. MASTER TABLES (public read) ────────────────────────────────────────
ALTER TABLE allergies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allergies_public_read" ON allergies;
CREATE POLICY "allergies_public_read" ON allergies FOR SELECT USING (true);

ALTER TABLE health_conditions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "health_conditions_public_read" ON health_conditions;
CREATE POLICY "health_conditions_public_read" ON health_conditions FOR SELECT USING (true);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "recipes_public_read" ON recipes;
CREATE POLICY "recipes_public_read" ON recipes FOR SELECT USING (true);

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ingredients_public_read" ON ingredients;
CREATE POLICY "ingredients_public_read" ON ingredients FOR SELECT USING (true);

ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "recipe_ingredients_public_read" ON recipe_ingredients;
CREATE POLICY "recipe_ingredients_public_read" ON recipe_ingredients FOR SELECT USING (true);
-- ── FIX: store AI insight action so Apply button navigation persists ─────────
ALTER TABLE ai_recommendations ADD COLUMN IF NOT EXISTS action text;

-- ── SUBSCRIPTIONS TABLE ───────────────────────────────────────────────────────
-- Table already exists in Supabase. This just ensures RLS is correctly set.
-- Bootstrap (AuthContext Step 4) inserts/updates plan_name on every login.
ALTER TABLE IF EXISTS subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscriptions_self" ON subscriptions;
CREATE POLICY "subscriptions_self" ON subscriptions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── DELETE USER RPC ───────────────────────────────────────────────────────────
-- Called by the client via supabase.rpc('delete_user').
-- SECURITY DEFINER runs as postgres superuser, so it can delete from auth.users.
-- It explicitly wipes all user data in dependency order before removing auth row,
-- so the subscriptions row (and everything else) is guaranteed gone.
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_family_id   uuid;
  v_member_ids  uuid[];
  v_plan_ids    uuid[];
  v_list_ids    uuid[];
BEGIN
  -- Resolve family
  SELECT id INTO v_family_id
    FROM family_profiles WHERE user_id = auth.uid() LIMIT 1;

  IF v_family_id IS NOT NULL THEN
    -- Collect member IDs
    SELECT ARRAY(SELECT id FROM family_members WHERE family_id = v_family_id)
      INTO v_member_ids;

    -- Delete member-level data
    DELETE FROM nutrition_logs           WHERE member_id = ANY(v_member_ids);
    DELETE FROM member_allergies         WHERE member_id = ANY(v_member_ids);
    DELETE FROM member_health_conditions WHERE member_id = ANY(v_member_ids);

    -- Collect & delete meal plan children
    SELECT ARRAY(SELECT id FROM meal_plans WHERE family_id = v_family_id)
      INTO v_plan_ids;
    DELETE FROM meals WHERE meal_plan_id = ANY(v_plan_ids);

    -- Collect & delete grocery children
    SELECT ARRAY(SELECT id FROM grocery_lists WHERE family_id = v_family_id)
      INTO v_list_ids;
    DELETE FROM grocery_items WHERE list_id = ANY(v_list_ids);

    DELETE FROM meal_plans          WHERE family_id = v_family_id;
    DELETE FROM grocery_lists       WHERE family_id = v_family_id;
    DELETE FROM ai_recommendations  WHERE family_id = v_family_id;
    DELETE FROM family_members      WHERE family_id = v_family_id;
    DELETE FROM family_profiles     WHERE id        = v_family_id;
  END IF;

  -- Delete subscriptions and user profile
  DELETE FROM subscriptions WHERE user_id = auth.uid();
  DELETE FROM users         WHERE id      = auth.uid();

  -- Finally delete the auth row — any remaining FKs with CASCADE will follow
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Allow any authenticated user to call this function on themselves
GRANT EXECUTE ON FUNCTION delete_user() TO authenticated;

