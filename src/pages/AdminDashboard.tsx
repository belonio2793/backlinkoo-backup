import { Footer } from "@/components/Footer";
import { OrganizedAdminDashboard } from "@/components/admin/OrganizedAdminDashboardFixed";
import { QuickLoginHelper } from "@/components/QuickLoginHelper";

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <QuickLoginHelper />
        </div>
        <OrganizedAdminDashboard />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AdminDashboard;
