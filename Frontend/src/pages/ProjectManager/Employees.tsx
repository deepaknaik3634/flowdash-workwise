import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  FolderKanban,
  CalendarDays,
  ListChecks,
  Plus,
  ArrowRight,
  User,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Send,
  Trash2,
  Loader2,
  Zap,
  MessageCircleDashed,
  Check,
  CheckIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ThreeDot } from "react-loading-indicators";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

interface Comment {
  id: string;
  content: string;
  authorId: string;
  author: { id: string; email: string; role: string };
  seenByAssignee: boolean;
  seenByManager: boolean;
  createdAt: string;
}

// --- Type Definitions ---
interface Task {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "HIGH" | "MEDIUM" | "LOW";
  dueDate?: string;
}

interface EmployeeResponse {
  employees: Employee[];
}

interface Employee {
  id: string;
  name: string;
  role: string;
  email: string;
  tasks: Task[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- Utility Functions ---

/**
 * Returns a Tailwind class for the badge variant based on task status.
 */
const getStatusBadgeClass = (status: Task["status"]): string => {
  switch (status) {
    case "DONE":
      return "bg-green-100 text-green-700 hover:bg-green-200 border-green-300";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-300";
    case "TODO":
      return "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

/**
 * Returns a Tailwind class for the priority color.
 */
const getPriorityColor = (priority: Task["priority"]): string => {
  switch (priority) {
    case "HIGH":
      return "bg-red-600";
    case "MEDIUM":
      return "bg-amber-500";
    case "LOW":
      return "bg-[#0000cc]"; // Using the primary blue color for LOW priority
    default:
      return "bg-gray-500";
  }
};

// --- Task Action Menu ---
const TaskActionMenu = ({
  task,
  currentEmployeeId,
  onTaskTransfer,
  onTaskDelete,
  employees,
  setActiveCommentTask,
}: {
  task: Task;
  currentEmployeeId: string;
  onTaskTransfer: (taskId: string, newEmployeeId: string) => void;
  onTaskDelete: (taskId: string) => void;
  employees: Employee[];
  setActiveCommentTask: React.Dispatch<React.SetStateAction<Task | null>>;
}) => {
  const otherEmployees = employees.filter(
    (emp) => emp.id !== currentEmployeeId
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0 ml-2 text-[#0000cc]">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 bg-white shadow-xl rounded-lg"
      >
        <DropdownMenuLabel className="text-[#0000cc] font-semibold">
          Task Actions
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="hover:bg-blue-50 cursor-pointer">
            <Send className="mr-2 h-4 w-4 text-red-500" />
            <span>Move To...</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-white shadow-lg">
            <DropdownMenuLabel>Select New Assignee</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {otherEmployees.length > 0 ? (
              otherEmployees.map((emp) => (
                <DropdownMenuItem
                  key={emp.id}
                  onClick={() => onTaskTransfer(task.id, emp.id)}
                  className="cursor-pointer hover:bg-blue-50"
                >
                  <User className="mr-2 h-4 w-4 text-[#0000cc]" />
                  {emp.name}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>
                No other employees available
              </DropdownMenuItem>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuItem
          className="text-black focus:bg-red-50 focus:text-red-600 cursor-pointer hover:bg-red-50"
          onClick={() => setActiveCommentTask(task)}
        >
          <MessageCircleDashed className="mr-2 h-4 w-4 text-red-600 " />
          Comments
        </DropdownMenuItem>

        <DropdownMenuItem
          className="text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer hover:bg-red-50"
          onClick={() => onTaskDelete(task.id)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Task
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const TaskCommentPanel = ({
  task,
  onClose,
}: {
  task: Task;
  onClose: () => void;
}) => {
  const token = localStorage.getItem("token");
  const currentUserRole = localStorage.getItem("role") || "MANAGER"; // Assuming manager side
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  // Fetch comments
const fetchComments = useCallback(async () => {
  try {
    const { data } = await axios.get<Comment[]>(
      `${API_BASE_URL}/comments/${task.id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // Sort all previous comments to show oldest first
    const sortedComments = data.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    setComments(sortedComments);

    // Automatically mark unseen comments as seen
    const unseenComments = sortedComments.filter(
      (c) =>
        currentUserRole === "MANAGER" &&
        !c.seenByManager &&
        c.author.role !== "MANAGER"
    );

    if (unseenComments.length > 0) {
      await axios.patch(
        `${API_BASE_URL}/comments/${task.id}/seen`,
        {}, // optional payload
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state to reflect seen
      setComments((prev) =>
        prev.map((c) =>
          unseenComments.find((u) => u.id === c.id)
            ? { ...c, seenByManager: true }
            : c
        )
      );
    }
  } catch (err) {
    console.error("Failed to fetch comments", err);
  }
}, [task.id, token, currentUserRole]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

const handleAddComment = async () => {
  if (!newComment.trim()) return;

  try {
    const { data } = await axios.post<Comment>(
      `${API_BASE_URL}/comments/${task.id}`,
      { content: newComment },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Append new comment at the end
    setComments((prev) => [...prev, data]);
    setNewComment("");

    // Optional: mark it as seen immediately for manager role
    if (currentUserRole === "MANAGER" && data.author.role !== "MANAGER") {
      setComments((prev) =>
        prev.map((c) =>
          c.id === data.id ? { ...c, seenByManager: true } : c
        )
      );
    }
  } catch (err) {
    console.error(err);
    alert("Failed to add comment");
  }
};

return (
  <div className="fixed right-6 bottom-6 w-96 h-[480px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-50">
    {/* Header */}
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 flex items-center justify-between">
      <h3 className="font-semibold text-sm truncate">{task.title} — Comments</h3>
      <button
        onClick={onClose}
        className="hover:bg-white/20 rounded-full p-1 transition"
      >
        ✕
      </button>
    </div>

    {/* Chat Messages */}
    <div
      id="comment-container"
      className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50"
    >
      {comments.length === 0 && (
        <p className="text-center text-gray-400 text-sm mt-10">
          No comments yet — start the conversation 👋
        </p>
      )}

      {comments.map((c) => {
        const isOwnRole = c.author.role === currentUserRole;
        const seen =
          currentUserRole === "MANAGER"
            ? c.seenByManager
            : c.seenByAssignee;
        const tickColor = seen ? "text-blue-500" : "text-gray-400";

        return (
          <div
            key={c.id}
            className={`flex ${
              isOwnRole ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm shadow-sm relative ${
                isOwnRole
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-gray-200 text-gray-800 rounded-bl-none"
              }`}
            >
              <p className="break-words">{c.content}</p>

              {/* Timestamp + Seen tick */}
              <div className="flex items-center justify-end gap-1 text-[10px] mt-1 opacity-80">
                <span>
                  {new Date(c.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {isOwnRole && <CheckIcon className={`h-3 w-3 ${tickColor}`} />}
              </div>
            </div>
          </div>
        );
      })}
    </div>

    {/* Input Area */}
    <div className="border-t border-gray-200 p-3 bg-white flex items-center gap-2">
      <Input
        placeholder="Type a message..."
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        className="flex-1 bg-gray-100 focus-visible:ring-1 focus-visible:ring-blue-500 text-sm"
      />
      <Button
        onClick={handleAddComment}
        disabled={!newComment.trim()}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 rounded-xl shadow"
      >
        Send
      </Button>
    </div>
  </div>
);

};

// --- Employee Task View ---
const EmployeeTaskView = ({
  employee,
  allEmployees,
  fetchEmployees,
  setSelectedEmployee,
}: {
  employee: Employee;
  allEmployees: Employee[];
  fetchEmployees: () => Promise<void>;
  setSelectedEmployee: (emp: Employee) => void;
}) => {
  const [loadingTasks, setLoadingTasks] = useState(false);
  const token = localStorage.getItem("token");

  const ongoingTasks = employee.tasks.filter((t) => t.status !== "DONE");
  const completedTasks = employee.tasks.filter((t) => t.status === "DONE");
  const [activeCommentTask, setActiveCommentTask] = useState<Task | null>(null);

  const handleTaskDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    setLoadingTasks(true);
    try {
      await axios.delete(`${API_BASE_URL}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchEmployees();
    } catch (err) {
      console.error(err);
      alert("Failed to delete task");
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleTaskTransfer = async (taskId: string, newEmployeeId: string) => {
    setLoadingTasks(true);
    try {
      await axios.post(
        `${API_BASE_URL}/tasks/${taskId}/transfer`,
        {
          newEmployeeId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchEmployees();
    } catch (err) {
      console.error(err);
      alert("Failed to transfer task");
    } finally {
      setLoadingTasks(false);
    }
  };

  const handlePriorityChange = async (taskId: string, newPriority: string) => {
    setLoadingTasks(true);
    try {
      await axios.patch(
        `${API_BASE_URL}/tasks/${taskId}/priority`,
        { priority: newPriority },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchEmployees();
    } catch (err) {
      console.error(err);
      alert("Failed to update task priority");
    } finally {
      setLoadingTasks(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      {loadingTasks && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-xl">
          <Loader2 className="h-8 w-8 text-[#0000cc] animate-spin" />
        </div>
      )}

      {/* Ongoing Tasks Table */}
      <Card className="flex-1 border-[#0000cc]/20 shadow-sm hover:shadow-md transition-all duration-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2 text-[#0000cc]">
            <AlertCircle className="h-5 w-5 text-red-500" /> Ongoing Tasks (
            {ongoingTasks.length})
          </CardTitle>
          <CardDescription className="text-gray-500">
            Tasks currently assigned, in progress, or on hold.
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0000cc]/10 text-[#0000cc] uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-3">Task</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Priority</th>
                <th className="px-6 py-3">Due Date</th>
                <th className="px-6 py-3">Manager File</th>
                <th className="px-6 py-3">Operations File</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ongoingTasks.map((task: any) => (
                <tr
                  key={task.id}
                  className="border-b last:border-b-0 hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {task.title}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="default"
                      className={getStatusBadgeClass(task.status)}
                    >
                      {task.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Select
                      value={task.priority}
                      onValueChange={(v) => handlePriorityChange(task.id, v)}
                    >
                      <SelectTrigger
                        className={`w-[90px] text-white text-xs font-medium rounded-full border-0 ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white shadow-lg rounded-md">
                        <SelectItem
                          value="HIGH"
                          className="text-red-600 cursor-pointer hover:bg-red-50"
                        >
                          High
                        </SelectItem>
                        <SelectItem
                          value="MEDIUM"
                          className="text-amber-600 cursor-pointer hover:bg-amber-50"
                        >
                          Medium
                        </SelectItem>
                        <SelectItem
                          value="LOW"
                          className="text-blue-700 cursor-pointer hover:bg-blue-50"
                        >
                          Low
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-6 py-4">
                    {task.fileUrl_manager ? (
                      <a
                        href={task.fileUrl_manager}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 font-medium hover:underline"
                      >
                        View File
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {task.fileUrl_operator ? (
                      <a
                        href={task.fileUrl_operator}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-600 font-medium hover:underline"
                      >
                        View File
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <TaskActionMenu
                      task={task}
                      currentEmployeeId={employee.id}
                      onTaskTransfer={handleTaskTransfer}
                      onTaskDelete={handleTaskDelete}
                      employees={allEmployees}
                      setActiveCommentTask={setActiveCommentTask}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {ongoingTasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <ListChecks className="h-6 w-6 mx-auto mb-2 text-[#0000cc]" />
              <p className="font-medium">
                All clear! No ongoing tasks for this employee.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Completed Tasks Summary */}
      <Card className="p-4 bg-green-50 border-green-300 shadow-sm">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-green-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Completed Tasks:{" "}
            <span className="text-xl font-bold">{completedTasks.length}</span>
          </h4>
        </div>
      </Card>

      {activeCommentTask && (
        <TaskCommentPanel
          task={activeCommentTask}
          onClose={() => setActiveCommentTask(null)}
        />
      )}
    </div>
  );
};

// --- Employee Calendar View ---
const EmployeeCalendarView = ({ employee }: { employee: Employee }) => {
  // Simple check for valid date to avoid showing 'Invalid Date'
  const isValidDate = (date: any) => date && !isNaN(new Date(date).getTime());

  const completedTasks = employee.tasks.filter(
    (t) => t.status === "DONE" && isValidDate(t.dueDate)
  );
  // Create a sorted list of unique completion dates
  const completedDates = [
    ...new Set(completedTasks.map((t) => t.dueDate)),
  ].sort();

  return (
    <Card className="h-full border-[#0000cc]/20 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-2 text-[#0000cc]">
          <CalendarDays className="h-5 w-5 text-red-500" />
          Completed Task Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-y-auto max-h-[calc(100vh-350px)]">
        {completedDates.length > 0 ? (
          <div className="space-y-4">
            {completedDates.map((date) => (
              <div
                key={date}
                className="border-l-4 border-green-500 pl-4 py-3 bg-green-50 rounded-r-md shadow-sm"
              >
                <p className="font-bold text-base mb-1 text-green-800">
                  {new Date(date as string).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <ul className="text-sm text-green-700 list-disc list-inside space-y-1">
                  {completedTasks
                    .filter((t) => t.dueDate === date)
                    .map((task) => (
                      <li key={task.id} className="text-green-700/90">
                        {task.title}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500/80" />
            <p className="font-medium">No completed tasks on record.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// --- Main Dashboard ---
export function EmployeeManagerDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"calendar" | "task">("task");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [form, setForm] = useState({
    title: "",
    notes: "",
    dueDate: "",
    priority: "MEDIUM",
    assignedHours: "",
    assigneeEmployeeId: "",
    file: null as File | null,
  });

  const token = localStorage.getItem("token");

  // Fetch Employees with Tasks
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get<EmployeeResponse>(
        `${API_BASE_URL}/employees/employees`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEmployees(data.employees);
    } catch (err) {
      console.error(err);
      setError(
        "Failed to load employee data. Check server connection or token."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Handle selected employee persistence/update
  useEffect(() => {
    if (employees.length > 0) {
      const existing = employees.find((emp) => emp.id === selectedEmployee?.id);
      if (existing) {
        setSelectedEmployee(existing);
      } else {
        setSelectedEmployee(employees[0]);
      }
    } else {
      setSelectedEmployee(null);
    }
  }, [employees]);

  // Form Handlers
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }));
  };

  const resetForm = () => {
    setForm({
      title: "",
      notes: "",
      dueDate: "",
      priority: "MEDIUM",
      assignedHours: "",
      assigneeEmployeeId: "",
      file: null,
    });
  };

  // Create Task Logic
  const handleCreateTask = async () => {
    if (!form.title.trim() || !form.assigneeEmployeeId) {
      alert("Task Title and Assignee are required!");
      return;
    }

    setIsCreating(true);

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      if (form.notes) formData.append("notes", form.notes);
      if (form.dueDate) formData.append("dueDate", form.dueDate);
      formData.append("priority", form.priority);
      if (form.assignedHours)
        formData.append("assignedHours", form.assignedHours);
      formData.append("assigneeEmployeeId", form.assigneeEmployeeId);
      if (form.file) formData.append("file", form.file);

      await axios.post(`${API_BASE_URL}/tasks/create`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Task created successfully!");
      setIsDialogOpen(false);
      resetForm();
      await fetchEmployees();
    } catch (err: any) {
      console.error(err);
      const errorMessage =
        err.response?.data?.error || "An unknown error occurred.";
      alert(`Failed to create task: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Loading and Error States
  if (loading)
    return (
      <Layout role="manager">
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <ThreeDot
            variant="bounce"
            color={["#0000CC", "#D70707"]}
            size="medium"
          />
        </div>
      </Layout>
    );

  if (error)
    return (
      <Layout role="manager">
        <div className="flex items-center justify-center h-[calc(100vh-80px)] p-6">
          <Card className="w-full max-w-lg p-6 text-center border-red-500 bg-red-50 shadow-xl">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
            <CardTitle
              className="text-2xl font-bold mb-2"
              style={{ color: "#0000cc" }}
            >
              Data Loading Failed
            </CardTitle>
            <CardDescription className="text-red-800 mb-4">
              {
                "We're having trouble loading the dashboard data right now. Please try refreshing the page."
              }
            </CardDescription>
            <Button
              onClick={() => window.location.reload()}
              className="gap-2 bg-[#0000cc] hover:bg-[#0000cc]/90 text-white rounded-lg shadow-md"
            >
              <Zap className="h-4 w-4 text-red-500" />
              Try Refreshing
            </Button>
          </Card>
        </div>
      </Layout>
    );

  return (
    <Layout role="manager">
      <div className="space-y-8 min-h-screen">
        {/* Header and Controls */}
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold text-[#0000cc]">
              Team Manager Console
            </h1>
            <p className="text-gray-500">
              Oversee team assignments and performance in a single view.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Create Task Dialog (Redesigned with colors) */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="gap-2 bg-[#0000cc] hover:bg-[#0000cc]/90 text-white rounded-lg shadow-md"
                >
                  <Plus className="h-5 w-5 text-red-500" /> Create Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-white rounded-xl shadow-xl">
                <DialogHeader>
                  <DialogTitle className="text-[#0000cc]">
                    Assign New Task
                  </DialogTitle>
                  <DialogDescription>
                    Fill in the required details to create and assign a new
                    task.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-4 py-2 md:grid-cols-2">
                  {/* Title */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="title" className="text-gray-700">
                      Title*
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      value={form.title}
                      onChange={handleFormChange}
                      placeholder="E.g., Finalize Q3 budget report"
                      required
                      className="border-gray-300 focus:border-[#0000cc]"
                    />
                  </div>

                  {/* Assign To */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="assigneeEmployeeId"
                      className="text-gray-700"
                    >
                      Assign To*
                    </Label>
                    <Select
                      value={form.assigneeEmployeeId}
                      onValueChange={(v) =>
                        handleSelectChange("assigneeEmployeeId", v)
                      }
                    >
                      <SelectTrigger
                        id="assigneeEmployeeId"
                        className="border-gray-300 focus:ring-[#0000cc]"
                      >
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={String(emp.id)}>
                            {emp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-gray-700">
                      Priority
                    </Label>
                    <Select
                      value={form.priority}
                      onValueChange={(v) => handleSelectChange("priority", v)}
                    >
                      <SelectTrigger
                        id="priority"
                        className="border-gray-300 focus:ring-[#0000cc]"
                      >
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Due Date */}
                  <div className="space-y-2">
                    <Label htmlFor="dueDate" className="text-gray-700">
                      Due Date
                    </Label>
                    <Input
                      id="dueDate"
                      name="dueDate"
                      type="date"
                      value={form.dueDate}
                      onChange={handleFormChange}
                      className="border-gray-300 focus:border-[#0000cc]"
                    />
                  </div>

                  {/* Assigned Hours */}
                  <div className="space-y-2">
                    <Label htmlFor="assignedHours" className="text-gray-700">
                      Assigned Hours (Hrs)
                    </Label>
                    <Input
                      id="assignedHours"
                      name="assignedHours"
                      type="number"
                      value={form.assignedHours}
                      onChange={handleFormChange}
                      placeholder="e.g., 8.0"
                      step="0.5"
                      className="border-gray-300 focus:border-[#0000cc]"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes" className="text-gray-700">
                      Notes
                    </Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={form.notes}
                      onChange={handleFormChange}
                      placeholder="Detailed description of the task..."
                      rows={3}
                      className="border-gray-300 focus:border-[#0000cc]"
                    />
                  </div>

                  {/* File */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="file" className="text-gray-700">
                      Attachment (optional)
                    </Label>
                    <Input
                      id="file"
                      name="file"
                      type="file"
                      onChange={handleFileChange}
                      className="border-gray-300 focus:border-[#0000cc]"
                    />
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button
                    onClick={handleCreateTask}
                    disabled={
                      !form.title.trim() ||
                      !form.assigneeEmployeeId ||
                      isCreating
                    }
                    className="bg-[#0000cc] hover:bg-[#0000cc]/90 text-white"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin text-red-500" />
                        Creating...
                      </>
                    ) : (
                      "Create Task"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Total Employees Stat Card (Mini) */}
            <Card className="p-4 bg-[#0000cc]/10 border border-[#0000cc]/30 shadow-sm">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-red-500" />{" "}
                {/* Red icon for accent */}
                <div>
                  <div className="text-xs font-medium text-gray-600">
                    Total Employees
                  </div>
                  <div className="text-2xl font-bold text-[#0000cc]">
                    {employees.length}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 xl:grid-cols-4 gap-6 h-[calc(100vh-160px)]">
          {/* Employee List (Column 1) */}
          <Card className="lg:col-span-1 p-4 overflow-y auto shadow-lg border-[#0000cc]/20">
            <CardHeader className="px-2 pt-1 pb-4">
              <CardTitle className="text-xl text-[#0000cc]">
                Team Roster
              </CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className={`p-3 rounded-lg cursor-pointer flex items-center justify-between transition-all duration-150 ${
                    selectedEmployee?.id === emp.id
                      ? "bg-[#0000cc] text-white shadow-md"
                      : "hover:bg-gray-100 border border-gray-200"
                  }`}
                  onClick={() => setSelectedEmployee(emp)}
                >
                  <div className="flex items-center gap-3">
                    <User
                      className={`h-5 w-5 ${
                        selectedEmployee?.id === emp.id
                          ? "text-red-500" // Red icon on blue background
                          : "text-[#0000cc]" // Blue icon
                      }`}
                    />
                    <div>
                      <h4 className="font-semibold leading-none">{emp.name}</h4>
                      <p
                        className={`text-sm ${
                          selectedEmployee?.id === emp.id
                            ? "text-white/80"
                            : "text-gray-500"
                        }`}
                      >
                        {emp.role}
                      </p>
                    </div>
                  </div>
                  {selectedEmployee?.id === emp.id && (
                    <ArrowRight className="h-4 w-4 text-red-500" />
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Employee Detail/Tabs (Columns 2-4) */}
          <div className="lg:col-span-2 xl:col-span-3">
            {selectedEmployee ? (
              <Card className="h-full flex flex-col shadow-lg border-[#0000cc]/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <h2 className="text-2xl font-bold text-[#0000cc]">
                      {selectedEmployee.name}'s Performance
                    </h2>
                    <p className="text-gray-500">
                      {selectedEmployee.role} | {selectedEmployee.email}
                    </p>
                  </div>
                </CardHeader>
                <Tabs
                  value={activeTab}
                  onValueChange={(value) =>
                    setActiveTab(value as "calendar" | "task")
                  }
                  className="flex flex-col flex-1"
                >
                  <CardHeader className="pt-2 pb-0">
                    <TabsList className="grid w-[300px] grid-cols-2 bg-gray-100 p-1">
                      <TabsTrigger
                        value="calendar"
                        className="data-[state=active]:bg-[#0000cc] data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-gray-600"
                      >
                        <CalendarDays className="h-4 w-4 mr-2" />
                        Task Log
                      </TabsTrigger>
                      <TabsTrigger
                        value="task"
                        className="data-[state=active]:bg-[#0000cc] data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-gray-600"
                      >
                        <FolderKanban className="h-4 w-4 mr-2" />
                        Active Tasks
                      </TabsTrigger>
                    </TabsList>
                  </CardHeader>
                  <Separator className="my-0" />
                  <CardContent className="p-6 flex-1 overflow-y-auto">
                    <TabsContent value="calendar" className="h-full m-0">
                      <EmployeeCalendarView employee={selectedEmployee} />
                    </TabsContent>
                    <TabsContent value="task" className="h-full m-0">
                      <EmployeeTaskView
                        employee={selectedEmployee}
                        setSelectedEmployee={setSelectedEmployee}
                        allEmployees={employees}
                        fetchEmployees={fetchEmployees}
                      />
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-gray-500 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                <p className="p-10 text-lg font-medium">
                  👈 Select an employee from the roster to view their details
                  and tasks.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
