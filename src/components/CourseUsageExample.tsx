import { CompleteCourseExperience } from './CompleteCourseExperience';
import { StreamlinedPremiumProvider } from './StreamlinedPremiumProvider';

export function CourseUsageExample() {
  return (
    <StreamlinedPremiumProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">SEO Academy</h1>
            <p className="text-lg text-gray-600">
              Master search engine optimization with our comprehensive course
            </p>
          </div>
          
          <CompleteCourseExperience />
        </div>
      </div>
    </StreamlinedPremiumProvider>
  );
}

export default CourseUsageExample;
