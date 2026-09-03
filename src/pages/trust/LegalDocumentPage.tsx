import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchLegalDocument } from "@/lib/trust/api";
import {
  LEGAL_DOCUMENT_TITLES, LEGAL_DRAFT_NOTICE,
  type LegalDocument, type LegalDocumentKey,
} from "@/lib/trust/types";
import { ArrowRight } from "lucide-react";

export default function LegalDocumentPage() {
  const { key } = useParams();
  const [doc, setDoc] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!key) return;
    setLoading(true);
    fetchLegalDocument(key).then((d) => { setDoc(d); setLoading(false); });
  }, [key]);

  const title = doc?.title ?? LEGAL_DOCUMENT_TITLES[(key ?? "") as LegalDocumentKey] ?? "وثيقة قانونية";

  return (
    <PageShell
      title={`${title} | WekiCode`}
      description={`${title} في منصة WekiCode.`}
      path={`/legal/${key ?? ""}`}
      width="narrow"
    >
      <Link to="/legal" className="text-sm text-primary inline-flex items-center gap-1 mb-4">
        <ArrowRight className="w-4 h-4" /> السياسات والشروط
      </Link>

      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-xs text-muted-foreground mb-5">{LEGAL_DRAFT_NOTICE}</p>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : !doc ? (
        <Card><CardContent className="pt-6 text-sm text-muted-foreground">
          هذه الوثيقة قيد الإعداد ولم تُنشر بعد. للاستفسار يمكنك{" "}
          <Link className="text-primary underline" to="/support/new">فتح تذكرة دعم</Link>.
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-4">
              الإصدار {doc.version}
              {doc.effective_at && ` · ساري من ${new Date(doc.effective_at).toLocaleDateString("ar")}`}
            </p>
            <div className="whitespace-pre-wrap leading-8 text-sm">{doc.content}</div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
