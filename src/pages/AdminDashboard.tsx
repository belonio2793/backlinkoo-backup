import { useState } from "react";
import { Footer } from "@/components/Footer";
import { OrganizedAdminDashboard } from "@/components/admin/OrganizedAdminDashboard";

const AdminDashboard = () => {
  const [paymentSettings] = useState({
    stripe: true,
    paypal: true,
    wise: false
  });

  const [completionUrls, setCompletionUrls] = useState("");

  const activeCampaigns = [
    {
      id: "BL-003",
      userId: "user-123",
      userEmail: "john@example.com",
      targetUrl: "newsite.com",
      keywords: "web development, React, TypeScript",
      requestedLinks: 8,
      createdAt: "2024-01-16",
      status: "pending"
    },
    {
      id: "BL-004",
      userId: "user-456",
      userEmail: "sarah@company.com",
      targetUrl: "ecommerce-store.com",
      keywords: "online shopping, products",
      requestedLinks: 12,
      createdAt: "2024-01-16",
      status: "pending"
    },
    {
      id: "BL-005",
      userId: "user-789",
      userEmail: "mike@startup.io",
      targetUrl: "tech-blog.com",
      keywords: "AI, machine learning, tech",
      requestedLinks: 6,
      createdAt: "2024-01-15",
      status: "in_progress"
    }
  ];

  const handleCompleteOrder = (campaignId: string) => {
    // TODO: Implement order completion logic with Supabase
    console.log(`Completing order ${campaignId} with URLs:`, completionUrls);
    setCompletionUrls("");
  };

  const stats = {
    pendingOrders: activeCampaigns.filter(c => c.status === "pending").length,
    inProgress: activeCampaigns.filter(c => c.status === "in_progress").length,
    totalUsers: 247,
    monthlyRevenue: 8420
  };

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
