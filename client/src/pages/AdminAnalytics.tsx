import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Users, FileText, CheckCircle, Download, Mail } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['#2c7da0', '#61a5c2', '#89c2d9', '#a9d6e5', '#c9e4f0'];
const STATUS_COLORS = {
  pending: '#fbbf24',
  quoted: '#3b82f6',
  completed: '#10b981',
  cancelled: '#ef4444',
};

export default function AdminAnalytics() {
  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({});

  // Fetch analytics data
  const { data: inquiryStats, isLoading: loadingInquiryStats } = trpc.admin.analytics.getInquiryStats.useQuery(dateRange);
  const { data: topProducts, isLoading: loadingTopProducts } = trpc.admin.analytics.getTopProducts.useQuery({ limit: 10 });
  const { data: customerAnalytics, isLoading: loadingCustomerAnalytics } = trpc.admin.analytics.getCustomerAnalytics.useQuery();
  const { data: conversionRate, isLoading: loadingConversionRate } = trpc.admin.analytics.getConversionRate.useQuery();
  const sendMonthlyReportMutation = trpc.admin.analytics.sendMonthlyReport.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error('Failed to send monthly report: ' + error.message);
    },
  });

  const isLoading = loadingInquiryStats || loadingTopProducts || loadingCustomerAnalytics || loadingConversionRate;

  const handleSendMonthlyReport = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
    sendMonthlyReportMutation.mutate({
      year: lastMonth.getFullYear(),
      month: lastMonth.getMonth() + 1,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Insights and statistics for your business</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inquiryStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerAnalytics?.totalCustomers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {customerAnalytics?.activeCustomers || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quote Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversionRate?.quoteRate?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {conversionRate?.quoted || 0} of {conversionRate?.total || 0} inquiries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversionRate?.conversionRate?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {conversionRate?.completed || 0} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Inquiry Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Inquiry Status Distribution</CardTitle>
            <CardDescription>Breakdown by inquiry status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={inquiryStats?.byStatus || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="status"
                >
                  {(inquiryStats?.byStatus || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Inquiry Urgency Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Inquiry Urgency Distribution</CardTitle>
            <CardDescription>Breakdown by urgency level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={inquiryStats?.byUrgency || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="urgency" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#2c7da0" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Inquiry Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Inquiry Trend</CardTitle>
            <CardDescription>Inquiries over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={inquiryStats?.dailyStats || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#2c7da0" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Products</CardTitle>
            <CardDescription>Most inquired products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(topProducts || []).slice(0, 5).map((product, index) => (
                <div key={product.productId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{product.brand}</p>
                      <p className="text-xs text-gray-500">{product.partNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{product.inquiryCount}</p>
                    <p className="text-xs text-gray-500">inquiries</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Customer by Country */}
        <Card>
          <CardHeader>
            <CardTitle>Customers by Country</CardTitle>
            <CardDescription>Top 10 countries</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={customerAnalytics?.byCountry || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="country" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#61a5c2" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Customer by Industry */}
        <Card>
          <CardHeader>
            <CardTitle>Customers by Industry</CardTitle>
            <CardDescription>Top 10 industries</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={customerAnalytics?.byIndustry || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ industry, count }) => `${industry}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="industry"
                >
                  {(customerAnalytics?.byIndustry || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Customer Tier Distribution */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Customer Tier Distribution</CardTitle>
          <CardDescription>VIP vs Regular customers</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={customerAnalytics?.byTier || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tier" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#2c7da0" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={handleSendMonthlyReport}
          disabled={sendMonthlyReportMutation.isPending}
        >
          <Mail className="h-4 w-4" />
          {sendMonthlyReportMutation.isPending ? 'Sending...' : 'Send Monthly Report'}
        </Button>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>
    </div>
  );
}

