import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { fetchLegalDocuments } from "@/lib/trust/api";
import {
  LEGAL_DOCUMENT_KEYS, LEGAL_DOCUMENT_TITLES, LEGAL_DRAFT_NOTICE,
  type LegalDocument, type LegalDocumentKey,
} from "@/lib/trust/types";
import { ScrollText } from "lucide-react";

export default function LegalCenter() {
  const [docs, setDocs] = useState<LegalDocument[]>([]);

  useEffect(() => { fetchLegalDocuments().then(setDocs); }, []);

  const published = new Set(docs.map((d) => d.document_key));

  return (
    <PageShell
      title="السياسات والشروط | WekiCode"
      description="شروط الاستخدام، الخصوصية، إرشادات المجتمع، وسياسات سوق الخدمات في WekiCode."
      path="/legal"
      width="narrow"
    >
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <ScrollText className="w-6 h-6 text-primary" /> السياسات والشروط
      </h1>
      <p className="text-xs text-muted-foreground mb-6">{LEGAL_DRAFT_NOTICE}</p>

      <div className="grid gap-3 md:grid-cols-2">
        {LEGAL_DOCUMENT_KEYS.map((k: LegalDocumentKey) => (
          <Link key={k} to={`/legal/${k}`}>
            <Card className="h-full hover:border-primary/50 transition-colors">
              <CardContent className="pt-5">
                <h2 className="font-semibold">{LEGAL_DOCUMENT_TITLES[k]}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {published.has(k) ? "منشور" : "قيد الإعداد"}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
