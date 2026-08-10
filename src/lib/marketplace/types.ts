export type ServiceStatus = "draft" | "pending_review" | "active" | "paused" | "rejected" | "archived";
export type ProjectStatus =
  | "draft" | "open" | "reviewing" | "assigned" | "in_progress" | "completed" | "cancelled" | "closed";
export type ProposalStatus = "submitted" | "shortlisted" | "accepted" | "rejected" | "withdrawn";
export type OrderStatus =
  | "pending" | "accepted" | "in_progress" | "submitted" | "revision_requested"
  | "completed" | "cancelled" | "disputed";

export interface MarketplaceCategory {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  display_order: number;
}

export interface SellerMini {
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  headline: string | null;
  freelancer_role: string | null;
  level: number | null;
  points: number | null;
  marketplace_verified: boolean;
  marketplace_rating_avg: number;
  marketplace_rating_count: number;
  completed_orders_count: number;
  availability_status: string | null;
  skills: string[] | null;
}

export interface MarketplaceService {
  id: string;
  seller_id: string;
  category_id: string | null;
  slug: string | null;
  title: string;
  description: string;
  short_description: string | null;
  status: ServiceStatus;
  base_price: number;
  currency: string;
  delivery_days: number;
  revisions_included: number;
  cover_image_url: string | null;
  gallery_urls: string[];
  tags: string[];
  requirements: string | null;
  rating_avg: number;
  rating_count: number;
  orders_count: number;
  views_count: number;
  is_featured: boolean;
  moderation_note: string | null;
  created_at: string;
  updated_at: string;
  seller?: SellerMini | null;
  category?: MarketplaceCategory | null;
}

export interface ServicePackage {
  id: string;
  service_id: string;
  name: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  delivery_days: number;
  revisions: number;
  features: string[];
  display_order: number;
}

export interface ProjectRequest {
  id: string;
  buyer_id: string;
  category_id: string | null;
  title: string;
  description: string;
  budget_min: number | null;
  budget_max: number | null;
  currency: string;
  deadline: string | null;
  expected_duration: string | null;
  skills_required: string[];
  status: ProjectStatus;
  visibility: "public" | "private";
  attachments: string[];
  proposals_count: number;
  created_at: string;
  updated_at: string;
  buyer?: SellerMini | null;
  category?: MarketplaceCategory | null;
}

export interface ProjectProposal {
  id: string;
  project_id: string;
  freelancer_id: string;
  cover_letter: string;
  proposed_price: number | null;
  currency: string;
  estimated_delivery_days: number | null;
  status: ProposalStatus;
  attachments: string[];
  created_at: string;
  freelancer?: SellerMini | null;
  project?: Pick<ProjectRequest, "id" | "title" | "status"> | null;
}

export interface MarketplaceOrder {
  id: string;
  buyer_id: string;
  seller_id: string;
  service_id: string | null;
  package_id: string | null;
  project_id: string | null;
  proposal_id: string | null;
  title: string;
  scope: string;
  price: number;
  currency: string;
  platform_fee: number;
  seller_amount: number;
  payment_mode: string;
  status: OrderStatus;
  delivery_due_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  buyer?: SellerMini | null;
  seller?: SellerMini | null;
}

export interface OrderMessage {
  id: string;
  order_id: string;
  sender_id: string;
  message: string;
  attachments: string[];
  created_at: string;
}

export interface OrderDeliverable {
  id: string;
  order_id: string;
  seller_id: string;
  title: string;
  description: string | null;
  files: string[];
  links: string[];
  status: string;
  created_at: string;
}

export interface MarketplaceReview {
  id: string;
  order_id: string;
  reviewer_id: string;
  reviewee_id: string;
  service_id: string | null;
  rating: number;
  communication_rating: number | null;
  quality_rating: number | null;
  delivery_rating: number | null;
  comment: string | null;
  created_at: string;
  reviewer?: SellerMini | null;
}

export interface ServiceFilters {
  q?: string;
  categoryId?: string;
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  maxDeliveryDays?: number;
  sort?: "rating" | "newest" | "price_asc" | "price_desc" | "fastest" | "popular";
}

export interface FreelancerFilters {
  q?: string;
  skills?: string[];
  availability?: string;
  minRating?: number;
  language?: string;
  sort?: "rating" | "contributions" | "newest";
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "بانتظار القبول",
  accepted: "مقبول",
  in_progress: "قيد التنفيذ",
  submitted: "تم التسليم",
  revision_requested: "طلب تعديل",
  completed: "مكتمل",
  cancelled: "ملغي",
  disputed: "نزاع",
};

export const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  draft: "مسودة",
  pending_review: "بانتظار المراجعة",
  active: "منشورة",
  paused: "متوقفة مؤقتًا",
  rejected: "مرفوضة",
  archived: "مؤرشفة",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "مسودة",
  open: "مفتوح",
  reviewing: "قيد المراجعة",
  assigned: "تم الإسناد",
  in_progress: "قيد التنفيذ",
  completed: "مكتمل",
  cancelled: "ملغي",
  closed: "مغلق",
};

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  submitted: "مُقدَّم",
  shortlisted: "مرشّح",
  accepted: "مقبول",
  rejected: "مرفوض",
  withdrawn: "مسحوب",
};

export const AVAILABILITY_LABELS: Record<string, string> = {
  available: "متاح للعمل",
  busy: "مشغول جزئيًا",
  unavailable: "غير متاح",
};