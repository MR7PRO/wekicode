import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useMessages, useChatMessages, Conversation } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare, Search, ArrowRight, Loader2, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function NewConversationDialog({ onSelect }: { onSelect: (userId: string) => void }) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<{ user_id: string; full_name: string | null; avatar_url: string | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSearch = async (query: string) => {
    setSearch(query);
    if (query.length < 2) {
      setUsers([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .ilike("full_name", `%${query}%`)
      .neq("user_id", user?.id ?? "")
      .limit(10);
    setUsers(data ?? []);
    setLoading(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <Users className="w-4 h-4 ml-1" />
          محادثة جديدة
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>محادثة جديدة</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن مستخدم..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pr-10"
            />
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {loading && <Loader2 className="w-5 h-5 animate-spin mx-auto" />}
            {users.map((u) => (
              <button
                key={u.user_id}
                className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-secondary transition-colors"
                onClick={() => onSelect(u.user_id)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={u.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {u.full_name?.[0] ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{u.full_name ?? "مستخدم"}</span>
              </button>
            ))}
            {search.length >= 2 && !loading && users.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">لا توجد نتائج</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ChatView({
  conversation,
  onBack,
}: {
  conversation: Conversation;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const { messages, loading } = useChatMessages(conversation.id);
  const { sendMessage, markAsRead } = useMessages();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    markAsRead(conversation.id);
  }, [conversation.id, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    await sendMessage(conversation.id, input.trim());
    setInput("");
    setSending(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
          <ArrowRight className="w-5 h-5" />
        </Button>
        <Avatar className="h-10 w-10">
          <AvatarImage src={conversation.other_user?.avatar_url ?? undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {conversation.other_user?.full_name?.[0] ?? "U"}
          </AvatarFallback>
        </Avatar>
        <span className="font-bold text-foreground">
          {conversation.other_user?.full_name ?? "مستخدم"}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>ابدأ المحادثة الآن!</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isMine = msg.sender_id === user?.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMine ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                      isMine
                        ? "bg-primary text-primary-foreground rounded-bl-sm"
                        : "bg-secondary text-secondary-foreground rounded-br-sm"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <span className={`text-[10px] mt-1 block ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(msg.created_at).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب رسالة..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || sending}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function Messages() {
  const { conversations, loading, getOrCreateConversation, refetch } = useMessages();
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

  const handleSelectUser = async (userId: string) => {
    const convId = await getOrCreateConversation(userId);
    if (!convId) return;
    await refetch();
    const conv = conversations.find((c) => c.id === convId);
    if (conv) {
      setActiveConversation(conv);
    } else {
      // Refetch needed, set after
      setTimeout(async () => {
        await refetch();
      }, 500);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "أمس";
    return d.toLocaleDateString("ar");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-8 container mx-auto px-4">
        <div className="bg-card rounded-2xl border border-border overflow-hidden" style={{ height: "calc(100vh - 10rem)" }}>
          <div className="flex h-full">
            {/* Sidebar */}
            <div
              className={`w-full md:w-80 border-l border-border flex flex-col ${
                activeConversation ? "hidden md:flex" : "flex"
              }`}
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="font-bold text-lg text-foreground">الرسائل</h2>
                <NewConversationDialog onSelect={handleSelectUser} />
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center text-muted-foreground py-10">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>لا توجد محادثات بعد</p>
                    <p className="text-xs mt-1">ابدأ محادثة جديدة مع أي مستخدم</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConversation(conv)}
                      className={`w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors border-b border-border/50 ${
                        activeConversation?.id === conv.id ? "bg-secondary" : ""
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conv.other_user?.avatar_url ?? undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {conv.other_user?.full_name?.[0] ?? "U"}
                          </AvatarFallback>
                        </Avatar>
                        {(conv.unread_count ?? 0) > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-foreground truncate">
                            {conv.other_user?.full_name ?? "مستخدم"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatTime(conv.last_message_at)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {conv.last_message ?? "لا توجد رسائل"}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat area */}
            <div
              className={`flex-1 flex flex-col ${
                !activeConversation ? "hidden md:flex" : "flex"
              }`}
            >
              {activeConversation ? (
                <ChatView
                  conversation={activeConversation}
                  onBack={() => setActiveConversation(null)}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">اختر محادثة للبدء</p>
                    <p className="text-sm mt-1">أو ابدأ محادثة جديدة</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
