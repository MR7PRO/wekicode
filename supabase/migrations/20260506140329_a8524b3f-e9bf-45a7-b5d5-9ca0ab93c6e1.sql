-- 1) Quiz integrity: hide correct_answer from clients
-- Restrict raw table SELECT, expose a safe view + a SECURITY DEFINER scoring function.

DROP POLICY IF EXISTS "Quiz questions viewable by everyone" ON public.quiz_questions;

CREATE POLICY "Quiz questions readable only by server"
  ON public.quiz_questions FOR SELECT
  USING (false);

-- Safe view (no correct_answer)
CREATE OR REPLACE VIEW public.quiz_questions_public
WITH (security_invoker = on) AS
  SELECT id, quiz_id, question_text, options, points, sort_order
  FROM public.quiz_questions;

GRANT SELECT ON public.quiz_questions_public TO anon, authenticated;

-- Server-side scoring + attempt insertion
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
  p_quiz_id uuid,
  p_answers jsonb  -- { "<question_id>": <selected_index>, ... }
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_question RECORD;
  v_score integer := 0;
  v_total integer := 0;
  v_points integer := 0;
  v_selected integer;
  v_existing uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Prevent duplicate attempts (clients cannot retake to farm)
  SELECT id INTO v_existing FROM quiz_attempts
   WHERE user_id = v_user_id AND quiz_id = p_quiz_id
   LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already taken');
  END IF;

  FOR v_question IN
    SELECT id, correct_answer, points
    FROM quiz_questions
    WHERE quiz_id = p_quiz_id
  LOOP
    v_total := v_total + 1;
    v_selected := NULLIF(p_answers ->> v_question.id::text, '')::int;
    IF v_selected IS NOT NULL AND v_selected = v_question.correct_answer THEN
      v_score := v_score + 1;
      v_points := v_points + COALESCE(v_question.points, 10);
    END IF;
  END LOOP;

  INSERT INTO quiz_attempts (user_id, quiz_id, score, total_questions, points_earned)
  VALUES (v_user_id, p_quiz_id, v_score, v_total, v_points);

  RETURN jsonb_build_object(
    'success', true,
    'score', v_score,
    'total', v_total,
    'points_earned', v_points
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_quiz_attempt(uuid, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(uuid, jsonb) TO authenticated;

-- 2) Realtime channel authorization: require auth.uid() to subscribe
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_can_use_realtime" ON realtime.messages;
CREATE POLICY "authenticated_can_use_realtime"
  ON realtime.messages FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);