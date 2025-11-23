"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Users,
  Search,
  ArrowRight,
  User,
  Clock,
  CheckCircle2,
  TrendingUp,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
} from "recharts";
import { Layout } from "@/components/Layout";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { Button } from "react-day-picker";

// --- Colors based on inspiration ---
const COLOR_PRIMARY = "#0000cc";
const COLOR_ACCENT_ICON = "text-red-500";
const COLOR_SUCCESS = "#10b981"; // Green for completion
const COLOR_WARNING = "#f97316"; // Orange for engagement

// --- Types (Unchanged) ---
interface PerformanceData {
  hours: number;
  hoursChange?: number;
  completionRate: number;
  completionChange?: number;
  engagement: number;
  engagementChange?: number;
  rating: number;
  ratingChange?: number;
  weeklyHours: { day: string; hours: number }[];
  completionTrend: { week: string; completion: number }[];
  radar: { metric: string; A: number; fullMark: number }[];
  skills: { skill: string; percentage: number }[];
  achievements: { title: string; subtitle: string; icon: string }[];
}

interface Employee {
  id: number;
  name: string;
  role: string;
  email: string;
  department?: string;
  performance: PerformanceData;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- Helper Components ---
const PerformanceStats = ({ data }: { data: PerformanceData }) => {
  const statItems: any = [
    {
      title: "Total Hours (Week)",
      value: `${data.hours}h`,
      change: data.hoursChange ? `+${data.hoursChange}%` : "",
      icon: Clock,
      color: "text-red-500",
      valueColor: COLOR_PRIMARY,
      trendColor: "text-blue-600",
    },
    {
      title: "Task Completion",
      value: `${data.completionRate}%`,
      change: data.completionChange ? `+${data.completionChange}%` : "",
      icon: CheckCircle2,
      color: "text-red-500",
      valueColor: COLOR_SUCCESS,
      trendColor: "text-green-600",
    },
    {
      title: "Engagement Rate",
      value: `${data.engagement}%`,
      change: data.engagementChange ? `+${data.engagementChange}%` : "",
      icon: TrendingUp,
      color: "text-red-500",
      valueColor: COLOR_WARNING,
      trendColor: "text-orange-600",
    },
    {
      title: "Overall Rating",
      value: `${data.rating}/5`,
      change: data.ratingChange ? `Top ${data.ratingChange}%` : "",
      icon: Target,
      color: "text-red-500",
      valueColor: COLOR_PRIMARY,
      trendColor: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statItems.map((item: any) => (
        <Card
          key={item.title}
          className="p-4 flex items-center justify-between border-[#0000cc]/20 shadow-sm hover:shadow-md transition-all"
        >
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">{item.title}</p>
            {/* FIX: Use inline style for dynamic custom color to prevent Tailwind parsing issues */}
            <h3
              className="text-2xl font-bold"
              style={{ color: item.valueColor }}
            >
              {item.value}
            </h3>
          </div>
          <div className="text-right">
            {item.change && (
              <div className={`text-xs font-semibold ${item.trendColor}`}>
                {item.change}
              </div>
            )}
            <item.icon className={`h-6 w-6 opacity-70 ${item.color}`} />
          </div>
        </Card>
      ))}
    </div>
  );
};

const PerformanceMatrix = ({ data }: { data: PerformanceData }) => (
  <Card className="p-6 mb-6 border-[#0000cc]/20 shadow-sm">
    <CardTitle
      className={`flex items-center gap-2 mb-4 text-xl`}
      style={{ color: COLOR_PRIMARY }}
    >
      <Zap className={`h-5 w-5 ${COLOR_ACCENT_ICON}`} />
      Performance Matrix
    </CardTitle>
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart outerRadius={130} data={data.radar}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="metric"
            stroke="#666"
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: `1px solid ${COLOR_PRIMARY}`,
              borderRadius: "0.5rem",
              padding: "5px 10px",
            }}
            formatter={(value, name, props) => [
              `${value}%`,
              props.payload.metric,
            ]}
            labelFormatter={() => ""}
          />
          <Radar
            name="Performance"
            dataKey="A"
            stroke={COLOR_PRIMARY}
            fill={COLOR_PRIMARY}
            fillOpacity={0.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  </Card>
);

