
-- Revoke EXECUTE from public/anon/authenticated on internal trigger functions and server-only helpers.
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'prevent_gamification_updates()',
    'handle_new_user()',
    'update_question_votes()',
    'update_updated_at_column()',
    'update_answer_votes()',
    'update_article_votes()',
    'award_points_for_answer()',
    'award_points_for_question()',
    'deduct_points_for_redemption()',
    'award_points_for_article()',
    'award_points_for_quiz()',
    'award_points_for_checkin()',
    'award_streak_badges()',
    'award_points_for_course()',
    'deduct_points_for_enrollment()',
    'check_ai_chat_rate_limit(uuid, integer, integer)'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated;', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role;', fn);
  END LOOP;
END $$;
