"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Target,
  CalendarDays,
  ListChecks,
  CheckCircle2,
  RotateCw,
  Hourglass,
  Activity,
  Upload,
  FileText,
  Check,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layout } from "@/components/Layout";
import axios from "axios";
import { ThreeDot } from "react-loading-indicators";
import { MessageSquare } from "lucide-react";

interface Comment {
  id: string;
  taskId: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
  seenByAssignee: boolean;
  seenByManager: boolean;
}

interface Task {
  id: string;
  title: string;
  notes?: string;
  status: "TODO" | "WORKING" | "STUCK" | "DONE";
  priority: "HIGH" | "MEDIUM" | "LOW";
  dueDate?: string;
  fileUrl?: string;
  managerFiles?: string[];
  employeeFiles?: string[];
  createdAt: string;
  updatedAt: string;
  assignedHours?: string;
  comments?: Comment[];
}

const COLOR_PRIMARY = "#0000cc"; // Deep Blue
const COLOR_ACCENT_ICON = "text-red-500"; // Red
const COLOR_SUCCESS = "#10b981"; // Green for completion

type PriorityFilter = Task["priority"] | "all";

const getStatusBadgeStyles = (status: Task["status"]) => {
  switch (status) {
    case "WORKING":
      return `bg-amber-100 text-amber-700 border-amber-300`;
    case "DONE":
      return `bg-green-100 text-green-700 border-green-300`;
    case "TODO":
      return `bg-gray-100 text-gray-700 border-gray-300`;
    case "STUCK":
      return `bg-red-100 text-red-700 border-red-300`;
    default:
      return `bg-gray-100 text-gray-700`;
  }
};

const getPriorityBadgeStyles = (priority: Task["priority"]) => {
  switch (priority) {
    case "HIGH":
      return `bg-red-600 text-white`;
    case "MEDIUM":
      return `bg-amber-500 text-white`;
    case "LOW":
      return `bg-[${COLOR_PRIMARY}] text-white`;
    default:
      return `bg-gray-500 text-white`;
  }
};

