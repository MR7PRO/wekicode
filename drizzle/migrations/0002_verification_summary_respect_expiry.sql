CREATE OR REPLACE VIEW public.public_profile_verification_summary WITH (security_invoker=off) AS
SELECT p.user_id,
  COALESCE(bool_or(v.verification_type = 'email' AND v.status = 'approved' AND (v.expires_at IS NULL OR v.expires_at > now())), false) AS email_verified,
  COALESCE(bool_or(v.verification_type = 'phone' AND v.status = 'approved' AND (v.expires_at IS NULL OR v.expires_at > now())), false) AS phone_verified,
  COALESCE(bool_or(v.verification_type = 'professional_profile' AND v.status = 'approved' AND (v.expires_at IS NULL OR v.expires_at > now())), false) AS professional_verified,
  COALESCE(bool_or(v.verification_type = 'identity' AND v.status = 'approved' AND (v.expires_at IS NULL OR v.expires_at > now())), false) AS identity_verified,
  COALESCE(bool_or(v.verification_type = 'payment_account' AND v.status = 'approved' AND (v.expires_at IS NULL OR v.expires_at > now())), false) AS payment_verified
FROM public.profiles p
LEFT JOIN public.user_verifications v ON v.user_id = p.user_id
GROUP BY p.user_id;