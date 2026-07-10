import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsModerator } from "@/hooks/useIsModerator";
import { useAuth } from "@/contexts/AuthContext";
import { fetchReports, updateReport, moderateTopic, deleteReply, relativeArabic } from "@/lib/forum/api";
import { toast } from "sonner";
import { Shield, CheckCircle2, XCircle, EyeOff, Lock } from "lucide-react";

export default function Moderation() {
  const { user, loading } = useAuth();
  const { isModerator, loading: modLoading } = useIsModerator();
  const [status, setStatus] = useState("pending");
  const qc = useQueryClient();

  const reports = useQuery({
    queryKey: ["mod-reports", status],
    queryFn: () => fetchReports(status),
    enabled: isModerator,
  });

  if (loading || modLoading) return (<><Navbar /><div className="container pt-24"><Skeleton className="h-40 w-full" /></div></>);
  if (!user) return <Navigate to="/auth" replace />;
  if (!isModerator) return (
    <><Navbar />
      <div className="container mx-auto pt-24 pb-16 text-center" dir="rtl">
        <Card className="p-10">
          <Shield className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
          <div className="font-bold">هذه الصفحة للمشرفين فقط.</div>
        </Card>
      </div>
    </>
  );

  const act = async (id: string, patch: { status: string; resolution?: string }) => {
    try {
      await updateReport(id, { ...patch, reviewedBy: user.id });
      toast.success("تم التحديث");
      qc.invalidateQueries({ queryKey: ["mod-reports", status] });
    } catch (e: any) { toast.error(e.message || "فشل"); }
  };

  const hideContent = async (r: any) => {
    try {
      if (r.topic_id) await moderateTopic(r.topic_id, { status: "hidden" });
      else if (r.reply_id) await deleteReply(r.reply_id);
      toast.success("تم إخفاء المحتوى");
    } catch (e: any) { toast.error(e.message || "فشل"); }
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16" dir="rtl">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-black">لوحة الإشراف</h1>
        </div>
        <Tabs value={status} onValueChange={setStatus}>
          <TabsList>
            <TabsTrigger value="pending">المعلقة</TabsTrigger>
            <TabsTrigger value="accepted">مقبولة</TabsTrigger>
            <TabsTrigger value="rejected">مرفوضة</TabsTrigger>
          </TabsList>
          <TabsContent value={status} className="mt-4">
            {reports.isLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
            ) : reports.isError ? (
              <Card className="p-6 text-center">فشل التحميل <Button size="sm" variant="outline" onClick={() => reports.refetch()}>إعادة</Button></Card>
            ) : (reports.data ?? []).length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">لا توجد بلاغات في هذه الحالة.</Card>
            ) : (
              <div className="space-y-2">
                {reports.data!.map((r: any) => (
                  <Card key={r.id} className="p-3">
                    <div className="flex items-start gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant="outline" className="text-[10px]">{r.topic_id ? "موضوع" : "رد"}</Badge>
                          <Badge className="text-[10px]">{r.reason}</Badge>
                          <span className="text-[10px] text-muted-foreground">{relativeArabic(r.created_at)}</span>
                        </div>
                        {r.details && <p className="text-xs text-muted-foreground mb-1">{r.details}</p>}
                        {r.resolution && <p className="text-[10px] text-emerald-500 mb-1">القرار: {r.resolution}</p>}
                      </div>
                      {status === "pending" && (
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => act(r.id, { status: "accepted" })}>
                            <CheckCircle2 className="w-3 h-3 ml-1" /> قبول
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => act(r.id, { status: "rejected" })}>
                            <XCircle className="w-3 h-3 ml-1" /> رفض
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => hideContent(r)}>
                            <EyeOff className="w-3 h-3 ml-1" /> إخفاء المحتوى
                          </Button>
                          {r.topic_id && (
                            <Button size="sm" variant="outline" onClick={() => moderateTopic(r.topic_id, { is_locked: true }).then(() => toast.success("أُغلق"))}>
                              <Lock className="w-3 h-3 ml-1" /> إغلاق
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}