export type VerificationType =
  | "email" | "phone" | "professional_profile" | "identity" | "payment_account" | "business";

export type VerificationStatus =
  | "not_started" | "pending" | "action_required" | "under_review"
  | "approved" | "rejected" | "expired" | "suspended";

export interface UserVerification {
  id: string;
  user_id: string;
  verification_type: VerificationType;
  provider: string | null;
  status: VerificationStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  expires_at: string | null;
  rejection_reason: string | null;
  updated_at: string;
}

export interface VerificationSummary {
  user_id: string;
  email_verified: boolean;
  phone_verified: boolean;
  professional_verified: boolean;
  identity_verified: boolean;
  payment_verified: boolean;
}

export type ProRequestStatus =
  | "draft" | "submitted" | "under_review" | "changes_requested" | "approved" | "rejected" | "suspended";

export interface ProfessionalVerificationRequest {
  id: string;
  user_id: string;
  status: ProRequestStatus;
  portfolio_links: string[];
  work_samples: string[];
  skills: string[];
  notes: string | null;
  reviewer_notes?: string | null;
  standards_accepted: boolean;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type SellerLevel = "new" | "active" | "professional" | "elite" | "partner";

export interface SellerLevelStatus {
  user_id: string;
  current_level: SellerLevel;
  trust_score: number;
  has_enough_data: boolean;
  completed_orders_count: number;
  cancelled_orders_count: number;
  disputed_orders_count: number;
  on_time_delivery_rate: number;
  response_rate: number;
  average_rating: number;
  reviews_count: number;
  last_calculated_at: string;
  next_level_progress: Record<string, unknown>;
}

export interface TrustScoreEvent {
  id: string;
  event_type: string;
  points_change: number;
  reason: string | null;
  created_at: string;
}

export type RestrictionType =
  | "warning" | "marketplace_listing_block" | "proposal_block" | "messaging_block"
  | "payment_hold" | "verification_suspension"
  | "temporary_account_suspension" | "permanent_account_suspension";

export interface AccountRestriction {
  id: string;
  user_id: string;
  restriction_type: RestrictionType;
  scope: string;
  reason_code: string;
  public_message: string | null;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
}

export type AppealStatus =
  | "submitted" | "under_review" | "more_information_required" | "approved" | "rejected" | "closed";

export interface AccountAppeal {
  id: string;
  restriction_id: string | null;
  explanation: string;
  status: AppealStatus;
  reviewer_response: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export interface HelpArticle {
  id: string;
  slug: string;
  category: string;
  title: string;
  excerpt: string | null;
  content: string;
  display_order: number;
  published_at: string | null;
  updated_at: string;
}

export type TicketStatus = "open" | "waiting_on_user" | "waiting_on_support" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export interface SupportTicket {
  id: string;
  user_id: string;
  category: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
  updated_at: string;
}

export interface SupportTicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string | null;
  sender_type: "user" | "support" | "system";
  message: string;
  created_at: string;
}

export interface LegalDocument {
  id: string;
  document_key: string;
  title: string;
  content: string;
  version: string;
  status: string;
  effective_at: string | null;
  published_at: string | null;
  updated_at: string;
}

export interface PrivacyPreferences {
  user_id: string;
  analytics_enabled: boolean;
  personalization_enabled: boolean;
  marketing_enabled: boolean;
}

/* ---------------- Arabic labels ---------------- */

export const VERIFICATION_TYPE_LABELS: Record<VerificationType, string> = {
  email: "البريد موثّق",
  phone: "الهاتف موثّق",
  professional_profile: "مستقل موثّق مهنيًا",
  identity: "الهوية موثّقة",
  payment_account: "حساب دفع موثّق",
  business: "نشاط تجاري موثّق",
};

export const VERIFICATION_TYPE_MEANING: Record<VerificationType, string> = {
  email: "تم تأكيد عنوان البريد الإلكتروني عبر مزوّد المصادقة فقط.",
  phone: "نجحت عملية التحقق من رقم الهاتف.",
  professional_profile: "راجع فريق WekiCode الملف المهني والمهارات وروابط الأعمال.",
  identity: "قام مزوّد تحقق خارجي معتمد بالتحقق من هوية الشخص.",
  payment_account: "حساب لدى مزوّد دفع متصل ومستوفٍ لمتطلبات التحقق.",
  business: "تمت مراجعة بيانات النشاط التجاري المقدَّمة.",
};

export const VERIFICATION_DISCLAIMER =
  "التحقق يعني أن معلومات محددة تمت مراجعتها، ولا يضمن جودة العمل أو نجاح التسليم.";

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  not_started: "لم يبدأ",
  pending: "قيد الإرسال",
  action_required: "إجراء مطلوب",
  under_review: "قيد المراجعة",
  approved: "مُعتمد",
  rejected: "مرفوض",
  expired: "منتهي الصلاحية",
  suspended: "موقوف",
};