const SkillsAchievements = ({ data }: { data: PerformanceData }) => (
  <div className="grid lg:grid-cols-2 gap-6">
    <Card className="p-6 border-[#0000cc]/20 shadow-sm">
      <CardTitle className={`text-xl mb-4`} style={{ color: COLOR_PRIMARY }}>
        Top Skills
      </CardTitle>
      <div className="space-y-4">
        {data.skills.map((skill) => (
          <div key={skill.skill}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-800">{skill.skill}</span>
              <span className="text-gray-500 font-semibold">
                {skill.percentage}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500`}
                style={{
                  width: `${skill.percentage}%`,
                  backgroundColor: COLOR_PRIMARY,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
    <Card className="p-6 border-[#0000cc]/20 shadow-sm">
      <CardTitle className={`text-xl mb-4`} style={{ color: COLOR_PRIMARY }}>
        Recent Achievements
      </CardTitle>
      <div className="space-y-4">
        {data.achievements.map((ach) => (
          <div
            key={ach.title}
            className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Trophy className={`h-6 w-6 ${COLOR_ACCENT_ICON} flex-shrink-0`} />
            <div>
              <h4 className="font-semibold text-gray-800">{ach.title}</h4>
              <p className="text-sm text-gray-500">{ach.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

// --- Main Component ---
export default function EmployeePerformanceDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const token = localStorage.getItem("token");

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/employees/performance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(res.data.employees);

      if (res.data.employees.length > 0) {
        fetchEmployeePerformance(
          res.data.employees[0].id.toString(),
          res.data.employees[0]
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeePerformance = async (
    employeeId: string,
    employeeInfo: Employee
  ) => {
    setLoadingPerformance(true);
    setSelectedEmployee(employeeInfo);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/employees/${employeeId}/performance`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSelectedEmployee({
        ...employeeInfo,
        performance: res.data.performance,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch performance data");
      setSelectedEmployee({ ...employeeInfo, performance: null as any });
    } finally {
      setLoadingPerformance(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // --- FIX APPLIED HERE ---
  const filteredEmployees = employees.filter((emp) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true; // Show all if search is empty

    // Safely access properties, defaulting to empty string if null/undefined
    const name = emp.name ?? "";
    const id = emp.id?.toString() ?? "";
    const role = emp.role ?? "";

    return (
      name.toLowerCase().includes(term) ||
      id.includes(term) ||
      role.toLowerCase().includes(term)
    );
  });
  // -------------------------

  const primaryStyle = { color: COLOR_PRIMARY };
  const primaryBgStyle = { backgroundColor: COLOR_PRIMARY };

  return (
    <Layout role="manager">
      <div className="space-y-8 min-h-screen ">
        {/* Header and Total Employees Card */}
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold" style={primaryStyle}>
              Employee Performance Hub
            </h1>
            <p className="text-gray-500">
              In-depth analytics for informed management decisions.
            </p>
          </div>
          <Card
            className={`p-4 shadow-md`}
            style={{
              backgroundColor: `${COLOR_PRIMARY}1A`,
              borderColor: `${COLOR_PRIMARY}4D`,
            }}
          >
            <div className="flex items-center gap-3">
              <Users className={`h-6 w-6 ${COLOR_ACCENT_ICON}`} />
              <div>
                <div className="text-sm font-medium text-gray-600">
                  Total Team Members
                </div>
                <div className="text-2xl font-bold" style={primaryStyle}>
                  {employees.length}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 xl:grid-cols-4 gap-6 h-[calc(100vh-160px)]">
          {/* Employee List */}
          <Card
            className={`lg:col-span-1 p-4 flex flex-col shadow-lg border-[#0000cc]/20`}
          >
            <CardHeader className="px-2 pt-1 pb-4">
              <CardTitle className="text-xl" style={primaryStyle}>
                Select Team Member
              </CardTitle>
              <div className="relative">
                <Search
                  className={`absolute left-3 top-[1.8rem] transform -translate-y-1/2 h-4 w-4 ${COLOR_ACCENT_ICON}`}
                />
                <Input
                  placeholder="Search by ID, Name, or Role..."
                  className="mt-2 pl-9 border-gray-300 focus:border-[#0000cc]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <div className="space-y-2 flex-1 overflow-y-auto pr-2">
              {loading ? (
                <div className="text-center py-8">
                  <Loader2
                    className={`h-6 w-6 animate-spin mx-auto`}
                    style={primaryStyle}
                  />
                  <p className="text-sm text-gray-500 mt-2">Loading Team...</p>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <p className="text-center py-4 text-gray-500">
                  No employees found
                  <button className="text-[#0000cc] mt-2 font-semibold underline hover:text-red-500" onClick={() => window.location.reload()}>Try Refreshing</button>
                </p>
              ) : (
                filteredEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className={`p-4 rounded-lg cursor-pointer flex items-center justify-between transition-all duration-150 ${
                      selectedEmployee?.id === employee.id
                        ? `text-white shadow-md`
                        : "hover:bg-gray-100 border border-gray-200"
                    }`}
                    style={
                      selectedEmployee?.id === employee.id ? primaryBgStyle : {}
                    }
                    onClick={() =>
                      fetchEmployeePerformance(employee.id.toString(), employee)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <User
                        className={`h-5 w-5 ${
                          selectedEmployee?.id === employee.id
                            ? COLOR_ACCENT_ICON
                            : `text-blue-700`
                        }`}
                      />
                      <div>
                        <h4 className="font-semibold leading-none">
                          {employee.name}
                        </h4>
                        <p
                          className={`text-sm ${
                            selectedEmployee?.id === employee.id
                              ? "text-white/80"
                              : "text-gray-500"
                          }`}
                        >
                          {employee.role}
                        </p>
                      </div>
                    </div>
                    {selectedEmployee?.id === employee.id && (
                      <ArrowRight className={`h-4 w-4 ${COLOR_ACCENT_ICON}`} />
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Detail View */}
          <div className="lg:col-span-2 xl:col-span-3 relative">
            {loadingPerformance && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-xl">
                <Loader2
                  className={`h-10 w-10 animate-spin`}
                  style={primaryStyle}
                />
              </div>
            )}
            {selectedEmployee && selectedEmployee.performance ? (
              <Card
                className={`h-full flex flex-col p-6 overflow-y-auto shadow-lg border-[#0000cc]/20`}
              >
                <div className="mb-6 border-b pb-3">
                  <h2 className="text-3xl font-bold" style={primaryStyle}>
                    Performance Analytics
                  </h2>
                  <p className="text-xl text-gray-600 font-medium">
                    {selectedEmployee.name}
                  </p>
                </div>

                {/* Top Stats */}
                <PerformanceStats data={selectedEmployee.performance} />

                {/* Charts */}
                <div className="grid lg:grid-cols-2 gap-6 mb-6">
                  {/* Weekly Hours */}
                  <Card className="p-6 border-[#0000cc]/20 shadow-sm">
                    <CardTitle
                      className={`text-xl mb-4 flex items-center gap-2`}
                      style={primaryStyle}
                    >
                      <Clock className={`h-5 w-5 ${COLOR_ACCENT_ICON}`} />{" "}
                      Weekly Hours Breakdown
                    </CardTitle>
                    <ResponsiveContainer width="100%" height={200}>
                      {selectedEmployee?.performance?.weeklyHours && (
                        <BarChart
                          data={selectedEmployee.performance.weeklyHours}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                          />
                          <XAxis dataKey="day" stroke="#666" />
                          <YAxis stroke="#666" />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "0.5rem",
                              border: `1px solid ${COLOR_PRIMARY}`,
                            }}
                          />
                          <Bar
                            dataKey="hours"
                            fill={COLOR_PRIMARY}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </Card>

                  {/* Task Completion Trend */}
                  <Card className="p-6 border-[#0000cc]/20 shadow-sm">
                    <CardTitle
                      className={`text-xl mb-4 flex items-center gap-2`}
                      style={primaryStyle}
                    >
                      <CheckCircle2
                        className={`h-5 w-5 ${COLOR_ACCENT_ICON}`}
                      />{" "}
                      Task Completion Trend
                    </CardTitle>
                    <ResponsiveContainer width="100%" height={200}>
                      {selectedEmployee?.performance?.completionTrend && (
                        <LineChart
                          data={selectedEmployee.performance.completionTrend}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                          />
                          <XAxis dataKey="week" stroke="#666" />
                          <YAxis stroke="#666" />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "0.5rem",
                              border: `1px solid ${COLOR_PRIMARY}`,
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="completion"
                            stroke={COLOR_SUCCESS}
                            strokeWidth={3}
                            dot={{ fill: COLOR_SUCCESS, r: 4 }}
                          />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </Card>
                </div>

                {/* Radar Chart */}
                {selectedEmployee?.performance?.radar && (
                  <PerformanceMatrix data={selectedEmployee.performance} />
                )}

                {/* Skills & Achievements */}
                {selectedEmployee?.performance && (
                  <SkillsAchievements data={selectedEmployee.performance} />
                )}
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300 shadow-inner">
                <div className="text-center text-gray-500 p-8">
                  <Target
                    className={`h-12 w-12 mx-auto mb-4`}
                    style={primaryStyle}
                  />
                  <h3 className={`text-xl font-semibold`} style={primaryStyle}>
                    Performance View
                  </h3>
                  <p>
                    Select an employee from the list to view their detailed
                    performance analytics.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
