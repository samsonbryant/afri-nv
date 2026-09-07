import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { GuideProvider } from "@/features/guides/components/guide-provider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <GuideProvider>
        <div className="bg-background flex min-h-screen">
          <Sidebar />
          <MobileNav />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <main data-guide="module-root" className="flex-1 px-4 py-6 md:px-6 md:py-8">
              {children}
            </main>
          </div>
        </div>
      </GuideProvider>
    </AuthGuard>
  );
}
