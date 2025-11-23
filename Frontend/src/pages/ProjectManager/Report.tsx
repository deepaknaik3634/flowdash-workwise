import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Users,
  Clock,
  CheckCircle2,
  Calendar,
  Download,
  FileBadge,
  TrendingUp,
  Plus,
  Zap,
  Clock4,
  CheckSquare,
} from "lucide-react";
import { Layout } from "@/components/Layout";

// --- Colors based on inspiration ---
const COLOR_PRIMARY = "#0000cc"; // Blue
const COLOR_ACCENT_ICON = "text-red-500"; // Red
const COLOR_SUCCESS = "#10b981"; // Green for completion
const COLOR_WARNING = "#f97316"; // Orange for hours/pending

// --- Mock Data Structures & Data (Unchanged) ---
interface ReportSummary {
  totalReports: number;
  reportChange: string; 
  teamMembers: number;
  membersStatus: string; 
  totalHours: string;
  hoursChange: string; 
  completionRate: string;
  completionChange: string; 
}

interface ReportItem {
  id: number;
  title: string;
  type: 'Weekly' | 'Monthly' | 'Custom';
  dateRange: string;
  size: string;
  status: 'Ready' | 'Generating';
}

const MOCK_SUMMARY: ReportSummary = {
  totalReports: 24,
  reportChange: "+4 this month",
  teamMembers: 12,
  membersStatus: "All active",
  totalHours: "1,248h",
  hoursChange: "+8% vs last month",
  completionRate: "94%",
  completionChange: "+3% improvement",
};

const MOCK_REPORTS: ReportItem[] = [
  {
    id: 1,
    title: "Weekly Team Performance Report (W42)",
    type: 'Weekly',
    dateRange: "Oct 16 - Oct 20, 2024",
    size: "2.3 MB",
    status: 'Ready',
  },
  {
    id: 2,
    title: "Monthly Operations Summary (Sep)",
    type: 'Monthly',
    dateRange: "September 2024",
    size: "5.1 MB",
    status: 'Ready',
  },
  {
    id: 3,
    title: "Project Milestone Alpha Report",
    type: 'Custom',
    dateRange: "Oct 15, 2024",
    size: "1.8 MB",
    status: 'Ready',
  },
  {
    id: 4,
    title: "Q3 Task Completion Audit",
    type: 'Custom',
    dateRange: "Jul 1 - Sep 30, 2024",
    size: "12.0 MB",
    status: 'Generating',
  },
];

// --- Sub-Component: Report Stat Card (Redesigned) ---
const ReportStatCard = ({ icon: Icon, title, value, trend, colorClass }: {
  icon: React.ElementType,
  title: string,
  value: string,
  trend: string,
  colorClass: string,
}) => (
  <Card className="p-5 flex flex-col justify-between h-full border-[#0000cc]/20 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-center justify-between mb-3">
      {/* Icon: Always red, Background: light blue */}
      <div className={`rounded-lg p-3 bg-[${COLOR_PRIMARY}]/10`}>
        <Icon className={`h-6 w-6 ${COLOR_ACCENT_ICON}`} />
      </div>
      <p className={`text-sm font-medium ${trend.includes('+') ? 'text-green-600' : 'text-gray-500'}`}>
        {trend}
      </p>
    </div>
    <div className="space-y-1">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {/* Value: Use primary blue color */}
      <h3 className="text-3xl font-bold" style={{ color: COLOR_PRIMARY }}>{value}</h3>
    </div>
  </Card>
);

// --- Main Component ---

