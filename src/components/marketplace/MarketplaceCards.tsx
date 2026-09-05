import { Link } from "react-router-dom";
import { Star, Clock, ShieldCheck, Package, Users, CalendarDays, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getUserAvatarSrc } from "@/lib/media/userAvatars";
import { AVAILABILITY_LABELS } from "@/lib/marketplace/types";
import type { MarketplaceService, ProjectRequest, SellerMini } from "@/lib/marketplace/types";

function Rating({ avg, count }: { avg: number; count: number }) {
  if (!count) return <span className="text-[11px] text-muted-foreground">لا توجد تقييمات بعد</span>;
  return (
    <span className="flex items-center gap-1 text-[11px] text-foreground">
      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
      <span className="font-bold">{Number(avg).toFixed(1)}</span>
      <span className="text-muted-foreground">({count})</span>
    </span>
  );
}

export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-bold">
      <ShieldCheck className="w-3 h-3" /> موثّق
    </span>
  );
}

export function ServiceCard({ service }: { service: MarketplaceService }) {
  const seller = service.seller;
  return (
    <Card className="glass border-border/50 overflow-hidden hover:border-primary/40 transition-colors flex flex-col">
      <Link to={`/marketplace/services/${service.slug || service.id}`} className="block">
        <div className="h-32 bg-gradient-to-br from-primary/15 via-background to-accent/15 relative">
          {service.cover_image_url && (
            <img src={service.cover_image_url} alt={service.title} loading="lazy" className="w-full h-full object-cover" />
          )}
        </div>
      </Link>
      <div className="p-3 flex flex-col gap-2 flex-1">
        <Link to={`/marketplace/services/${service.slug || service.id}`}
          className="font-bold text-sm leading-snug line-clamp-2 hover:text-primary transition-colors">
          {service.title}
        </Link>
        {seller && (
          <Link to={`/u/${seller.username || seller.user_id}`} className="flex items-center gap-2 text-[11px] text-muted-foreground hover:text-primary">
            <img src={seller.avatar_url || getUserAvatarSrc(seller.user_id)} alt="" className="w-5 h-5 rounded-full object-cover" />
            <span className="truncate">{seller.full_name || "مستقل"}</span>
            {seller.marketplace_verified && <VerifiedBadge />}
          </Link>
        )}
        <div className="flex items-center justify-between">
          <Rating avg={service.rating_avg} count={service.rating_count} />
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />{service.delivery_days} يوم
          </span>
        </div>
        {service.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {service.tags.slice(0, 3).map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">{t}</Badge>
            ))}
          </div>
        )}
        <div className="mt-auto pt-2 border-t border-border/40 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Package className="w-3.5 h-3.5" />{service.orders_count} طلب
          </span>
          <span className="text-sm font-bold text-primary">
            من {Number(service.base_price).toLocaleString()} {service.currency}
          </span>
        </div>
      </div>
    </Card>
  );
}

export function FreelancerCard({ seller }: { seller: SellerMini }) {
  return (
    <Card className="glass border-border/50 p-3 hover:border-primary/40 transition-colors">
      <Link to={`/u/${seller.username || seller.user_id}`} className="flex items-start gap-3">
        <img src={seller.avatar_url || getUserAvatarSrc(seller.user_id)} alt=""
          className="w-12 h-12 rounded-xl object-cover shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm truncate">{seller.full_name || "مستقل"}</span>
            {seller.marketplace_verified && <VerifiedBadge />}
          </div>
          <p className="text-[11px] text-muted-foreground truncate">
            {seller.headline || seller.freelancer_role || "مطوّر في مجتمع WekiCode"}
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            <Rating avg={seller.marketplace_rating_avg} count={seller.marketplace_rating_count} />
            <span className="text-[11px] text-muted-foreground">{seller.points ?? 0} نقطة مساهمة</span>
          </div>
          {seller.skills?.length ? (
            <div className="flex flex-wrap gap-1 mt-2">
              {seller.skills.slice(0, 4).map((s) => (
                <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">{s}</Badge>
              ))}
            </div>
          ) : null}
          <p className="text-[10px] mt-2 text-emerald-500">
            {AVAILABILITY_LABELS[seller.availability_status || "available"]}
          </p>
        </div>
      </Link>
    </Card>
  );
}

export function ProjectCard({ project }: { project: ProjectRequest }) {
  const budget = project.budget_min || project.budget_max
    ? `${project.budget_min ?? "?"} – ${project.budget_max ?? "?"} ${project.currency}`
    : "الميزانية غير محددة";
  return (
    <Card className="glass border-border/50 p-4 hover:border-primary/40 transition-colors">
      <Link to={`/marketplace/projects/${project.id}`} className="font-bold text-sm hover:text-primary line-clamp-2">
        {project.title}
      </Link>
      <p className="text-[12px] text-muted-foreground mt-1.5 line-clamp-2">{project.description}</p>
      <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><Wallet className="w-3.5 h-3.5" />{budget}</span>
        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{project.proposals_count} عرض</span>
        {project.deadline && (
          <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{project.deadline}</span>
        )}
      </div>
      {project.skills_required?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {project.skills_required.slice(0, 5).map((s) => (
            <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">{s}</Badge>
          ))}
        </div>
      )}
    </Card>
  );
}