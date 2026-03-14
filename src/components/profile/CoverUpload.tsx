import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Camera, Loader2 } from "lucide-react";

interface CoverUploadProps {
  coverUrl: string | null;
}

export function CoverUpload({ coverUrl }: CoverUploadProps) {
  const { user, refreshProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "يرجى اختيار صورة صالحة", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "حجم الصورة يجب أن يكون أقل من 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/cover.${ext}`;

      await supabase.storage.from("covers").remove([filePath]);

      const { error: uploadError } = await supabase.storage
        .from("covers")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("covers")
        .getPublicUrl(filePath);

      const url = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase.rpc("update_profile_info", {
        p_cover_url: url,
      } as any);

      if (updateError) throw updateError;

      await refreshProfile();
      toast({ title: "تم تحديث صورة الغلاف بنجاح ✅" });
    } catch (err: any) {
      toast({ title: "فشل رفع الصورة", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative w-full h-48 md:h-64 rounded-t-3xl overflow-hidden group">
      {coverUrl ? (
        <img src={coverUrl} alt="غلاف" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/20 via-background to-accent/20" />
      )}
      
      {/* Overlay effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      {user && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute top-4 left-4 px-4 py-2 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 text-sm font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 hover:bg-card"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            {uploading ? "جاري الرفع..." : "تغيير الغلاف"}
          </button>
        </>
      )}
    </div>
  );
}