export default function TeamReportsDashboard() {
  
  // Custom Badge for status consistency
  const getReportStatusBadge = (status: ReportItem['status']) => {
    if (status === 'Ready') {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-300 gap-1">
          <CheckCircle2 className="h-3 w-3" /> Ready
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-300 gap-1 animate-pulse">
        <Clock4 className="h-3 w-3" /> Generating
      </Badge>
    );
  }

  // Custom Badge for report type
  const getReportTypeBadge = (type: ReportItem['type']) => {
    let typeClass = "bg-gray-100 text-gray-700";
    if (type === 'Monthly') typeClass = "bg-[#0000cc]/10 text-[#0000cc]";
    if (type === 'Custom') typeClass = "bg-red-100 text-red-700";

    return (
      <Badge variant="secondary" className={`mr-2 text-xs h-5 font-semibold ${typeClass}`}>
        {type}
      </Badge>
    );
  }


  return (
    <Layout role="manager">
      <div className="space-y-8 min-h-screen"> 
        
        {/* Header and Controls */}
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: COLOR_PRIMARY }}>
              Reports & Analytics
            </h1>
            <p className="text-gray-500">
              Generate and manage comprehensive team performance reports.
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
                variant="outline" 
                className={`gap-2 border-[${COLOR_PRIMARY}] text-[${COLOR_PRIMARY}] hover:bg-[#0000cc]/5`}
            >
              <Plus className={`h-4 w-4 ${COLOR_ACCENT_ICON}`} />
              Generate Quick Report
            </Button>
            <Button 
                className={`gap-2 bg-[${COLOR_PRIMARY}] hover:bg-[#0000cc]/90 text-white shadow-md`}
            >
              <FileText className={`h-4 w-4 ${COLOR_ACCENT_ICON}`} />
              Download All Ready
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <ReportStatCard
            icon={FileText}
            title="Total Reports Generated"
            value={MOCK_SUMMARY.totalReports.toString()}
            trend={MOCK_SUMMARY.reportChange}
            colorClass={`text-[${COLOR_PRIMARY}]`}
          />
          <ReportStatCard
            icon={Users}
            title="Team Members Tracked"
            value={MOCK_SUMMARY.teamMembers.toString()}
            trend={MOCK_SUMMARY.membersStatus}
            colorClass={`text-green-500`}
          />
          <ReportStatCard
            icon={Clock}
            title="Total Hours Logged"
            value={MOCK_SUMMARY.totalHours}
            trend={MOCK_SUMMARY.hoursChange}
            colorClass={`text-yellow-600`}
          />
          <ReportStatCard
            icon={CheckCircle2}
            title="Completion Rate"
            value={MOCK_SUMMARY.completionRate}
            trend={MOCK_SUMMARY.completionChange}
            colorClass={`text-purple-500`}
          />
        </div>

        {/* Available Reports Section */}
        <Card className={`shadow-lg border-[${COLOR_PRIMARY}]/20`}>
          <CardHeader>
            <CardTitle style={{ color: COLOR_PRIMARY }}>Recent Reports</CardTitle>
            <CardDescription className="text-gray-500">Recently generated files ready for review and download.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {MOCK_REPORTS.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Icon and Accent */}
                  <div className={`rounded-lg bg-[${COLOR_PRIMARY}]/10 p-3`}>
                    <FileBadge className={`h-6 w-6 ${COLOR_ACCENT_ICON}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{report.title}</h4>
                    <p className="text-sm text-gray-500">
                      {getReportTypeBadge(report.type)}
                      <span className="text-xs">• {report.dateRange} • {report.size}</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {getReportStatusBadge(report.status)}
                  <Button
                    variant="default"
                    size="sm"
                    className={`gap-2 ${report.status === 'Ready' ? `bg-[#0000cc] hover:bg-[#0000cc]` : `bg-gray-400 cursor-not-allowed`} text-white font-semibold`}
                    disabled={report.status === 'Generating'}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Report Generation Options */}
        <div className="grid gap-6 md:grid-cols-3 pt-4">
          
          {/* Weekly Reports Card */}
          <Card className={`p-6 flex flex-col justify-between hover:shadow-lg transition-shadow border-[${COLOR_PRIMARY}]/20`}>
            <div className="space-y-3 mb-6">
              <Calendar className={`h-8 w-8 ${COLOR_ACCENT_ICON}`} />
              <CardTitle style={{ color: COLOR_PRIMARY }}>Weekly Reports</CardTitle>
              <CardDescription className="text-gray-500">
                Detailed breakdown of weekly team performance and task completion.
              </CardDescription>
            </div>
            <Button 
                variant="outline" 
                className={`w-full gap-2 border-[${COLOR_PRIMARY}] text-[${COLOR_PRIMARY}] hover:bg-[#0000cc]/5`}
            >
              <Plus className="h-4 w-4" />
              Generate Weekly
            </Button>
          </Card>

          {/* Monthly Reports Card */}
          <Card className={`p-6 flex flex-col justify-between hover:shadow-lg transition-shadow border-[${COLOR_PRIMARY}]/20`}>
            <div className="space-y-3 mb-6">
              <FileText className={`h-8 w-8 ${COLOR_ACCENT_ICON}`} />
              <CardTitle style={{ color: COLOR_PRIMARY }}>Monthly Reports</CardTitle>
              <CardDescription className="text-gray-500">
                Comprehensive monthly analytics with trends and insights.
              </CardDescription>
            </div>
            <Button 
                variant="outline" 
                className={`w-full gap-2 border-[${COLOR_PRIMARY}] text-[${COLOR_PRIMARY}] hover:bg-[#0000cc]/5`}
            >
              <Plus className="h-4 w-4" />
              Generate Monthly
            </Button>
          </Card>

          {/* Custom Reports Card */}
          <Card className={`p-6 flex flex-col justify-between hover:shadow-lg transition-shadow border-[${COLOR_PRIMARY}]/20`}>
            <div className="space-y-3 mb-6">
              <TrendingUp className={`h-8 w-8 ${COLOR_ACCENT_ICON}`} />
              <CardTitle style={{ color: COLOR_PRIMARY }}>Custom Reports</CardTitle>
              <CardDescription className="text-gray-500">
                Create custom reports with specific date ranges and metrics.
              </CardDescription>
            </div>
            <Button 
                className={`w-full gap-2 bg-[${COLOR_PRIMARY}] hover:bg-[#0000cc]/90 text-white`}
            >
              <Zap className="h-4 w-4" />
              Create Custom
            </Button>
          </Card>
        </div>
      </div>
    </Layout>
  );
}