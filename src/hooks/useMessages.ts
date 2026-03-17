import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  created_at: string;
  other_user?: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  last_message?: string;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export function useMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    
    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    if (!convos) return;

    const enriched = await Promise.all(
      convos.map(async (c) => {
        const otherId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;
        
        const [profileRes, lastMsgRes, unreadRes] = await Promise.all([
          supabase.from("profiles").select("user_id, full_name, avatar_url").eq("user_id", otherId).single(),
          supabase.from("messages").select("content").eq("conversation_id", c.id).order("created_at", { ascending: false }).limit(1).single(),
          supabase.from("messages").select("id", { count: "exact", head: true }).eq("conversation_id", c.id).eq("is_read", false).neq("sender_id", user.id),
        ]);

        return {
          ...c,
          other_user: profileRes.data ?? { user_id: otherId, full_name: null, avatar_url: null },
          last_message: lastMsgRes.data?.content,
          unread_count: unreadRes.count ?? 0,
        } as Conversation;
      })
    );

    setConversations(enriched);
    setTotalUnread(enriched.reduce((sum, c) => sum + (c.unread_count ?? 0), 0));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          fetchConversations();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  const sendMessage = async (conversationId: string, content: string) => {
    if (!user) return;
    
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
    });

    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);
  };

  const markAsRead = async (conversationId: string) => {
    if (!user) return;
    
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id)
      .eq("is_read", false);
  };

  const getOrCreateConversation = async (otherUserId: string): Promise<string | null> => {
    if (!user) return null;

    // Check existing
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .or(
        `and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`
      )
      .single();

    if (existing) return existing.id;

    // Create new
    const { data: created } = await supabase
      .from("conversations")
      .insert({ participant_1: user.id, participant_2: otherUserId })
      .select("id")
      .single();

    return created?.id ?? null;
  };

  return {
    conversations,
    totalUnread,
    loading,
    sendMessage,
    markAsRead,
    getOrCreateConversation,
    refetch: fetchConversations,
  };
}

export function useChatMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    setMessages((data as Message[]) ?? []);
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return { messages, loading, refetch: fetchMessages };
}
