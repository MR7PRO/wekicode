import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ImagePlus, Loader2, X } from "lucide-react";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
}

export function PostImageUploader({ value, onChange, folder = "posts" }: Props) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!user) return;
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "الصورة كبيرة جداً", description: "الحد الأقصى 20 ميغابايت", variant: "destructive" });
      return;
    }
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const imageExtensions = new Set(["jpg", "jpeg", "png", "gif", "webp", "avif", "bmp", "svg", "heic", "heif", "tif", "tiff"]);
    const looksLikeImage = file.type.startsWith("image/") || imageExtensions.has(ext);
    if (!looksLikeImage) {
      toast({ title: "نوع الملف غير مدعوم", description: "يرجى رفع صورة", variant: "destructive" });
      return;
    }
    setUploading(true);
    // Path starts with uid to satisfy storage rules, and keeps question/article images separated.
    const safeFolder = ["posts", "questions", "articles"].includes(folder) ? folder : "posts";
    const path = `${user.id}/${safeFolder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: false, contentType: file.type || `image/${ext}` });
    if (error) {
      toast({ title: "فشل رفع الصورة", description: error.message, variant: "destructive" });
    } else {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      onChange(data.publicUrl);
      toast({ title: "تم رفع الصورة", description: "يمكنك الآن نشرها مع المحتوى" });
    }
    if (inputRef.current) inputRef.current.value = "";
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-border">
          <img src={value} alt="مرفق" className="w-full max-h-64 object-cover" />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute top-2 left-2 h-8 w-8"
            onClick={() => onChange(null)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || !user}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
          <span className="mr-2">{uploading ? "جاري الرفع..." : "إضافة صورة (اختياري)"}</span>
        </Button>
      )}
    </div>
  );
}