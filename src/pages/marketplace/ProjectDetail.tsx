import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchProjectById, fetchProposalsForProject, submitProposal,
  updateProposalStatus, updateProject,
} from "@/lib/marketplace/api";
import {
  PROJECT_STATUS_LABELS, PROPOSAL_STATUS_LABELS,
  type ProjectRequest, type ProjectProposal,
} from "@/lib/marketplace/types";
import { toast } from "sonner";
import { ArrowRight, Loader2, Users } from "lucide-react";

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectRequest | null>(null);
  const [proposals, setProposals] = useState<ProjectProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [cover, setCover] = useState("");
  const [price, setPrice] = useState("");
  const [days, setDays] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!id) return;
    const p = await fetchProjectById(id);
    setProject(p);
    if (p) {
      try { setProposals(await fetchProposalsForProject(id)); } catch { setProposals([]); }
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  const isOwner = !!user && project?.buyer_id === user.id;
  const myProposal = proposals.find((p) => p.freelancer_id === user?.id);
  const openForProposals = project?.status === "open" || project?.status === "reviewing";

  const send = async () => {
    if (!user || !id) return;
    if (cover.trim().length < 30) return toast.error("اكتب عرضًا مفصلًا (30 حرفًا على الأقل)");
    setSaving(true);
    try {
      await submitProposal({
        project_id: id,
        freelancer_id: user.id,
        cover_letter: cover.trim(),
        proposed_price: price ? Number(price) : null,
        estimated_delivery_days: days ? Number(days) : null,
        status: "submitted",
      });
      setCover(""); setPrice(""); setDays("");
      toast.success("تم إرسال عرضك");
      await load();
    } catch {
      toast.error("تعذر إرسال العرض");
    } finally {
      setSaving(false);
    }
  };

  const decide = async (proposalId: string, status: string) => {
    try {
      await updateProposalStatus(proposalId, status);
      if (status === "accepted" && id) await updateProject(id, { status: "assigned" });
      await load();
      toast.success("تم تحديث حالة العرض");
    } catch {
      toast.error("تعذر تحديث العرض");
    }
  };

  const budget = project?.budget_min && project?.budget_max
    ? `${project.budget_min} - ${project.budget_max} ${project.currency}`
    : project?.budget_max ? `حتى ${project.budget_max} ${project.currency}`
    : project?.budget_min ? `من ${project.budget_min} ${project.currency}` : "الميزانية غير محددة";

  return (
    <PageShell
      title={project ? `${project.title} | مشاريع WekiCode` : "تفاصيل المشروع"}
      description={project?.description?.slice(0, 150) ?? "تفاصيل مشروع في سوق WekiCode"}
      path={`/marketplace/projects/${id ?? ""}`}
    >
      <Link to="/marketplace/projects" className="text-sm text-primary inline-flex items-center gap-1 mb-4">
        <ArrowRight className="w-4 h-4" /> كل المشاريع
      </Link>

      {loading ? (
        <div className="space-y-3"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-40 w-full" /></div>
      ) : !project ? (
        <Card><CardContent className="pt-6 text-sm text-muted-foreground">المشروع غير متاح.</CardContent></Card>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <Badge variant="secondary">{PROJECT_STATUS_LABELS[project.status] ?? project.status}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-5">
            {budget} · <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> {project.proposals_count} عرض</span>
            {project.expected_duration ? ` · المدة: ${project.expected_duration}` : ""} ·{" "}
            {new Date(project.created_at).toLocaleDateString("ar")}
          </p>

          <Card className="mb-4">
            <CardContent className="pt-6 text-sm whitespace-pre-wrap leading-7">{project.description}</CardContent>
          </Card>

          {project.skills_required?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-6">
              {project.skills_required.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
            </div>
          )}

          {isOwner ? (
            <>
              <h2 className="font-bold mb-3">العروض المقدمة ({proposals.length})</h2>
              {proposals.length === 0 ? (
                <Card><CardContent className="pt-6 text-sm text-muted-foreground">لم يصل أي عرض بعد.</CardContent></Card>
              ) : (
                <div className="space-y-3">
                  {proposals.map((pr) => (
                    <Card key={pr.id}>
                      <CardContent className="pt-5">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <Link to={`/u/${pr.freelancer_id}`} className="font-semibold text-primary">
                            {pr.freelancer?.full_name ?? "مستقل"}
                          </Link>
                          <Badge variant="secondary">{PROPOSAL_STATUS_LABELS[pr.status] ?? pr.status}</Badge>
                        </div>
                        <p className="text-sm whitespace-pre-wrap leading-7 mb-3">{pr.cover_letter}</p>
                        <p className="text-xs text-muted-foreground mb-3">
                          {pr.proposed_price ? `${pr.proposed_price} ${pr.currency}` : "السعر غير محدد"}
                          {pr.estimated_delivery_days ? ` · التسليم خلال ${pr.estimated_delivery_days} يوم` : ""}
                        </p>
                        {pr.status === "submitted" || pr.status === "shortlisted" ? (
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" onClick={() => decide(pr.id, "accepted")}>قبول العرض</Button>
                            <Button size="sm" variant="outline" onClick={() => decide(pr.id, "shortlisted")}>ترشيح</Button>
                            <Button size="sm" variant="outline" onClick={() => decide(pr.id, "rejected")}>رفض</Button>
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : !user ? (
            <Card><CardContent className="pt-6 text-sm text-muted-foreground">
              <Link className="text-primary underline" to="/auth">سجّل الدخول</Link> لتقديم عرض على هذا المشروع.
            </CardContent></Card>
          ) : myProposal ? (
            <Card><CardContent className="pt-6 text-sm">
              لقد قدّمت عرضًا على هذا المشروع — الحالة:{" "}
              <span className="font-semibold">{PROPOSAL_STATUS_LABELS[myProposal.status] ?? myProposal.status}</span>
            </CardContent></Card>
          ) : !openForProposals ? (
            <Card><CardContent className="pt-6 text-sm text-muted-foreground">هذا المشروع لم يعد يستقبل عروضًا.</CardContent></Card>
          ) : (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h2 className="font-bold">قدّم عرضك</h2>
                <div className="space-y-2">
                  <Label>رسالة العرض</Label>
                  <Textarea rows={6} value={cover} onChange={(e) => setCover(e.target.value)}
                    placeholder="اشرح خبرتك، خطتك للتنفيذ، والمخرجات التي ستسلمها." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>السعر المقترح</Label>
                    <Input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>مدة التسليم (أيام)</Label>
                    <Input type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} />
                  </div>
                </div>
                <Button onClick={send} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 ml-2 animate-spin" />} إرسال العرض
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </PageShell>
  );
}
