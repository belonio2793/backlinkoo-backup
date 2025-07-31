import { UserBlogDashboard } from './UserBlogDashboard';

export function TrialBlogTab() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-2">
          📝 Blog Post Management
        </h2>
        <p className="text-blue-800 text-sm">
          Create, claim, and manage your blog posts with natural backlinks. 
          You can claim up to 3 posts permanently, while unclaimed posts expire after 24 hours.
        </p>
      </div>
      
      <UserBlogDashboard />
    </div>
  );
}
