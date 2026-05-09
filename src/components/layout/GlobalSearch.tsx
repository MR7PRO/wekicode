import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, HelpCircle, FileText, Briefcase, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";

interface Results {
  questions: { id: string; title: string }[];
  articles: { id: string; title: string }[];
  jobs: { id: string; title: string }[];
  profiles: { user_id: string; full_name: string | null }[];
}

const empty: Results = { questions: [], articles: [], jobs: [], profiles: [] };

interface GlobalSearchProps {
  variant?: "button" | "inline";
}

export function GlobalSearch({ variant = "button" }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Results>(empty);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(empty);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const like = `%${q}%`;
      const [qs, ar, jb, pr] = await Promise.all([
        supabase.from("questions").select("id,title").ilike("title", like).limit(5),
        supabase.from("articles").select("id,title").ilike("title", like).limit(5),
        supabase.from("jobs").select("id,title").ilike("title", like).eq("status", "open").limit(5),
        supabase.from("profiles").select("user_id,full_name").ilike("full_name", like).eq("is_public", true).limit(5),
      ]);
      setResults({
        questions: (qs.data as any) ?? [],
        articles: (ar.data as any) ?? [],
        jobs: (jb.data as any) ?? [],
        profiles: (pr.data as any) ?? [],
      });
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const go = useCallback(
    (path: string) => {
      setOpen(false);
      setQuery("");
      navigate(path);
    },
    [navigate]
  );

  const totalCount =
    results.questions.length + results.articles.length + results.jobs.length + results.profiles.length;

  const trigger =
    variant === "inline" ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 h-9 px-4 rounded-full bg-secondary/60 hover:bg-secondary border border-border/50 text-start text-sm text-muted-foreground transition-colors"
        aria-label="بحث عام"
      >
        <Search className="w-4 h-4 shrink-0" />
        <span className="flex-1 truncate">ابحث في الأسئلة، المقالات، الوظائف، المبرمجين…</span>
        <kbd className="hidden md:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-background/80 px-1.5 font-mono text-[10px] font-medium">
          ⌘K
        </kbd>
      </button>
    ) : (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 text-muted-foreground hover:text-foreground"
        aria-label="بحث عام"
      >
        <Search className="w-4 h-4" />
        <span>بحث</span>
      </Button>
    );

  return (
    <>
      {trigger}

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="ابحث عن أسئلة، مقالات، وظائف، مبرمجين…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          )}
          {!loading && query.trim().length >= 2 && totalCount === 0 && (
            <CommandEmpty>لا توجد نتائج.</CommandEmpty>
          )}
          {!loading && query.trim().length < 2 && (
            <div className="py-6 text-center text-xs text-muted-foreground">
              اكتب حرفين على الأقل للبدء
            </div>
          )}

          {results.questions.length > 0 && (
            <CommandGroup heading="الأسئلة">
              {results.questions.map((q) => (
                <CommandItem key={q.id} value={`q-${q.id}-${q.title}`} onSelect={() => go(`/questions/${q.id}`)}>
                  <HelpCircle className="w-4 h-4 ml-2 text-primary" />
                  <span className="line-clamp-1">{q.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results.articles.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="المقالات">
                {results.articles.map((a) => (
                  <CommandItem key={a.id} value={`a-${a.id}-${a.title}`} onSelect={() => go(`/articles/${a.id}`)}>
                    <FileText className="w-4 h-4 ml-2 text-primary" />
                    <span className="line-clamp-1">{a.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
          {results.jobs.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="الوظائف">
                {results.jobs.map((j) => (
                  <CommandItem key={j.id} value={`j-${j.id}-${j.title}`} onSelect={() => go(`/jobs`)}>
                    <Briefcase className="w-4 h-4 ml-2 text-primary" />
                    <span className="line-clamp-1">{j.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
          {results.profiles.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="المبرمجون">
                {results.profiles.map((p) => (
                  <CommandItem
                    key={p.user_id}
                    value={`p-${p.user_id}-${p.full_name ?? ""}`}
                    onSelect={() => go(`/u/${p.user_id}`)}
                  >
                    <Users className="w-4 h-4 ml-2 text-primary" />
                    <span className="line-clamp-1">{p.full_name ?? "مستخدم"}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
