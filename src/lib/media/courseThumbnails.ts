import c111 from "@/assets/course-thumbs/c1111111-1111-1111-1111-111111111111.jpg";
import c222 from "@/assets/course-thumbs/c2222222-2222-2222-2222-222222222222.jpg";
import c333 from "@/assets/course-thumbs/c3333333-3333-3333-3333-333333333333.jpg";
import c444 from "@/assets/course-thumbs/c4444444-4444-4444-4444-444444444444.jpg";
import c555 from "@/assets/course-thumbs/c5555555-5555-5555-5555-555555555555.jpg";
import c666 from "@/assets/course-thumbs/c6666666-6666-6666-6666-666666666666.jpg";
import c777 from "@/assets/course-thumbs/c7777777-7777-7777-7777-777777777777.jpg";
import c888 from "@/assets/course-thumbs/c8888888-8888-8888-8888-888888888888.jpg";
import c999 from "@/assets/course-thumbs/c9999999-9999-9999-9999-999999999999.jpg";

// Seeded course thumbnails (bundled) to ensure perfect consistency across Netlify/PWA/etc.
const SEEDED_THUMBNAILS: Record<string, string> = {
  "c1111111-1111-1111-1111-111111111111": c111,
  "c2222222-2222-2222-2222-222222222222": c222,
  "c3333333-3333-3333-3333-333333333333": c333,
  "c4444444-4444-4444-4444-444444444444": c444,
  "c5555555-5555-5555-5555-555555555555": c555,
  "c6666666-6666-6666-6666-666666666666": c666,
  "c7777777-7777-7777-7777-777777777777": c777,
  "c8888888-8888-8888-8888-888888888888": c888,
  "c9999999-9999-9999-9999-999999999999": c999,
};

export const getCourseThumbnailById = (courseId?: string | null) => {
  if (!courseId) return undefined;
  return SEEDED_THUMBNAILS[courseId];
};