const StatusIcon = ({ status }: { status: Task["status"] }) => {
  switch (status) {
    case "WORKING":
      return (
        <RotateCw
          className={`h-5 w-5 animate-spin-slow`}
          style={{ color: COLOR_PRIMARY }}
        />
      );
    case "DONE":
      return <CheckCircle2 className={`h-5 w-5 text-green-600`} />;
    case "TODO":
      return <Hourglass className={`h-5 w-5 text-gray-500`} />;
    case "STUCK":
      return <Activity className={`h-5 w-5 text-red-600`} />;
    default:
      return <FileText className={`h-5 w-5 text-gray-400`} />;
  }
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- Task Timeline View ---
const TaskTimelineView = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [commentText, setCommentText] = useState("");

  const token = localStorage.getItem("token");
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/tasks/EmployeeTasks`);
      setTasks(res.data.tasks);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStatusChange = async (
    taskId: string,
    newStatus: Task["status"]
  ) => {
    try {
      await axios.patch(`${API_BASE_URL}/tasks/${taskId}/status`, {
        status: newStatus,
      });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
            : t
        )
      );
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleFileUpload = async (taskId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/tasks/${taskId}/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                employeeFiles: t.employeeFiles
                  ? [...t.employeeFiles, res.data.fileUrl]
                  : [res.data.fileUrl],
              }
            : t
        )
      );
    } catch (err) {
      console.error("Failed to upload file", err);
    }
  };

  const filteredTasks = tasks.filter(
    (task) => priorityFilter === "all" || task.priority === priorityFilter
  );
  const orderedTasks = filteredTasks.sort((a, b) => {
    if (a.priority === "HIGH" && b.priority !== "HIGH") return -1;
    if (a.priority !== "HIGH" && b.priority === "HIGH") return 1;
    return (
      new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime()
    );
  });

  const fetchCommentsForTask = async (taskId: string) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/comments/${taskId}`);
      console.log("Fetched comments", res.data);
      const comments: Comment[] = res.data; // adjust if backend wraps in {comments}
      const taskWithComments = tasks.find((t) => t.id === taskId);
      if (taskWithComments) {
        setSelectedTask({ ...taskWithComments, comments });
      }
    } catch (err) {
      console.error("Failed to fetch comments", err);
    }
  };

  // const sendComment = async () => {
  //   if (!selectedTask || !commentText.trim()) return;
  //   try {
  //     const res = await axios.post(
  //       `${API_BASE_URL}/comments/${selectedTask.id}`,
  //       {
  //         content: commentText,
  //       }
  //     );
  //     setSelectedTask((prev) => {
  //       if (!prev) return prev;
  //       return {
  //         ...prev,
  //         comments: [...(prev.comments || []), res.data.comment],
  //       };
  //     });
  //     setCommentText("");
  //   } catch (err) {
  //     console.error("Failed to send comment", err);
  //   }
  // };

  const sendComment = async () => {
    if (!selectedTask || !commentText.trim()) return;
    try {
      const res = await axios.post(
        `${API_BASE_URL}/comments/${selectedTask.id}`,
        { content: commentText }
      );

      // Construct the full comment object from backend response
      const newComment: Comment = {
        id: res.data.id,
        taskId: selectedTask.id,
        content: res.data.content,
        authorId: res.data.authorId,
        author: res.data.author, // ensure backend sends author object
        createdAt: res.data.createdAt,
        updatedAt: res.data.updatedAt,
        seenByAssignee: res.data.seenByAssignee,
        seenByManager: res.data.seenByManager,
      };

      setSelectedTask((prev) =>
        prev
          ? { ...prev, comments: [...(prev.comments || []), newComment] }
          : prev
      );

      setCommentText("");
    } catch (err) {
      console.error("Failed to send comment", err);
    }
  };

  return (
    <CardContent className="p-0">
      <CardHeader className="p-0 pb-4">
        <div className="flex justify-between items-center mb-2">
          <CardTitle
            className="text-xl flex items-center gap-2"
            style={{ color: COLOR_PRIMARY }}
          >
            <Target className={`h-5 w-5 ${COLOR_ACCENT_ICON}`} />
            Assigned Tasks ({orderedTasks.length})
          </CardTitle>
          <Select
            value={priorityFilter}
            onValueChange={(value) =>
              setPriorityFilter(value as PriorityFilter)
            }
          >
            <SelectTrigger className="w-[180px] border-gray-300">
              <SelectValue placeholder="Filter by Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardDescription className="text-gray-500">
          Update your status, upload files, and track your task progress.
        </CardDescription>
      </CardHeader>

      {/* Table Header */}
      <div
        className={`hidden lg:grid grid-cols-[40px_3fr_2.5fr_1.5fr_1fr_1fr_1fr_2fr_1.5fr_0.8fr] text-xs font-bold uppercase border-b border-[${COLOR_PRIMARY}]/30 px-2 py-3`}
        style={{ color: COLOR_PRIMARY }}
      >
        <div></div>
        <div>Task & Project</div>
        <div>Priority & Deadline</div>
        <div>Status</div>
        <div className="text-center">References</div>
        <div className="text-center">Files</div>
        <div className="text-center">Hours</div>
        <div>Notes</div>
        <div className="text-center">Updated</div>
        <div className="text-center">Updated</div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center mt-8 gap-3">
          <ThreeDot
            variant="bounce"
            color={["#0000CC", "#D70707"]}
            size="medium"
          />
          <p className="text-sm text-gray-500 font-medium">Loading tasks...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orderedTasks.map((task) => (
            <div
              key={task.id}
              // onClick={() => {
              //   setSelectedTask(task);
              //   fetchCommentsForTask(task.id);
              // }}
              className="grid grid-cols-1 cursor-pointer grid-cols-[40px_3fr_2.5fr_1.5fr_1fr_1fr_1fr_2fr_1.5fr_0.8fr] gap-5 items-center p-4 bg-white border border-gray-200 rounded-lg hover:border-[#0000cc]/50 hover:shadow-sm transition-shadow"
            >
              {/* Status Icon */}
              <div className="hidden lg:flex justify-center items-center">
                <StatusIcon status={task.status} />
              </div>

              {/* Task & Project */}
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-gray-800">
                  {task.title}
                </span>
              </div>

              {/* Priority & Deadline */}
              <div className="flex flex-col gap-1">
                <Badge
                  variant="default"
                  className={`capitalize text-xs font-semibold ${getPriorityBadgeStyles(
                    task.priority
                  )}`}
                >
                  {task.priority}
                </Badge>
                {task.dueDate && (
                  <span className="flex items-center gap-1 text-sm text-red-600 font-medium">
                    <CalendarDays className="h-3 w-3" />
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Status Dropdown */}
              <div>
                <Select
                  value={task.status}
                  onValueChange={(value) =>
                    handleStatusChange(task.id, value as Task["status"])
                  }
                >
                  <SelectTrigger className="w-full h-8 text-sm border-gray-300 hover:border-[#0000cc]">
                    <SelectValue placeholder="Update Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">TODO</SelectItem>
                    <SelectItem value="WORKING">WORKING</SelectItem>
                    <SelectItem value="STUCK">STUCK</SelectItem>
                    <SelectItem value="DONE">DONE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Manager Files */}
              <div className="flex justify-center items-center">
                {task.managerFiles?.length ? (
                  <a
                    href={task.managerFiles[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Upload className="h-5 w-5 cursor-pointer text-blue-600 hover:text-blue-800" />
                  </a>
                ) : (
                  <Upload className="h-5 w-5 cursor-pointer text-gray-400" />
                )}
              </div>

              {/* File Upload */}
              <div className="flex justify-center items-center">
                {task.employeeFiles?.length ? (
                  <a
                    href={task.employeeFiles[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Upload className="h-5 w-5 cursor-pointer text-green-600" />
                  </a>
                ) : (
                  <label>
                    <Upload
                      className={`h-5 w-5 cursor-pointer text-gray-400 hover:text-[${COLOR_PRIMARY}]`}
                    />
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        e.target.files &&
                        handleFileUpload(task.id, e.target.files[0])
                      }
                    />
                  </label>
                )}
              </div>

              <div className="text-center text-sm font-semibold text-gray-600">
                {task.assignedHours || "-"}
              </div>

              <div
                className="text-sm text-gray-500 truncate"
                title={task.notes || ""}
              >
                {task.notes || "No notes"}
              </div>

              <div className="text-center text-xs text-gray-600">
                {new Date(task.updatedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                <br />
                {new Date(task.updatedAt).toLocaleDateString()}
              </div>

              <div className="flex justify-center items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // this is VERY important
                    setSelectedTask(task);
                    fetchCommentsForTask(task.id);
                  }}
                  className="hover:bg-gray-100 p-2 rounded-md transition"
                >
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </button>
              </div>
            </div>
          ))}

          {/* Comment Modal */}
          {selectedTask && (
            <div className="fixed inset-0 bg-black/30 flex justify-center items-start pt-20 z-50">
              <div className="bg-white rounded-lg shadow-lg w-[600px] max-h-[80vh] overflow-y-auto p-6 relative">
                <button
                  className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
                  onClick={() => setSelectedTask(null)}
                >
                  ✕
                </button>

                <h2 className="text-xl font-bold mb-2">{selectedTask.title}</h2>
                <p className="text-gray-500 mb-4">
                  {selectedTask.notes || "No notes"}
                </p>

                <div className="space-y-2 mb-4">
                  <h3 className="font-semibold text-gray-700">Comments</h3>
                  {selectedTask.comments?.length ? (
                    selectedTask.comments.map((c: Comment) => {
                      const currentUserRole = localStorage.getItem("userRole");
                      const isOwnRole = c.author.role === currentUserRole;
                      const seen =
                        currentUserRole === "OPERATOR"
                          ? c.seenByAssignee
                          : c.seenByManager;

                      const tickColor = seen
                        ? "text-blue-500"
                        : "text-gray-400";

                      return (
                        <div
                          key={c.id}
                          className="flex justify-between items-center text-sm text-gray-600 p-2 bg-gray-100 rounded"
                        >
                          <div>
                            <span className="font-medium">
                              {c.author.email}:
                            </span>{" "}
                            {c.content}
                          </div>

                          {!isOwnRole && (
                            <Check className={`h-4 w-4 ${tickColor}`} />
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-400">No comments yet</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0000cc]"
                  />
                  <button
                    className="bg-[#0000cc] text-white px-4 py-2 rounded hover:bg-[#000099]"
                    onClick={sendComment}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </CardContent>
  );
};

// --- Completed Calendar View ---
const CompletedCalendarView = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/tasks/EmployeeTasks`);
      const completed = res.data.tasks.filter((t: Task) => t.status === "DONE");
      setTasks(completed);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const completedByDate: Record<string, Task[]> = tasks.reduce((acc, task) => {
    const date = task.updatedAt.split("T")[0];
    acc[date] = acc[date] || [];
    acc[date].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const sortedDates = Object.keys(completedByDate).sort().reverse();

  return (
    <CardContent className="p-0 space-y-4">
      <CardHeader className="p-0 pb-4">
        <CardTitle
          className="text-xl flex items-center gap-2"
          style={{ color: COLOR_PRIMARY }}
        >
          <CalendarDays className={`h-5 w-5 ${COLOR_ACCENT_ICON}`} />
          Completed Task History
        </CardTitle>
        <CardDescription className="text-gray-500">
          A chronological log of all tasks you have marked as 'Completed'.
        </CardDescription>
      </CardHeader>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <ThreeDot
            variant="bounce"
            color={["#0000CC", "#D70707"]}
            size="medium"
          />
        </div>
      ) : sortedDates.length > 0 ? (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div
              key={date}
              className="border-l-4 pl-4 py-3 rounded-r-md shadow-sm"
              style={{
                borderColor: COLOR_SUCCESS,
                backgroundColor: `${COLOR_SUCCESS}10`,
              }}
            >
              <p
                className="font-bold text-base mb-2"
                style={{ color: COLOR_SUCCESS }}
              >
                {new Date(date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <ul className="space-y-2">
                {completedByDate[date].map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center gap-2 text-sm text-green-800"
                  >
                    <CheckCircle2 className={`h-4 w-4 text-green-600`} />
                    <span className="font-medium">{task.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500 border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <ListChecks
            className={`h-10 w-10 mx-auto mb-3`}
            style={{ color: COLOR_PRIMARY }}
          />
          <p>No completed tasks logged yet this period.</p>
        </div>
      )}
    </CardContent>
  );
};

// --- Main Component ---
export default function EmployeeTaskTimeline() {
  const [activeTab, setActiveTab] = useState<"timeline" | "calendar">(
    "timeline"
  );

  return (
    <Layout role="operator">
      <div className="space-y-8 p-6">
        <Card className={`p-6 shadow-lg border-[${COLOR_PRIMARY}]/20`}>
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "timeline" | "calendar")
            }
          >
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h1
                className="text-3xl font-bold"
                style={{ color: COLOR_PRIMARY }}
              >
                Task Management Hub
              </h1>
              <TabsList
                className={`grid w-[320px] grid-cols-2 bg-gray-100`}
                style={{ borderColor: COLOR_PRIMARY }}
              >
                <TabsTrigger
                  value="timeline"
                  className="gap-2 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-gray-600"
                  style={
                    activeTab === "timeline"
                      ? { backgroundColor: COLOR_PRIMARY }
                      : {}
                  }
                >
                  <ListChecks
                    className={`h-4 w-4 ${
                      activeTab === "timeline"
                        ? COLOR_ACCENT_ICON
                        : "text-gray-600"
                    }`}
                  />{" "}
                  Assigned Timeline
                </TabsTrigger>
                <TabsTrigger
                  value="calendar"
                  className="gap-2 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-gray-600"
                  style={
                    activeTab === "calendar"
                      ? { backgroundColor: COLOR_PRIMARY }
                      : {}
                  }
                >
                  <CalendarDays
                    className={`h-4 w-4 ${
                      activeTab === "calendar"
                        ? COLOR_ACCENT_ICON
                        : "text-gray-600"
                    }`}
                  />{" "}
                  Completed Calendar
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="timeline" className="m-0">
              <TaskTimelineView />
            </TabsContent>
            <TabsContent value="calendar" className="m-0">
              <CompletedCalendarView />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </Layout>
  );
}
