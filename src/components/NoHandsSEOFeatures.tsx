import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Eye, 
  BarChart3, 
  Clock, 
  CheckCircle2, 
  Bell,
  FileText,
  Target,
  Zap,
  TrendingUp
} from "lucide-react";

const NoHandsSEOFeatures = () => {
  const features = [
    {
      icon: Shield,
      title: "Quality Verification",
      description: "Every campaign undergoes manual review by our experts before processing begins",
      benefits: ["Compliance with search engine guidelines", "Quality assurance", "Risk mitigation"],
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: Eye,
      title: "Campaign Monitoring",
      description: "Real-time dashboard to track campaign progress and status updates",
      benefits: ["Live progress tracking", "Status notifications", "Performance metrics"],
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      icon: BarChart3,
      title: "Detailed Reporting",
      description: "Comprehensive reports with metrics, backlink details, and performance analytics",
      benefits: ["Export capabilities", "Domain authority metrics", "ROI tracking"],
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      icon: Clock,
      title: "Verification Workflow",
      description: "Structured approval process ensures optimal campaign execution",
      benefits: ["24-48 hour review time", "Expert quality checks", "Customer feedback"],
      color: "text-amber-600",
      bgColor: "bg-amber-50"
    }
  ];

  const workflowSteps = [
    {
      step: 1,
      title: "Campaign Submission",
      description: "Submit your target URL, keywords, and campaign preferences",
      icon: FileText,
      status: "User Action"
    },
    {
      step: 2,
      title: "Quality Verification",
      description: "Our team reviews your campaign for compliance and optimization",
      icon: Shield,
      status: "24-48 Hours"
    },
    {
      step: 3,
      title: "Campaign Execution",
      description: "Approved campaigns enter our automated link building pipeline",
      icon: Zap,
      status: "Automated"
    },
    {
      step: 4,
      title: "Progress Monitoring",
      description: "Track campaign progress through your dedicated dashboard",
      icon: Eye,
      status: "Real-time"
    },
    {
      step: 5,
      title: "Results & Reporting",
      description: "Receive detailed reports and backlink delivery confirmation",
      icon: BarChart3,
      status: "Upon Completion"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Feature Overview */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Enhanced ∞ Backlinks Automation (Beta) Platform</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Our upgraded ∞ Backlinks Automation (Beta) tool now includes comprehensive verification workflows, 
            real-time monitoring, and detailed reporting capabilities for enterprise-level campaign management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${feature.bgColor}`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{feature.description}</p>
                <div className="space-y-2">
                  {feature.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Workflow Visualization */}
      <div>
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold mb-4">Enhanced Campaign Workflow</h3>
          <p className="text-muted-foreground">
            Our new verification-based workflow ensures quality and compliance at every step
          </p>
        </div>

        <div className="space-y-6">
          {workflowSteps.map((step, index) => (
            <Card key={index} className="relative">
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  {/* Step Number */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">
                      {step.step}
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold">{step.title}</h4>
                      <Badge variant="outline">{step.status}</Badge>
                    </div>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>

                  {/* Step Icon */}
                  <div className="flex-shrink-0">
                    <div className="p-3 rounded-lg bg-muted">
                      <step.icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                {/* Connector Line */}
                {index < workflowSteps.length - 1 && (
                  <div className="absolute left-12 top-16 w-0.5 h-8 bg-border transform -translate-x-1/2"></div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Key Improvements */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Key Platform Improvements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-2">Quality Assurance</h4>
              <p className="text-sm text-muted-foreground">
                Manual verification ensures every campaign meets our high standards before execution
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <Bell className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="font-semibold mb-2">Real-time Updates</h4>
              <p className="text-sm text-muted-foreground">
                Stay informed with instant notifications and progress updates throughout the campaign
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-2">Advanced Analytics</h4>
              <p className="text-sm text-muted-foreground">
                Comprehensive reporting with exportable data and performance insights
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NoHandsSEOFeatures;
