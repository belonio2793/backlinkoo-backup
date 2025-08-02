import { AuthCheck } from "@/components/AuthCheck";
import { Footer } from "@/components/Footer";
import { OrganizedAdminDashboard } from "@/components/admin/OrganizedAdminDashboardFixed";

const WorkingAdminDashboard = () => {
  return (
    <AuthCheck requireAdmin={true}>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <OrganizedAdminDashboard />
        </div>
        
        {/* Footer */}
        <Footer />
      </div>
    </AuthCheck>
  );
};

export default WorkingAdminDashboard;
