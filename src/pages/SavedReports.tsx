import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SavedBacklinkReports } from '@/components/SavedBacklinkReports';

export default function SavedReports() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white text-gray-900">
      <Header />
      
      {/* Page Header */}
      <div className="border-b border-gray-200 bg-white shadow-sm p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Reports</h1>
          <p className="text-gray-600 text-lg">
            View and manage your saved backlink verification reports
          </p>
        </div>
      </div>

      <div className="py-8">
        <SavedBacklinkReports />
      </div>

      <Footer />
    </div>
  );
}
