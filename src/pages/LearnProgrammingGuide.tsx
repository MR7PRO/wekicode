import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const steps = [
  {
    title: "ابدأ بلغة سهلة: Python",
    text: "Python لغة واضحة وقريبة من اللغة الطبيعية، ومناسبة لفهم المتغيرات والشروط والحلقات والدوال قبل أي شيء آخر.",
    courses: [{ id: "c2222222-2222-2222-2222-222222222222", title: "أساسيات Python للمبتدئين" }],
  },
  {
    title: "احفظ عملك وتعاون مع غيرك: Git و GitHub",
    text: "من أول مشروع، تعلّم حفظ نسخ من الكود ومشاركته. هذه مهارة يطلبها أي فريق برمجة.",
    courses: [{ id: "c3333333-3333-3333-3333-333333333333", title: "دليل Git و GitHub للمطورين" }],
  },
  {
    title: "اختر مسارك",
    text: "بعد الأساسيات اختر مجالاً واحداً وركّز عليه: تطوير الويب، تطبيقات الموبايل، أو الذكاء الاصطناعي.",
    courses: [
      { id: "c1111111-1111-1111-1111-111111111111", title: "دورة React.js الشاملة (واجهات الويب)" },
      { id: "c7777777-7777-7777-7777-777777777777", title: "تطوير تطبيقات Flutter للموبايل" },
      { id: "c8888888-8888-8888-8888-888888888888", title: "أساسيات الذكاء الاصطناعي مع Python" },
    ],
  },
  {
    title: "تعمّق في الخادم والنشر",
    text: "عندما تتقن مسارك، تعلّم بناء الخوادم ونشر تطبيقاتك لتصبح مطوراً متكاملاً.",
    courses: [
      { id: "c5555555-5555-5555-5555-555555555555", title: "Node.js و Express.js للباك إند" },
      { id: "c6666666-6666-6666-6666-666666666666", title: "مقدمة في Docker و الحاويات" },
    ],
  },
  {
    title: "طبّق واسأل واختبر نفسك",
    text: "ابنِ مشاريع صغيرة، واطرح أسئلتك في المجتمع، وحلّ اختبار \"اختبر نفسك\" في نهاية كل دورة لتتأكد من فهمك.",
    courses: [],
  },
];

export default function LearnProgrammingGuide() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <SEOHead
        title="تعلم البرمجة باللغة العربية — دليل المبتدئين خطوة بخطوة | wekicode"
        description="دليل عملي لتعلم البرمجة باللغة العربية من الصفر: بأي لغة تبدأ، وكيف تختار مسارك، وأي دورات مجانية على wekicode تناسب كل مرحلة."
        path="/learn-programming"
        type="article"
      />
      <main className="pt-24 pb-16">
        <article className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">تعلم البرمجة باللغة العربية: دليل المبتدئين خطوة بخطوة</h1>
          <p className="text-muted-foreground text-lg mb-8">
            إذا كنت تبدأ من الصفر، فالأهم هو ترتيب ما تتعلمه. هذا تسلسل عملي مبني على الدورات العربية المتاحة على wekicode.
          </p>
          <ol className="space-y-6">
            {steps.map((s, i) => (
              <li key={s.title}>
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-2">{i + 1}. {s.title}</h2>
                    <p className="text-muted-foreground mb-3">{s.text}</p>
                    {s.courses.length > 0 && (
                      <ul className="space-y-1">
                        {s.courses.map((c) => (
                          <li key={c.id}>
                            <Link to={`/courses/${c.id}`} className="text-primary font-semibold hover:underline">← {c.title}</Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-3 mt-10">
            <Button asChild><Link to="/courses">تصفّح كل الدورات</Link></Button>
            <Button asChild variant="outline"><Link to="/questions">اطرح سؤالاً</Link></Button>
          </div>
        </article>
      </main>
    </div>
  );
}
