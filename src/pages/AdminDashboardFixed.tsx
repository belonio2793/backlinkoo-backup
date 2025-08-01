import { Footer } from "@/components/Footer";
import { OrganizedAdminDashboard } from "@/components/admin/OrganizedAdminDashboardFixed";

const AdminDashboard = () => {

  return (
    <div className="min-h-screen bg-background">

      <div className="container mx-auto px-4 py-8">
        <OrganizedAdminDashboard />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AdminDashboard;
