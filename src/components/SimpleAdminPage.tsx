import AdminDashboard from '@/pages/AdminDashboard';

export function SimpleAdminPage() {
  // Skip all authentication - go directly to admin dashboard
  console.log('🚀 Direct admin access - bypassing authentication');
  return <AdminDashboard />;
}

export default SimpleAdminPage;
