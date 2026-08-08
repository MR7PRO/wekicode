import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useFollowedForums, useFollowedTags } from "@/hooks/useForumFollows";
import { useNavigate } from "react-router-dom";

interface Props {
  kind: "forum" | "tag";
  id: string;
  size?: "sm" | "default";
  className?: string;
}

export function FollowButton({ kind, id, size = "sm", className }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const forums = useFollowedForums();
  const tags = useFollowedTags();

  const source = kind === "forum" ? forums : tags;
  const following = source.isFollowing(id);
  const label = kind === "forum" ? "متابعة" : "متابعة الوسم";

  if (!user) {
    return (
      <Button size={size} variant="outline" className={className} onClick={() => navigate("/auth")}>
        <Bell className="w-4 h-4 ml-1" /> {label}
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant={following ? "secondary" : "outline"}
      className={className}
      disabled={source.loading}
      onClick={() => void source.toggle(id)}
    >
      {source.loading ? <Loader2 className="w-4 h-4 animate-spin ml-1" />
        : following ? <BellOff className="w-4 h-4 ml-1" />
        : <Bell className="w-4 h-4 ml-1" />}
      {following ? "تتابعه" : label}
    </Button>
  );
}