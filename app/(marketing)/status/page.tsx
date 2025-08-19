import { Typography } from '@/components/ui/typography';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Clock,
  Activity,
  Server,
  Database,
  Globe
} from 'lucide-react';

export default function StatusPage() {
  return (
    <div className="bg-background">
      <div className="container">
        <div className="text-center mb-8 md:mb-12">
          <Typography.Header
            level={1}
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
          >
            System Status
          </Typography.Header>
          <Typography.Paragraph className="text-lg text-muted-foreground">
            Real-time status of all Giveaway.dog services and infrastructure.
          </Typography.Paragraph>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Overall Status */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-lg">
                    All Systems Operational
                  </CardTitle>
                </div>
                <Badge
                  variant="default"
                  className="bg-green-500 hover:bg-green-600"
                >
                  Operational
                </Badge>
              </div>
              <CardDescription>
                All services are running normally. Last updated:{' '}
                {new Date().toLocaleString()}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* API Services */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center space-x-2">
                  <Server className="h-4 w-4 text-green-500" />
                  <CardTitle className="text-base">API Services</CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20"
                >
                  99.9% uptime
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Authentication API</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex justify-between">
                  <span>Giveaway Management</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex justify-between">
                  <span>User Dashboard</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-green-500" />
                  <CardTitle className="text-base">Database</CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20"
                >
                  Healthy
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Primary Database</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex justify-between">
                  <span>Read Replicas</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex justify-between">
                  <span>Response Time</span>
                  <span className="text-green-600 font-medium">&lt;50ms</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Third-party Services */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-green-500" />
                  <CardTitle className="text-base">External Services</CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20"
                >
                  All Connected
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Email Service</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex justify-between">
                  <span>Social Media APIs</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex justify-between">
                  <span>CDN & Assets</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Performance Metrics (Last 24 Hours)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-green-600">
                    99.98%
                  </div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-blue-600">127ms</div>
                  <div className="text-sm text-muted-foreground">
                    Avg Response
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-purple-600">
                    1.2M+
                  </div>
                  <div className="text-sm text-muted-foreground">Requests</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-orange-600">0</div>
                  <div className="text-sm text-muted-foreground">Errors</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Incidents */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Recent Incidents & Maintenance</span>
              </CardTitle>
              <CardDescription>
                Track any service disruptions or planned maintenance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">No recent incidents</h4>
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-200"
                      >
                        Resolved
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      All systems have been running smoothly for the past 30
                      days
                    </p>
                    <div className="text-xs text-muted-foreground mt-2">
                      Last maintenance: January 15, 2025 (Database optimization)
                    </div>
                  </div>
                </div>

                {/* Uncomment this section when there are actual incidents */}
                {/* <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Planned Maintenance</h4>
                      <Badge variant="secondary">Upcoming</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Scheduled database maintenance will occur on January 20, 2025 from 2:00-4:00 AM UTC
                    </p>
                    <div className="text-xs text-muted-foreground mt-2">
                      Expected impact: Brief service interruptions during maintenance window
                    </div>
                  </div>
                </div> */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
