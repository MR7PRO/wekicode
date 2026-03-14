import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Edit, Save, Github, Linkedin, Twitter, Globe, MapPin, X, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileData {
  full_name: string;
  bio: string;
  skills: string[];
  location: string;
  website_url: string;
  github_url: string;
  linkedin_url: string;
  twitter_url: string;
  is_public: boolean;
}

export function EditProfileDialog() {
  const { profile, refreshProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [formData, setFormData] = useState<ProfileData>({
    full_name: "",
    bio: "",
    skills: [],
    location: "",
    website_url: "",
    github_url: "",
    linkedin_url: "",
    twitter_url: "",
    is_public: true,
  });

  useEffect(() => {
    if (open && profile) {
      setFormData({
        full_name: (profile as any).full_name || "",
        bio: (profile as any).bio || "",
        skills: (profile as any).skills || [],
        location: (profile as any).location || "",
        website_url: (profile as any).website_url || "",
        github_url: (profile as any).github_url || "",
        linkedin_url: (profile as any).linkedin_url || "",
        twitter_url: (profile as any).twitter_url || "",
        is_public: (profile as any).is_public ?? true,
      });
    }
  }, [open, profile]);

  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !formData.skills.includes(trimmed) && formData.skills.length < 15) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, trimmed] }));
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      toast({ title: "الاسم مطلوب", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.rpc("update_profile_info", {
        p_full_name: formData.full_name.trim(),
        p_bio: formData.bio.trim() || null,
        p_skills: formData.skills.length > 0 ? formData.skills : null,
        p_location: formData.location.trim() || null,
        p_website_url: formData.website_url.trim() || null,
        p_github_url: formData.github_url.trim() || null,
        p_linkedin_url: formData.linkedin_url.trim() || null,
        p_twitter_url: formData.twitter_url.trim() || null,
        p_is_public: formData.is_public,
      } as any);

      if (error) throw error;
      await refreshProfile();
      toast({ title: "تم تحديث الملف الشخصي بنجاح ✅" });
      setOpen(false);
    } catch (err: any) {
      toast({ title: "فشل التحديث", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero" className="shadow-glow">
          <Edit className="w-4 h-4" />
          تعديل الملف الشخصي
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">تعديل الملف الشخصي</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label className="text-foreground">الاسم الكامل *</Label>
            <Input
              value={formData.full_name}
              onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="أدخل اسمك"
              maxLength={100}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label className="text-foreground">نبذة عنك</Label>
            <Textarea
              value={formData.bio}
              onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="اكتب نبذة مختصرة..."
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">{formData.bio.length}/500</p>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4" /> الموقع
            </Label>
            <Input
              value={formData.location}
              onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="غزة، فلسطين"
              maxLength={100}
            />
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label className="text-foreground">المهارات ({formData.skills.length}/15)</Label>
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                placeholder="أضف مهارة..."
                maxLength={30}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
              />
              <Button type="button" variant="outline" size="icon" onClick={addSkill}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills.map(skill => (
                <span key={skill} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm flex items-center gap-1.5">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <Label className="text-foreground text-base font-bold">الروابط الاجتماعية</Label>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                <Input
                  value={formData.website_url}
                  onChange={e => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                  placeholder="https://yoursite.com"
                  maxLength={200}
                />
              </div>
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4 text-muted-foreground shrink-0" />
                <Input
                  value={formData.github_url}
                  onChange={e => setFormData(prev => ({ ...prev, github_url: e.target.value }))}
                  placeholder="اسم المستخدم في GitHub"
                  maxLength={100}
                />
              </div>
              <div className="flex items-center gap-2">
                <Linkedin className="w-4 h-4 text-muted-foreground shrink-0" />
                <Input
                  value={formData.linkedin_url}
                  onChange={e => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                  placeholder="اسم المستخدم في LinkedIn"
                  maxLength={100}
                />
              </div>
              <div className="flex items-center gap-2">
                <Twitter className="w-4 h-4 text-muted-foreground shrink-0" />
                <Input
                  value={formData.twitter_url}
                  onChange={e => setFormData(prev => ({ ...prev, twitter_url: e.target.value }))}
                  placeholder="اسم المستخدم في X/Twitter"
                  maxLength={100}
                />
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
            <div>
              <Label className="text-foreground font-bold">ملف شخصي عام</Label>
              <p className="text-sm text-muted-foreground">السماح لأي شخص بمشاهدة ملفك الشخصي</p>
            </div>
            <Switch
              checked={formData.is_public}
              onCheckedChange={checked => setFormData(prev => ({ ...prev, is_public: checked }))}
            />
          </div>

          {/* Save */}
          <Button onClick={handleSave} disabled={saving} className="w-full" variant="hero">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