export const SELLER_LEVEL_LABELS: Record<SellerLevel, string> = {
  new: "مستقل جديد",
  active: "مستقل نشط",
  professional: "مستقل محترف",
  elite: "مستقل مميز",
  partner: "شريك WekiCode",
};

export const SELLER_LEVEL_CRITERIA: Record<SellerLevel, string> = {
  new: "حساب جديد أو لا توجد طلبات مكتملة بعد.",
  active: "طلبان مكتملان أو أكثر بسجل نظيف.",
  professional: "8 طلبات مكتملة على الأقل بمتوسط تقييم 4.3 فأعلى.",
  elite: "20 طلبًا مكتملًا على الأقل، تقييم 4.6 فأعلى، وتحقق مهني.",
  partner: "50 طلبًا مكتملًا على الأقل، تقييم 4.8 فأعلى، وتحقق مهني.",
};

export const TRUST_DISCLAIMER =
  "مؤشر مبني على نشاط الحساب وسجل التعامل داخل WekiCode، وليس ضمانًا للنتيجة.";

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: "مفتوحة",
  waiting_on_user: "بانتظار ردّك",
  waiting_on_support: "بانتظار الدعم",
  resolved: "تم الحل",
  closed: "مغلقة",
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "منخفضة", normal: "عادية", high: "مرتفعة", urgent: "عاجلة",
};

export const APPEAL_STATUS_LABELS: Record<AppealStatus, string> = {
  submitted: "مُقدَّم",
  under_review: "قيد المراجعة",
  more_information_required: "مطلوب معلومات إضافية",
  approved: "مقبول",
  rejected: "مرفوض",
  closed: "مغلق",
};

export const RESTRICTION_TYPE_LABELS: Record<RestrictionType, string> = {
  warning: "تنبيه",
  marketplace_listing_block: "إيقاف نشر الخدمات",
  proposal_block: "إيقاف تقديم العروض",
  messaging_block: "إيقاف المراسلة",
  payment_hold: "تعليق المدفوعات",
  verification_suspension: "تعليق التحقق",
  temporary_account_suspension: "إيقاف مؤقت للحساب",
  permanent_account_suspension: "إيقاف دائم للحساب",
};

export const LEGAL_DOCUMENT_KEYS = [
  "terms", "privacy", "community-guidelines", "marketplace-terms",
  "refund-cancellation", "dispute-policy", "verification-policy",
  "content-policy", "cookies", "acceptable-use", "intellectual-property", "safety",
] as const;

export type LegalDocumentKey = (typeof LEGAL_DOCUMENT_KEYS)[number];

export const LEGAL_DOCUMENT_TITLES: Record<LegalDocumentKey, string> = {
  terms: "شروط الاستخدام",
  privacy: "سياسة الخصوصية",
  "community-guidelines": "إرشادات المجتمع",
  "marketplace-terms": "شروط سوق الخدمات",
  "refund-cancellation": "سياسة الإلغاء والاسترداد",
  "dispute-policy": "سياسة النزاعات",
  "verification-policy": "سياسة التحقق",
  "content-policy": "سياسة المحتوى",
  cookies: "ملفات التعريف والتخزين المحلي",
  "acceptable-use": "الاستخدام المقبول",
  "intellectual-property": "الملكية الفكرية",
  safety: "السلامة والأمان",
};

export const LEGAL_DRAFT_NOTICE =
  "مسودة تشغيلية تحتاج مراجعة قانونية حسب دولة تسجيل وتشغيل WekiCode والدول التي تستهدفها.";

export const HELP_CATEGORIES: { key: string; title: string }[] = [
  { key: "getting-started", title: "البدء في WekiCode" },
  { key: "account-security", title: "الحساب والأمان" },
  { key: "forums", title: "المنتديات والمحتوى" },
  { key: "freelancers", title: "المستقلون والخدمات" },
  { key: "projects", title: "طلبات المشاريع والعروض" },
  { key: "orders", title: "الطلبات والتسليم" },
  { key: "payments", title: "الدفع" },
  { key: "reviews", title: "التقييمات" },
  { key: "disputes", title: "النزاعات" },
  { key: "verification", title: "التحقق" },
  { key: "policies", title: "السياسات" },
  { key: "privacy", title: "الخصوصية" },
  { key: "report", title: "الإبلاغ عن مشكلة" },
];

export const SUPPORT_CATEGORIES: { key: string; title: string }[] = [
  { key: "general", title: "استفسار عام" },
  { key: "account", title: "الحساب وتسجيل الدخول" },
  { key: "verification", title: "التحقق" },
  { key: "marketplace", title: "الخدمات والطلبات" },
  { key: "dispute", title: "نزاع أو مشكلة تسليم" },
  { key: "content", title: "محتوى أو منتدى" },
  { key: "privacy", title: "الخصوصية والبيانات" },
  { key: "bug", title: "مشكلة تقنية" },
];