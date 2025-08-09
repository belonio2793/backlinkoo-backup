import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Users, DollarSign, TrendingUp, UserCheck } from 'lucide-react';

interface ReferredUsersSimpleProps {
  affiliateId: string;
  affiliateCode: string;
}

export const ReferredUsersSimple: React.FC<ReferredUsersSimpleProps> = ({ 
  affiliateId, 
  affiliateCode 
}) => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">5</p>
                <p className="text-xs text-muted-foreground">Total Referred</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-xs text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">$201.35</p>
                <p className="text-xs text-muted-foreground">Total Commissions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">60%</p>
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Referred Users Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Referred Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Sample referred users */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">john.doe@example.com</div>
                  <div className="text-sm text-gray-600">John Doe</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">Converted</Badge>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">Premium</Badge>
                  <span className="text-green-600 font-medium">$59.80</span>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">jane.smith@example.com</div>
                  <div className="text-sm text-gray-600">Jane Smith</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                  <Badge variant="outline" className="bg-green-100 text-green-800">Monthly</Badge>
                  <span className="text-green-600 font-medium">$7.25</span>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">mike.johnson@example.com</div>
                  <div className="text-sm text-gray-600">Mike Johnson</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                  <Badge variant="outline" className="bg-gray-100 text-gray-800">Free</Badge>
                  <span className="text-gray-500 font-medium">$0.00</span>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">sarah.wilson@example.com</div>
                  <div className="text-sm text-gray-600">Sarah Wilson</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">Converted</Badge>
                  <Badge variant="outline" className="bg-purple-100 text-purple-800">Enterprise</Badge>
                  <span className="text-green-600 font-medium">$119.80</span>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">david.brown@example.com</div>
                  <div className="text-sm text-gray-600">David Brown</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-100 text-red-800">Churned</Badge>
                  <Badge variant="outline" className="bg-green-100 text-green-800">Monthly</Badge>
                  <span className="text-green-600 font-medium">$14.50</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-sm text-blue-700">
              🚀 Full referred users management with advanced filtering, search, and export capabilities coming soon!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferredUsersSimple;
