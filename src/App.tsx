import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/components/notifications/NotificationSystem";
import ProtectedRoute from "@/components/ProtectedRoute";
import { PrivateRouteNoIndex } from "@/components/seo/PrivateRouteNoIndex";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Questions = lazy(() => import("./pages/Questions"));
const QuestionDetail = lazy(() => import("./pages/QuestionDetail"));
const Jobs = lazy(() => import("./pages/Jobs"));
const Courses = lazy(() => import("./pages/Courses"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Rewards = lazy(() => import("./pages/Rewards"));
const Profile = lazy(() => import("./pages/Profile"));
const Billing = lazy(() => import("./pages/Billing"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Auth = lazy(() => import("./pages/Auth"));
const Install = lazy(() => import("./pages/Install"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const Settings = lazy(() => import("./pages/Settings"));
const Messages = lazy(() => import("./pages/Messages"));
const Articles = lazy(() => import("./pages/Articles"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const Bookmarks = lazy(() => import("./pages/Bookmarks"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Developers = lazy(() => import("./pages/Developers"));
const Forums = lazy(() => import("./pages/Forums"));
const ForumDetail = lazy(() => import("./pages/ForumDetail"));
const TopicDetail = lazy(() => import("./pages/TopicDetail"));
const NewTopic = lazy(() => import("./pages/NewTopic"));
const Moderation = lazy(() => import("./pages/Moderation"));
const ForumNotifications = lazy(() => import("./pages/ForumNotifications"));
const KnowledgeArticle = lazy(() => import("./pages/KnowledgeArticle"));
const TagPage = lazy(() => import("./pages/TagPage"));
const AIChatBot = lazy(() => import("./components/ai/AIChatBot").then(m => ({ default: m.AIChatBot })));
const InstallPrompt = lazy(() => import("./components/pwa/InstallPrompt").then(m => ({ default: m.InstallPrompt })));
const AppUpdatePrompt = lazy(() => import("./components/pwa/AppUpdatePrompt").then(m => ({ default: m.AppUpdatePrompt })));
const NetworkStatusBanner = lazy(() => import("./components/pwa/NetworkStatusBanner").then(m => ({ default: m.NetworkStatusBanner })));
const OfflineLibrary = lazy(() => import("./pages/OfflineLibrary"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const AppSettings = lazy(() => import("./pages/AppSettings"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Achievements = lazy(() => import("./pages/Achievements"));
const AdminInsights = lazy(() => import("./pages/AdminInsights"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const MarketplaceDashboard = lazy(() => import("./pages/marketplace/MarketplaceDashboard"));
const ServiceDetail = lazy(() => import("./pages/marketplace/ServiceDetail"));
const ServiceEditor = lazy(() => import("./pages/marketplace/ServiceEditor"));
const Projects = lazy(() => import("./pages/marketplace/Projects"));
const NewProject = lazy(() => import("./pages/marketplace/NewProject"));
const ProjectDetail = lazy(() => import("./pages/marketplace/ProjectDetail"));
const HelpCenter = lazy(() => import("./pages/trust/HelpCenter"));
const HelpArticlePage = lazy(() => import("./pages/trust/HelpArticlePage"));
const LegalCenter = lazy(() => import("./pages/trust/LegalCenter"));
const LegalDocumentPage = lazy(() => import("./pages/trust/LegalDocumentPage"));
const SupportTickets = lazy(() => import("./pages/trust/SupportTickets"));
const NewSupportTicket = lazy(() => import("./pages/trust/NewSupportTicket"));
const SupportTicketDetail = lazy(() => import("./pages/trust/SupportTicketDetail"));
const VerificationSettings = lazy(() => import("./pages/trust/VerificationSettings"));
const ProfessionalVerification = lazy(() => import("./pages/trust/ProfessionalVerification"));
const SecuritySettings = lazy(() => import("./pages/trust/SecuritySettings"));
const PrivacySettings = lazy(() => import("./pages/trust/PrivacySettings"));
const Appeals = lazy(() => import("./pages/trust/Appeals"));
const TrustSafetyAdmin = lazy(() => import("./pages/trust/TrustSafetyAdmin"));

// Optimized QueryClient with caching settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <PrivateRouteNoIndex />
            <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/install" element={<Install />} />
                <Route path="/questions" element={<Questions />} />
                <Route path="/questions/:id" element={<QuestionDetail />} />
                <Route path="/u/:userId" element={<PublicProfile />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/courses/:id" element={<CourseDetail />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/articles" element={<Articles />} />
                <Route path="/articles/:id" element={<ArticleDetail />} />
                <Route path="/developers" element={<Developers />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/marketplace/services/:id" element={<ServiceDetail />} />
                <Route path="/marketplace/projects" element={<Projects />} />
                <Route path="/help" element={<HelpCenter />} />
                <Route path="/help/:slug" element={<HelpArticlePage />} />
                <Route path="/legal" element={<LegalCenter />} />
                <Route path="/legal/:key" element={<LegalDocumentPage />} />
                <Route path="/forums" element={<Forums />} />
                <Route path="/forums/new" element={<NewTopic />} />
                <Route path="/forums/:forumSlug" element={<ForumDetail />} />
                <Route path="/forums/:forumSlug/:topicSlugOrId" element={<TopicDetail />} />
                <Route path="/knowledge/:id" element={<KnowledgeArticle />} />
                <Route path="/tags/:tagSlug" element={<TagPage />} />
                <Route path="/achievements" element={<Achievements />} />
                <Route path="/saved-offline" element={<OfflineLibrary />} />
                {/* Protected Routes - require authentication */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/admin/insights" element={<AdminInsights />} />
                  <Route path="/admin/trust-safety" element={<TrustSafetyAdmin />} />
                  <Route path="/marketplace/dashboard" element={<MarketplaceDashboard />} />
                  <Route path="/marketplace/services/new" element={<ServiceEditor />} />
                  <Route path="/marketplace/services/:id/edit" element={<ServiceEditor />} />
                  <Route path="/marketplace/projects/new" element={<NewProject />} />
                  <Route path="/marketplace/projects/:id" element={<ProjectDetail />} />
                  <Route path="/support" element={<SupportTickets />} />
                  <Route path="/support/new" element={<NewSupportTicket />} />
                  <Route path="/support/:id" element={<SupportTicketDetail />} />
                  <Route path="/settings/verification" element={<VerificationSettings />} />
                  <Route path="/settings/security" element={<SecuritySettings />} />
                  <Route path="/settings/privacy" element={<PrivacySettings />} />
                  <Route path="/verification/professional" element={<ProfessionalVerification />} />
                  <Route path="/appeals" element={<Appeals />} />
                  <Route path="/rewards" element={<Rewards />} />
                  <Route path="/billing" element={<Billing />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/settings/notifications" element={<NotificationSettings />} />
                  <Route path="/settings/app" element={<AppSettings />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/bookmarks" element={<Bookmarks />} />
                  <Route path="/notifications" element={<ForumNotifications />} />
                  <Route path="/moderation" element={<Moderation />} />
                </Route>
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <AIChatBot />
              <InstallPrompt />
              <AppUpdatePrompt />
              <NetworkStatusBanner />
            </Suspense>
            </ErrorBoundary>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
