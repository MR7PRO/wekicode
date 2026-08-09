import { Link } from "react-router-dom";
import { Trash2, CloudDownload, WifiOff } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";
import { useOfflineSavedItems } from "@/hooks/useOfflineSavedItems";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

const typeLabel: Record<string, string> = {
  topic: "نقاش",
  article: "مقال",
  knowledge: "معرفة",
};

export default function OfflineLibrary() {
  const { items, remove, clear } = useOfflineSavedItems();
  const { isOnline } = useNetworkStatus();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="المحتوى المحفوظ بدون اتصال"
        description="اقرأ المقالات والنقاشات المحفوظة على جهازك بدون اتصال."
        path="/saved-offline"
        noindex
      />
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-3xl pb-24">
        <header className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CloudDownload className="w-6 h-6 text-primary" /> المحتوى المحفوظ بدون اتصال
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isOnline ? "متصل — يتم تحديث المحتوى عند فتحه." : "بدون اتصال — يمكنك قراءة ما هو محفوظ فقط."}
          </p>
        </header>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-border/60 p-10 text-center text-muted-foreground">
            <WifiOff className="w-8 h-8 mx-auto mb-3 opacity-60" />
            لا يوجد محتوى محفوظ بعد. استخدم زر «حفظ للقراءة بدون اتصال» في صفحات النقاشات والمقالات.
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-3">
              <Button variant="ghost" size="sm" onClick={clear}>مسح الكل</Button>
            </div>
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={`${item.type}-${item.id}`} className="rounded-2xl border border-border/60 bg-card/60 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {typeLabel[item.type] ?? item.type}
                      </span>
                      <Link to={item.url} className="block font-semibold mt-2 hover:text-primary line-clamp-2">
                        {item.title}
                      </Link>
                      {item.excerpt && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.excerpt}</p>
                      )}
                      <p className="text-[11px] text-muted-foreground mt-2">
                        آخر مزامنة: {new Date(item.savedAt).toLocaleString("ar")}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" aria-label="إزالة" onClick={() => remove(item.id, item.type)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {!isOnline && item.content && (
                    <details className="mt-3">
                      <summary className="text-xs text-primary cursor-pointer">قراءة النسخة المحفوظة</summary>
                      <div className="mt-2 text-sm whitespace-pre-wrap leading-8 text-muted-foreground">
                        {item.content}
                      </div>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}