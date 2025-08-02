import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Shield, Activity, Database, FileText, Users, Settings } from 'lucide-react';

export function AuditLoggingSummary() {
  const auditFeatures = [
    {
      category: 'Authentication & Security',
      icon: <Shield className="h-5 w-5" />,
      actions: [
        'Admin login/logout tracking',
        'Failed login attempts',
        'Security settings changes',
        'Role assignments',
        'Access control modifications'
      ]
    },
    {
      category: 'User Management',
      icon: <Users className="h-5 w-5" />,
      actions: [
        'User data access logging',
        'Role changes and assignments',
        'User account modifications',
        'Bulk user operations',
        'Premium status changes'
      ]
    },
    {
      category: 'Content Management',
      icon: <FileText className="h-5 w-5" />,
      actions: [
        'Blog post creation/editing',
        'Content moderation actions',
        'Bulk content operations',
        'Content export/import',
        'Publishing status changes'
      ]
    },
    {
      category: 'System Operations',
      icon: <Settings className="h-5 w-5" />,
      actions: [
        'Dashboard access tracking',
        'Metrics viewing/refreshing',
        'Data export operations',
        'Configuration changes',
        'Cache clearing operations'
      ]
    },
    {
      category: 'Database & API',
      icon: <Database className="h-5 w-5" />,
      actions: [
        'Database query logging',
        'API key management',
        'Environment variable changes',
        'Backup operations',
        'Data synchronization'
      ]
    }
  ];

  const loggedComponents = [
    'StreamlinedAdminDashboard - Dashboard access, metrics refresh',
    'SecurityDashboard - Security actions, role assignments',
    'AdminBlogManager - Content management, exports, cleanup',
    'SimplifiedUserManagement - User data access, statistics',
    'AdminActivityMonitor - Real-time activity monitoring'
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-green-600" />
            Admin Audit Logging Configuration
            <Badge variant="default" className="ml-auto">Active</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Comprehensive audit logging system activated</span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Audit Coverage by Category</h4>
                <div className="space-y-3">
                  {auditFeatures.map((feature, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        {feature.icon}
                        <span className="font-medium">{feature.category}</span>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {feature.actions.length} actions
                        </Badge>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {feature.actions.map((action, actionIndex) => (
                          <li key={actionIndex} className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-primary rounded-full" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Instrumented Components</h4>
                <div className="space-y-2">
                  {loggedComponents.map((component, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{component}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Key Features
                  </h5>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Real-time activity monitoring with auto-refresh</li>
                    <li>• Comprehensive filtering and search capabilities</li>
                    <li>• CSV export functionality for compliance</li>
                    <li>• Success/failure tracking for all operations</li>
                    <li>• IP address and user agent logging</li>
                    <li>• Detailed context and error message capture</li>
                  </ul>
                </div>
                
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h5 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    Data Storage
                  </h5>
                  <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                    <li>• All logs stored in Supabase security_audit_log table</li>
                    <li>• Automatic timestamp and admin identification</li>
                    <li>• Structured JSON details for complex operations</li>
                    <li>• Optimized queries with proper indexing</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
