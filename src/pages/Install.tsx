import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Smartphone, Zap, WifiOff, Bell, Share2, MoreVertical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { usePWA } from '@/hooks/usePWA';
import wekicodeLogo from '@/assets/wekicode-logo-new.png';

export default function Install() {
  const { canInstall, installApp, isInstalled } = usePWA();

  const features = [
    {
      icon: Zap,
      title: 'سرعة فائقة',
      description: 'تحميل سريع وأداء ممتاز'
    },
    {
      icon: WifiOff,
      title: 'العمل بدون إنترنت',
      description: 'تصفح المحتوى حتى بدون اتصال'
    },
    {
      icon: Bell,
      title: 'إشعارات فورية',
      description: 'تلقي التحديثات والرسائل مباشرة'
    },
    {
      icon: Smartphone,
      title: 'تجربة أصلية',
      description: 'مثل التطبيقات الأصلية تماماً'
    }
  ];

  const iosSteps = [
    { icon: Share2, text: 'اضغط على زر المشاركة في Safari' },
    { icon: Plus, text: 'اختر "إضافة إلى الشاشة الرئيسية"' },
    { icon: Download, text: 'اضغط "إضافة" للتثبيت' }
  ];

  const androidSteps = [
    { icon: MoreVertical, text: 'اضغط على القائمة (ثلاث نقاط) في Chrome' },
    { icon: Download, text: 'اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"' },
    { icon: Smartphone, text: 'اضغط "تثبيت" للتأكيد' }
  ];

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-3xl bg-gradient-primary p-1 shadow-glow">
                <img 
                  src={wekicodeLogo} 
                  alt="wekicode" 
                  className="w-full h-full object-contain rounded-3xl bg-background p-2"
                />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              ثبّت <span className="text-gradient-primary">wekicode</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8">
              احصل على تجربة أفضل مع تطبيق wekicode المثبت على جهازك
            </p>

            {isInstalled ? (
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-success/20 text-success">
                <Download className="w-5 h-5" />
                <span className="font-medium">التطبيق مثبت بالفعل!</span>
              </div>
            ) : canInstall ? (
              <Button 
                onClick={installApp} 
                size="lg" 
                className="bg-gradient-primary shadow-glow text-lg px-8"
              >
                <Download className="w-5 h-5" />
                تثبيت التطبيق الآن
              </Button>
            ) : (
              <p className="text-muted-foreground">
                اتبع الخطوات أدناه لتثبيت التطبيق على جهازك
              </p>
            )}
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
          >
            {features.map((feature, index) => (
              <div 
                key={index}
                className="glass rounded-2xl p-6 text-center hover-lift"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </motion.div>

          {/* Installation Steps */}
          {!isInstalled && !canInstall && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-xl mx-auto"
            >
              <h2 className="text-2xl font-bold text-center mb-8">
                كيفية التثبيت على {isIOS ? 'iPhone/iPad' : 'Android'}
              </h2>

              <div className="space-y-4">
                {(isIOS ? iosSteps : androidSteps).map((step, index) => (
                  <div 
                    key={index}
                    className="glass rounded-xl p-4 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="font-bold text-primary">{index + 1}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <step.icon className="w-5 h-5 text-muted-foreground shrink-0" />
                      <p className="text-foreground">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Switch Device Type */}
              <p className="text-center text-sm text-muted-foreground mt-6">
                تستخدم {isIOS ? 'Android' : 'iPhone'}؟{' '}
                <button 
                  onClick={() => window.location.reload()}
                  className="text-primary hover:underline"
                >
                  اعرض التعليمات المناسبة
                </button>
              </p>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
