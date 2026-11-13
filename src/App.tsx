import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldAlert, Landmark, FileText, Send, CheckCircle2, History, Users,
  Search, Filter, ThumbsUp, AlertTriangle, Cpu, Star, ExternalLink,
  Bell, Check, LogOut, ArrowRight, CornerDownRight, Upload, X,
  Building, Library, Server, Activity, GraduationCap, HardHat, Info,
  CheckCircle, RefreshCw, Layers, Sparkles, MessageSquare, ShieldCheck,
  Sun, Moon, Trash2, Pencil, Lock, Eye, EyeOff
} from "lucide-react";
import { Student, Complaint, SystemNotification, Category, Department, ComplaintStatus } from "./types";

const ROUTING_MAP: Record<Category, Department> = {
  'Hostel': 'Hostel Office',
  'IT Department': 'IT Support Staff',
  'Library': 'Library Staff',
  'Anti-Ragging': 'Anti-Ragging Cell',
  'Academics': 'Academic Dean Office',
  'Infrastructure': 'Estate & Maintenance',
  'Other': 'Academic Dean Office'
};

export default function App() {
  // Login / Role States
  const [authUsn, setAuthUsn] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [showPasswordVal, setShowPasswordVal] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>("");

  // Admin access validation states
  const [showAdminLogin, setShowAdminLogin] = useState<boolean>(false);
  const [adminUsername, setAdminUsername] = useState<string>("");
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [adminError, setAdminError] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("app_theme") === "dark";
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("app_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("app_theme", "light");
    }
  }, [isDarkMode]);

  // Roster listing from Backend
  const [studentRoster, setStudentRoster] = useState<Student[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [confirmDeleteUsn, setConfirmDeleteUsn] = useState<string | null>(null);
  const [rosterSearch, setRosterSearch] = useState<string>("");
  const [rosterSubmitting, setRosterSubmitting] = useState<boolean>(false);

  // Dynamic student register authorization states
  const [newStudentUsn, setNewStudentUsn] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentClass, setNewStudentClass] = useState("4th Semester");
  const [newStudentSec, setNewStudentSec] = useState("A");
  const [newStudentDept, setNewStudentDept] = useState("Computer Science & Engineering");
  const [newStudentPassword, setNewStudentPassword] = useState("");
  const [rosterStatusMsg, setRosterStatusMsg] = useState("");
  const [rosterErrorMsg, setRosterErrorMsg] = useState("");

  // Core Complaint States
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const notificationsRef = useRef<SystemNotification[]>([]);
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);
  
  // Student Form States
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("Hostel");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Student Navigation / Interaction Tabs
  const [studentTab, setStudentTab] = useState<'submit' | 'history' | 'browse'>('submit');

  // New feedback on Resolved tickets
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackComments, setFeedbackComments] = useState<string>("");
  const [feedbackActiveId, setFeedbackActiveId] = useState<string | null>(null);

  // Admin Navigation / Interaction Tabs
  const [adminTab, setAdminTab] = useState<'board' | 'analytics' | 'roster'>('board');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [statusDraft, setStatusDraft] = useState<ComplaintStatus>("Pending");
  const [adminNotesDraft, setAdminNotesDraft] = useState("");
  const [deptDraft, setDeptDraft] = useState<Department>("Hostel Office");

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterDepartment, setFilterDepartment] = useState<string>("All");
  const [filterEscalation, setFilterEscalation] = useState<string>("All");

  // Notification Toast simulation
  const [toastNotif, setToastNotif] = useState<SystemNotification | null>(null);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  // Gemini AI Diagnostics State (Admin Drawer)
  const [aiAdvice, setAiAdvice] = useState<{
    threatLevel: string;
    suggestedRouting: string;
    actionSteps: string[];
    draftReply: string;
  } | null>(null);
  const [aiSimulated, setAiSimulated] = useState<boolean>(false);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>("");

  const showToast = (title: string, message: string, type: 'info' | 'success' | 'alert' = 'info') => {
    setToastNotif({
      id: `toast_${Date.now()}`,
      title,
      message,
      timestamp: new Date().toISOString(),
      type,
      read: false
    });
    setTimeout(() => {
      setToastNotif(null);
    }, 5000);
  };

  // Drag and drop border highlight state
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // LIFE CYCLE & INITIAL DATA FETCHING
  // -------------------------------------------------------------
  const fetchComplaints = async () => {
    try {
      const res = await fetch("/api/complaints");
      if (res.ok) {
        const data = await res.json();
        setComplaints(data);
        localStorage.setItem("campus_complaints_backup", JSON.stringify(data));
      }
    } catch (e) {
      console.error("Error fetching complaints", e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error("Error fetching notifications", e);
    }
  };

  const fetchRoster = async () => {
    try {
      const res = await fetch("/api/students");
      if (res.ok) {
        const data = await res.json();
        setStudentRoster(data);
        localStorage.setItem("campus_roster_backup", JSON.stringify(data));
      }
    } catch (e) {
      console.error("Error retrieving student roster", e);
    }
  };

  // Run on mount with automatic self-healing sync
  useEffect(() => {
    const performInitialSync = async () => {
      try {
        const backupRosterStr = localStorage.getItem("campus_roster_backup");
        const backupComplaintsStr = localStorage.getItem("campus_complaints_backup");
        
        const localStudents: Student[] = backupRosterStr ? JSON.parse(backupRosterStr) : [];
        const localComplaints: Complaint[] = backupComplaintsStr ? JSON.parse(backupComplaintsStr) : [];

        const res = await fetch("/api/sync-restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            students: localStudents,
            complaints: localComplaints
          })
        });

        if (res.ok) {
          const mergedData = await res.json();
          if (Array.isArray(mergedData.students) && mergedData.students.length > 0) {
            setStudentRoster(mergedData.students);
            localStorage.setItem("campus_roster_backup", JSON.stringify(mergedData.students));
          }
          if (Array.isArray(mergedData.complaints) && mergedData.complaints.length > 0) {
            setComplaints(mergedData.complaints);
            localStorage.setItem("campus_complaints_backup", JSON.stringify(mergedData.complaints));
          }
        } else {
          await fetchComplaints();
          await fetchRoster();
        }
      } catch (err) {
        console.warn("Handshake fail, fetching snapshot instead:", err);
        await fetchComplaints();
        await fetchRoster();
      }
      await fetchNotifications();
    };

    performInitialSync();

    // Set up polling (every 12 seconds) to simulate real-time notification alerts
    const interval = setInterval(() => {
      // Quietly refresh backend logs in background
      fetchComplaints();
      
      // Fetch latest notifications and check if any new unread notification needs to trigger an in-app popup
      fetch("/api/notifications")
        .then(res => res.json())
        .then((newNotifs: SystemNotification[]) => {
          const prevNotifs = notificationsRef.current;
          if (newNotifs.length > 0 && prevNotifs.length > 0) {
            const firstNew = newNotifs[0];
            const firstOld = prevNotifs[0];
            // If there's a fresh unread notification, trigger a visual alert toast!
            if (firstNew.id !== firstOld.id && !firstNew.read) {
              setToastNotif(firstNew);
              setTimeout(() => {
                setToastNotif(null);
              }, 6000);
            }
          }
          setNotifications(newNotifs);
        }).catch(err => console.warn(err));

    }, 12000);

    return () => clearInterval(interval);
  }, []);

  // Synchronize detailed selection details when updated remotely
  useEffect(() => {
    if (selectedComplaint) {
      const fresh = complaints.find(c => c.id === selectedComplaint.id);
      if (fresh) {
        setSelectedComplaint(fresh);
      }
    }
  }, [complaints, selectedComplaint]);

  // -------------------------------------------------------------
  // USER ACTIONS
  // -------------------------------------------------------------
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const usnVal = authUsn.trim().toUpperCase();
    if (!usnVal) {
      setLoginError("Please enter your USN registration number.");
      return;
    }
    if (!authPassword) {
      setLoginError("Please enter your personal account password.");
      return;
    }

    try {
      const res = await fetch("/api/students/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usn: usnVal, password: authPassword })
      });

      if (!res.ok) {
        const err = await res.json();
        setLoginError(err.error || "Login Verification Failed.");
        return;
      }

      const data = await res.json();
      setCurrentUser(data.student);
      setIsAdmin(false);
      setStudentTab("submit");
      // clear credentials on success
      setAuthUsn("");
      setAuthPassword("");
    } catch (err) {
      setLoginError("Failed to reach college login portal.");
    }
  };

  const handleAdminVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");
    const uName = adminUsername.trim().toLowerCase();
    if (uName === "admin" && adminPassword === "Admin123") {
      setIsAdmin(true);
      setCurrentUser(null);
      setAdminTab("board");
      setLoginError("");
      setAdminError("");
      setAdminPassword("");
      setAdminUsername("");
      // Clear usn login credentials
      setAuthUsn("");
    } else {
      setAdminError("Invalid Administrator credentials. Username and password do not match.");
    }
  };

  const handleAuthorizeOrUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setRosterStatusMsg("");
    setRosterErrorMsg("");

    const usnTrimmed = newStudentUsn.trim().toUpperCase();
    const nameTrimmed = newStudentName.trim();

    if (!usnTrimmed || !nameTrimmed) {
      setRosterErrorMsg("Please enter both Student USN and Student Full Name.");
      return;
    }

    setRosterSubmitting(true);
    try {
      if (editingStudent) {
        // Update Mode
        const res = await fetch(`/api/students/${encodeURIComponent(editingStudent.usn)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nameTrimmed,
            class: newStudentClass,
            section: newStudentSec,
            department: newStudentDept,
            password: newStudentPassword
          })
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setRosterErrorMsg(data.error || "Failed to update student details.");
          return;
        }

        if (Array.isArray(data.students)) {
          setStudentRoster(data.students);
          localStorage.setItem("campus_roster_backup", JSON.stringify(data.students));
        } else {
          await fetchRoster();
        }

        setRosterStatusMsg(`Updated student ${editingStudent.usn} successfully!`);
        showToast("Student Updated", `Account details saved for ${editingStudent.usn}.`, "success");
        setEditingStudent(null);
        setNewStudentUsn("");
        setNewStudentName("");
        setNewStudentClass("4th Semester");
        setNewStudentSec("A");
        setNewStudentDept("Computer Science & Engineering");
        setNewStudentPassword("");
      } else {
        // Create Mode
        const res = await fetch("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usn: usnTrimmed,
            name: nameTrimmed,
            class: newStudentClass,
            section: newStudentSec,
            department: newStudentDept,
            password: newStudentPassword
          })
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setRosterErrorMsg(data.error || "Failed to authorize student account.");
          return;
        }

        if (Array.isArray(data.students)) {
          setStudentRoster(data.students);
          localStorage.setItem("campus_roster_backup", JSON.stringify(data.students));
        } else {
          await fetchRoster();
        }

        setRosterStatusMsg(`Authorized student ${usnTrimmed} successfully!`);
        showToast("Student Authorized", `${nameTrimmed} (${usnTrimmed}) can now log in.`, "success");
        setNewStudentUsn("");
        setNewStudentName("");
        setNewStudentPassword("");
      }
    } catch (err) {
      setRosterErrorMsg("Error submitting student details. Please verify server connection.");
    } finally {
      setRosterSubmitting(false);
    }
  };

  const startEditingStudent = (student: Student) => {
    setEditingStudent(student);
    setConfirmDeleteUsn(null);
    setNewStudentUsn(student.usn);
    setNewStudentName(student.name);
    setNewStudentClass(student.class);
    setNewStudentSec(student.section);
    setNewStudentDept(student.department);
    setNewStudentPassword(student.password || "123456");
    setRosterStatusMsg("");
    setRosterErrorMsg("");
  };

  const cancelEditingStudent = () => {
    setEditingStudent(null);
    setNewStudentUsn("");
    setNewStudentName("");
    setNewStudentClass("4th Semester");
    setNewStudentSec("A");
    setNewStudentDept("Computer Science & Engineering");
    setNewStudentPassword("");
    setRosterStatusMsg("");
    setRosterErrorMsg("");
  };

  const executeDeleteStudent = async (usn: string) => {
    setRosterStatusMsg("");
    setRosterErrorMsg("");
    setRosterSubmitting(true);
    try {
      const res = await fetch(`/api/students/${encodeURIComponent(usn)}`, {
        method: "DELETE"
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRosterErrorMsg(data.error || "Failed to delete student.");
        return;
      }

      if (Array.isArray(data.students)) {
        setStudentRoster(data.students);
        localStorage.setItem("campus_roster_backup", JSON.stringify(data.students));
      } else {
        await fetchRoster();
      }

      setConfirmDeleteUsn(null);
      setRosterStatusMsg(`De-authorized student ${usn} successfully!`);
      showToast("Student Removed", `USN ${usn} has been de-authorized.`, "info");
      if (editingStudent && editingStudent.usn === usn) {
        cancelEditingStudent();
      }
    } catch (err) {
      setRosterErrorMsg("Error removing student authorization.");
    } finally {
      setRosterSubmitting(false);
    }
  };

  const handleViewStudentComplaints = (studentUsn: string) => {
    setSearchQuery(studentUsn);
    setFilterStatus("All");
    setFilterCategory("All");
    setFilterDepartment("All");
    setFilterEscalation("All");
    setAdminTab('board');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdmin(false);
    setSelectedComplaint(null);
    setAuthUsn("");
    setAdminPassword("");
    setAdminUsername("");
    setAdminError("");
    setShowAdminLogin(false);
  };

  // Image manipulation utilities (Base64 conversion)
  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Unsupported File", "Only PNG, JPEG, SVG or WebP images are permitted.", "alert");
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setUploadedImage(reader.result as string);
    };
    reader.onerror = (err) => {
      console.error(err);
    };
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Submit Complaint
  const handleNewComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!newTitle.trim() || !newDescription.trim()) {
      showToast("Missing Details", "Please complete both Title and Description fields.", "alert");
      return;
    }

    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          category: newCategory,
          isAnonymous,
          isEscalated,
          studentUsn: currentUser.usn,
          imageUrl: uploadedImage || undefined
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast("Submission Failed", err.error || "Failed to submit ticket.", "alert");
        return;
      }

      // Success
      setSubmitSuccess(true);
      setNewTitle("");
      setNewDescription("");
      setIsAnonymous(false);
      setIsEscalated(false);
      setUploadedImage(null);
      fetchComplaints();
      fetchNotifications();

      setTimeout(() => {
        setSubmitSuccess(false);
        setStudentTab("history"); // Redirect to history page to view submission
      }, 2500);

    } catch (err) {
      showToast("Network Error", "Error submitting complaint.", "alert");
    }
  };

  // Upvote/Downvote complaint
  const handleUpvote = async (compId: string) => {
    const studentUsn = currentUser?.usn || "GUEST_ADMIN";
    try {
      const res = await fetch(`/api/complaints/${compId}/upvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentUsn })
      });

      if (res.ok) {
        fetchComplaints();
        fetchNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Feedback Post-Resolution (Student view)
  const submitFeedback = async (compId: string) => {
    try {
      const res = await fetch(`/api/complaints/${compId}/feedback`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: feedbackRating,
          comments: feedbackComments
        })
      });

      if (res.ok) {
        setFeedbackActiveId(null);
        setFeedbackComments("");
        setFeedbackRating(5);
        fetchComplaints();
        fetchNotifications();
        showToast("Feedback Saved", "Thank you for rating your resolution experience!", "success");
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast("Feedback Error", errorData.error || "Feedback upload failed.", "alert");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mark all notifications read
  const handleMarkNotificationsRead = async () => {
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usn: currentUser?.usn || undefined })
      });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // ADMINISTRATIVE ACTIONS
  // -------------------------------------------------------------
  const handleComplaintSelect = (comp: Complaint) => {
    setSelectedComplaint(comp);
    setStatusDraft(comp.status);
    setAdminNotesDraft(comp.adminNotes || "");
    setDeptDraft(comp.department);
    setAiAdvice(null);
    setAiError("");
    setAiSimulated(false);
  };

  const handleFetchAiAdvice = async (complaintId: string) => {
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch(`/api/complaints/${encodeURIComponent(complaintId)}/ai-advice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAiError(data.error || "Failed to generate AI diagnostic evaluation.");
        return;
      }
      setAiAdvice(data.advice);
      setAiSimulated(!!data.simulated);
    } catch (err) {
      setAiError("Unable to reach AI diagnostic service.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedComplaint) return;
    try {
      const res = await fetch(`/api/complaints/${selectedComplaint.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusDraft,
          adminNotes: adminNotesDraft
        })
      });

      if (res.ok) {
        fetchComplaints();
        fetchNotifications();
        showToast("Status Updated", "Ticket status updated and student notified!", "success");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReassignDept = async () => {
    if (!selectedComplaint) return;
    try {
      const res = await fetch(`/api/complaints/${selectedComplaint.id}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department: deptDraft
        })
      });

      if (res.ok) {
        fetchComplaints();
        fetchNotifications();
        showToast("Department Reassigned", `Ticket transferred to ${deptDraft}.`, "success");
      }
    } catch (e) {
      console.error(e);
    }
  };



  // -------------------------------------------------------------
  // COMPUTED STATS AND FILTERS
  // -------------------------------------------------------------
  const filteredComplaints = complaints.filter(comp => {
    const matchesSearch =
      comp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.studentUsn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filterCategory === "All" || comp.category === filterCategory;
    const matchesStatus = filterStatus === "All" || comp.status === filterStatus;
    const matchesDept = filterDepartment === "All" || comp.department === filterDepartment;
    
    let matchesEscalation = true;
    if (filterEscalation === "Escalated Only") {
      matchesEscalation = comp.isEscalated;
    } else if (filterEscalation === "Regular Only") {
      matchesEscalation = !comp.isEscalated;
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesDept && matchesEscalation;
  });

  // Notifications filtering based on role
  const filteredNotifications = notifications.filter(notif => {
    if (isAdmin) {
      return true; // Admin sees ALL notifications for optimal tracking
    } else {
      return !notif.forUsn || notif.forUsn === currentUser?.usn; // Students see general alerts + theirs
    }
  });

  const unreadNotificationsCount = filteredNotifications.filter(n => !n.read).length;

  // Visual Helper Category Icon/Color
  const getCategoryDetails = (cat: Category) => {
    switch (cat) {
      case "Hostel":
        return { color: "bg-teal-50 border-teal-200 text-teal-700", icon: <Building className="w-4 h-4" /> };
      case "IT Department":
        return { color: "bg-indigo-50 border-indigo-200 text-indigo-700", icon: <Server className="w-4 h-4" /> };
      case "Library":
        return { color: "bg-blue-50 border-blue-200 text-blue-700", icon: <Library className="w-4 h-4" /> };
      case "Anti-Ragging":
        return { color: "bg-rose-50 border-rose-200 text-rose-700", icon: <ShieldAlert className="w-4 h-4" /> };
      case "Academics":
        return { color: "bg-amber-50 border-amber-200 text-amber-700", icon: <GraduationCap className="w-4 h-4" /> };
      case "Infrastructure":
        return { color: "bg-emerald-50 border-emerald-200 text-emerald-700", icon: <HardHat className="w-4 h-4" /> };
      default:
        return { color: "bg-slate-50 border-slate-200 text-slate-700", icon: <Info className="w-4 h-4" /> };
    }
  };

  // Visual Helper Status Badge
  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case "Pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Under Review":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "In Progress":
        return "bg-sky-100 text-sky-800 border-sky-300";
      case "Resolved":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Escalated":
        return "bg-rose-100 text-rose-800 border-rose-200 animate-pulse";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  // Analytics Computation Constants
  const totalComplaints = complaints.length;
  const pendingCount = complaints.filter(c => c.status === "Pending").length;
  const resolvedCount = complaints.filter(c => c.status === "Resolved").length;
  const reviewCount = complaints.filter(c => c.status === "Under Review" || c.status === "In Progress").length;
  const escalatedCount = complaints.filter(c => c.isEscalated).length;

  const averageRating = complaints.filter(c => c.feedback).length
    ? (complaints.reduce((acc, c) => acc + (c.feedback?.rating || 0), 0) / complaints.filter(c => c.feedback).length).toFixed(1)
    : "N/A";

  // Category counts computed for responsive dashboard pillars
  const categoriesList: Category[] = ["Hostel", "IT Department", "Library", "Anti-Ragging", "Academics", "Infrastructure", "Other"];
  const categoryCounts = categoriesList.map(cat => ({
    name: cat,
    count: complaints.filter(c => c.category === cat).length
  }));
  const maxCategoryCount = Math.max(...categoryCounts.map(c => c.count), 1);

  return (
    <div className={`min-h-screen flex flex-col selection:bg-indigo-100 selection:text-indigo-900 transition-colors duration-150 ${isDarkMode ? "dark bg-slate-950 text-slate-100" : "bg-slate-50/60 text-slate-900"}`}>
      
      {/* -------------------------------------------------------------
          TOP BAR & NAVIGATION HEADER
         ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2.5 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Smart Complaint Portal
              <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-indigo-50 border border-indigo-200 text-indigo-700 rounded">
                v2.5 AI
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium font-mono">Academic Security & Transit-Route Office</p>
          </div>
        </div>

        {/* User Context Info OR Login Indicator & Theme Toggle */}
        <div className="flex items-center gap-3">
          {/* Theme Toggler Button */}
          <button
            id="theme_mode_toggle"
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center justify-center border border-slate-200/40"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {(currentUser || isAdmin) ? (
            <div className="flex items-center gap-4">
              
              {/* Real-time Notification bell with Dropdown */}
              <div className="relative">
                <button 
                  id="notif_bell_btn"
                  onClick={() => {
                    setShowNotificationCenter(!showNotificationCenter);
                    if (!showNotificationCenter) {
                      handleMarkNotificationsRead();
                    }
                  }}
                  className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white font-mono text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold animate-bounce ring-2 ring-white dark:ring-slate-900">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {/* Notification Overlay Menu */}
                <AnimatePresence>
                  {showNotificationCenter && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowNotificationCenter(false)} 
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 15 }}
                        className="absolute right-0 mt-3.5 w-80 sm:w-96 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-20 overflow-hidden"
                      >
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/60 dark:border-slate-700 flex justify-between items-center">
                          <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">Direct Portal Alerts</span>
                          <button
                            onClick={handleMarkNotificationsRead}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline hover:text-indigo-800 cursor-pointer"
                          >
                            Mark all as read
                          </button>
                        </div>
                        <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-750">
                          {filteredNotifications.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 text-xs dark:text-slate-500">
                              No notifications at this moment. You are up to date!
                            </div>
                          ) : (
                            filteredNotifications.map((notif) => (
                              <div 
                                key={notif.id} 
                                className={`p-4 transition-colors ${notif.read ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/70 dark:bg-slate-800/40 border-l-2 border-indigo-500'}`}
                              >
                                <div className="flex justify-between items-start mb-1 gap-2">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{notif.title}</span>
                                    {notif.forUsn && (
                                      <span className="text-[9px] px-1.5 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-slate-800 dark:text-indigo-400 rounded border border-indigo-100 dark:border-slate-750 font-mono self-start font-bold">
                                        Origin USN: {notif.forUsn}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex-shrink-0">
                                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 pr-4 leading-relaxed">{notif.message}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile pill */}
              <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-1.5 pr-3 rounded-full border border-slate-200 dark:border-slate-700">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center uppercase shadow">
                  {isAdmin ? "AD" : currentUser?.name.substring(0, 2)}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 font-sans tracking-tight leading-none mb-1">
                    {isAdmin ? "Administrator Access" : currentUser?.name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium font-mono uppercase tracking-wider leading-none">
                    {isAdmin ? "Super Dean Mode" : `${currentUser?.usn} | Sec ${currentUser?.section}`}
                  </p>
                </div>
                <button 
                  id="logout_btn"
                  onClick={handleLogout}
                  title="Log Out of Portal"
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-full hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4 animate-pulse" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 font-mono tracking-widest uppercase hidden sm:block">SECURE PORTAL</div>
          )}
        </div>
      </header>

      {/* Real-time Pop toast notification banner */}
      <AnimatePresence>
        {toastNotif && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -40 }}
            className="fixed top-22 left-6 right-6 sm:left-auto sm:right-6 sm:w-96 bg-slate-900 text-white p-4 rounded-xl shadow-2xl z-50 flex gap-3.5 border border-slate-800"
          >
            <div className="text-emerald-400 bg-emerald-500/10 p-1.5 rounded-lg flex items-center justify-center self-start">
              <Bell className="w-5 h-5 animate-swing" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-slate-100">{toastNotif.title}</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{toastNotif.message}</p>
            </div>
            <button onClick={() => setToastNotif(null)} className="text-slate-400 hover:text-white cursor-pointer self-start">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">

        {/* -------------------------------------------------------------
            STAGE 1: SECURE LOGIN SCREEN
           ------------------------------------------------------------- */}
        <AnimatePresence mode="wait">
          {!currentUser && !isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="max-w-md mx-auto mt-10"
            >
              <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-indigo-500/5 hover:border-indigo-150">
                {/* Visual Cover Accent */}
                <div className="py-10 px-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                    <ShieldCheck className="w-32 h-32 text-indigo-400" />
                  </div>
                  {/* Modern ambient particle glows */}
                  <div className="absolute -top-12 -left-12 w-24 h-24 bg-indigo-600 rounded-full blur-2xl opacity-25"></div>
                  
                  <div className="relative z-10 space-y-2">
                    <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-black bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 inline-block">
                      SECURE CREDENTIAL CHECK
                    </span>
                    <h2 className="text-2xl font-black font-sans tracking-tight">Campus Access Gate</h2>
                    <p className="text-xs text-slate-300 mt-1.5 max-w-sm mx-auto leading-relaxed">
                      {showAdminLogin 
                        ? "Administrative Secure Console Access" 
                        : "Enter your registered credentials to file & monitor grievances"
                      }
                    </p>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  
                  {!showAdminLogin ? (
                    /* Student Login View (Private and clean) */
                    <form onSubmit={handleStudentLogin} className="space-y-4">
                      <div>
                        <label htmlFor="student_usn_field" className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2 font-mono">
                          Enter Authorized Student USN
                        </label>
                        <div className="relative">
                          <input
                            id="student_usn_field"
                            name="student_confidential_usn"
                            type="text"
                            required
                            autoComplete="off"
                            value={authUsn}
                            onChange={(e) => setAuthUsn(e.target.value)}
                            placeholder="e.g. SG24CSE170"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 bg-slate-50 transition-all font-mono tracking-wider font-bold placeholder:font-sans placeholder:tracking-normal placeholder:font-normal uppercase text-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="student_password_field" className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2 font-mono flex justify-between items-center">
                          <span>Student Account Password</span>
                        </label>
                        <div className="relative">
                          <input
                            id="student_password_field"
                            name="student_confidential_password"
                            type={showPasswordVal ? "text" : "password"}
                            required
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            placeholder="Enter account password"
                            className="w-full pl-4 pr-12 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 bg-slate-50 transition-all font-mono tracking-wider font-bold placeholder:font-sans placeholder:tracking-normal placeholder:font-normal text-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswordVal(!showPasswordVal)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-indigo-600 focus:outline-none cursor-pointer p-0.5"
                            title={showPasswordVal ? "Hide Password" : "Show Password"}
                          >
                            {showPasswordVal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold font-mono tracking-widest transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                      >
                        Sign In securely <Lock className="w-3.5 h-3.5" />
                      </button>

                      {loginError && (
                        <div className="flex gap-2 p-3 bg-rose-50 border border-rose-150 text-rose-700 text-xs rounded-xl font-medium">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                          <span>{loginError}</span>
                        </div>
                      )}

                      <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink mx-4 text-[10px] text-slate-400 uppercase font-mono font-bold tracking-widest">OR</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setShowAdminLogin(true);
                          setLoginError("");
                          setAuthUsn("");
                          setAdminError("");
                        }}
                        className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold font-mono tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                      >
                        <Users className="w-4 h-4 text-indigo-400" />
                        ACCESS ADMINISTRATIVE DESK
                      </button>
                    </form>
                  ) : (
                    /* Administrative Secure Password Portal */
                    <form onSubmit={handleAdminVerify} className="space-y-4">
                      <div>
                        <label htmlFor="admin_username_field" className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2 font-mono">
                          Administrative Username
                        </label>
                        <input
                          id="admin_username_field"
                          name="admin_login_username"
                          type="text"
                          required
                          autoComplete="off"
                          autoFocus
                          value={adminUsername}
                          onChange={(e) => setAdminUsername(e.target.value)}
                          placeholder="Enter username (e.g. admin)"
                          className="w-full px-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 bg-slate-50 transition-all text-xs font-medium text-slate-900 placeholder:font-sans"
                        />
                      </div>

                      <div>
                        <label htmlFor="admin_password_field" className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2 font-mono">
                          Administrative Password
                        </label>
                        <div className="relative">
                          <input
                            id="admin_password_field"
                            name="admin_login_password"
                            type="password"
                            required
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            placeholder="Enter Key Passphrase"
                            className="w-full px-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 bg-slate-50 transition-all text-xs font-mono tracking-widest font-bold placeholder:font-sans placeholder:tracking-normal text-slate-900"
                          />
                        </div>
                      </div>

                      {adminError && (
                        <div className="flex gap-2 p-3 bg-rose-50 border border-rose-150 text-rose-700 text-xs rounded-xl font-medium">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                          <span>{adminError}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAdminLogin(false);
                            setAdminPassword("");
                            setAdminUsername("");
                            setAdminError("");
                          }}
                          className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
                        >
                          Cancel / Back
                        </button>

                        <button
                          type="submit"
                          className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold font-mono tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                        >
                          Authorize Desk Key
                        </button>
                      </div>
                    </form>
                  )}

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* -------------------------------------------------------------
            STAGE 2: STUDENT CONSOLE
           ------------------------------------------------------------- */}
        {currentUser && !isAdmin && (
          <div className="space-y-6">
            
            {/* Nav Rail / Tabs */}
            <div className="flex border-b border-slate-200 gap-1.5 overflow-x-auto pb-px">
              <button
                id="student_tab_submit"
                onClick={() => setStudentTab('submit')}
                className={`py-3 px-5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${studentTab === 'submit' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                <Send className="w-4 h-4" />
                Submit New Complaint
              </button>
              <button
                id="student_tab_history"
                onClick={() => setStudentTab('history')}
                className={`py-3 px-5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${studentTab === 'history' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                <History className="w-4 h-4" />
                My Complaints & History
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded">
                  {complaints.filter(c => c.studentUsn === currentUser.usn).length}
                </span>
              </button>
              <button
                id="student_tab_browse"
                onClick={() => setStudentTab('browse')}
                className={`py-3 px-5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${studentTab === 'browse' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                <Users className="w-4 h-4" />
                Student Board / Upvote
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-600 rounded">
                  {complaints.filter(c => !c.isAnonymous).length}
                </span>
              </button>
            </div>

            {/* TAB: SUBMIT COMPLAINT */}
            {studentTab === 'submit' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Primary Complaint Form */}
                <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">File a Formal Complaint</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Our system routes complaints automatically to corresponding departments based on your categorisation.
                    </p>
                  </div>

                  <form onSubmit={handleNewComplaintSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="comp_title_input" className="block text-xs font-bold uppercase text-slate-600 tracking-wider mb-2">
                        Complaint Header / Brief Title
                      </label>
                      <input
                        id="comp_title_input"
                        type="text"
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g. Broken water purifier near library room 2"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all font-medium text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="comp_cat_select" className="block text-xs font-bold uppercase text-slate-600 tracking-wider mb-2">
                          Complaint Category
                        </label>
                        <select
                          id="comp_cat_select"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value as Category)}
                          className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900 font-medium"
                        >
                          <option value="Hostel">Hostel (Routed to Hostel Office)</option>
                          <option value="IT Department">IT Department (Routed to IT Support Staff)</option>
                          <option value="Library">Library (Routed to Library Staff)</option>
                          <option value="Anti-Ragging">Anti-Ragging (Routed to Anti-Ragging Cell)</option>
                          <option value="Academics">Academics (Routed to Academics Dean Office)</option>
                          <option value="Infrastructure">Infrastructure (Routed to Estate & Maintenance)</option>
                          <option value="Other">Other / General Office</option>
                        </select>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Auto Router Diagnosis</span>
                        <span className="text-xs font-semibold text-indigo-700 mt-1 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          Will route to: {isEscalated ? "Director Office" : ROUTING_MAP[newCategory] || "Academic Dean Office"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="comp_desc_input" className="block text-xs font-bold uppercase text-slate-600 tracking-wider mb-2">
                        Detailed Description of Issue
                      </label>
                      <textarea
                        id="comp_desc_input"
                        required
                        rows={4}
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="Please elaborate on the date, timing, room location, and impact. Providing clear steps helps our technical staff act quicker."
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all text-slate-900 text-sm leading-relaxed"
                      />
                    </div>

                    {/* Drag and Drop File Upload Area */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 tracking-wider mb-2">
                        Upload Diagnostic Screenshot or Photo (Optional)
                      </label>
                      
                      {uploadedImage ? (
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 group h-40">
                          <img src={uploadedImage} alt="Diagnostics upload" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => setUploadedImage(null)}
                              className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <X className="w-4 h-4" /> Remove Image
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onDragEnter={handleDrag}
                          onDragOver={handleDrag}
                          onDragLeave={handleDrag}
                          onDrop={handleDrop}
                          onClick={triggerFileSelect}
                          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${dragActive ? 'border-indigo-600 bg-indigo-50/40 scale-[1.01]' : 'border-slate-300 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-400'}`}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <Upload className="w-8 h-8 text-slate-400 mb-2" />
                          <p className="text-sm font-semibold text-slate-700">Drag or click to choose photo</p>
                          <p className="text-xs text-slate-400 mt-1">Supports PNG, JPEG, SVG up to 10MB</p>
                        </div>
                      )}
                    </div>

                    {/* Toggle Checks */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className="mt-1 h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800">Submit Anonymously</p>
                          <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Your name & USN is hidden on open boards, shown internally to security staff.</p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={isEscalated}
                          onChange={(e) => setIsEscalated(e.target.checked)}
                          className="mt-1 h-4 w-4 text-rose-600 border-slate-300 rounded focus:ring-rose-500 cursor-pointer"
                        />
                        <div>
                          <p className="text-xs font-bold text-rose-800 flex items-center gap-1">
                            Escalate directly to Higher Authorities
                          </p>
                          <p className="text-[10px] text-slate-400 leading-normal mt-0.5">For extremely serious issues (Anti-Ragging, safety etc.) routed to Director Office.</p>
                        </div>
                      </label>
                    </div>

                    <div className="pt-2">
                      <button
                        id="submit_complaint_btn"
                        type="submit"
                        disabled={submitSuccess}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:bg-emerald-600 disabled:shadow-none transition-all cursor-pointer"
                      >
                        {submitSuccess ? (
                          <>
                            <Check className="w-5 h-5" /> Complaint Lodged Successfully! Routing...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" /> Submit Complaint ticket
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Info and help Sidebar */}
                <div className="space-y-6">
                  {/* Student Credentials card */}
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-white relative overflow-hidden shadow-md">
                    <div className="absolute top-0 right-0 p-6 text-indigo-500 opacity-20 pointer-events-none">
                      <GraduationCap className="w-24 h-24" />
                    </div>
                    <span className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase font-mono">Pre-allocated Student Metadata</span>
                    <h3 className="text-lg font-black mt-1 text-slate-100">{currentUser.name}</h3>
                    <p className="text-xs text-indigo-200 mt-0.5 tracking-wider font-mono uppercase">{currentUser.usn}</p>

                    <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono block">CLASS</span>
                        <span className="text-xs font-bold text-slate-200">{currentUser.class}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono block">SECTION</span>
                        <span className="text-xs font-bold text-slate-200">Sec- {currentUser.section}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-400 font-mono block">DEPARTMENT</span>
                        <span className="text-xs font-bold text-slate-200">{currentUser.department}</span>
                      </div>
                    </div>
                  </div>

                  {/* Standard guidelines panel */}
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 mb-3">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      Smart Student Charter
                    </h4>
                    <ul className="text-xs text-slate-600 space-y-2.5 list-disc pl-4 leading-relaxed">
                      <li>Use the upvote feature to endorse existing public tickets instead of launching duplicates.</li>
                      <li>For immediate infrastructure faults, capture a photo to accelerate repair team diagnostics.</li>
                      <li>Serious Anti-Ragging complaints can be submitted anonymously to protect student privacy.</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: VIEW STUDENT HISTORY WITH FEEDBACK OPTION */}
            {studentTab === 'history' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Your Complaints File</h3>
                    <p className="text-[11px] text-slate-400">Showing complaints registered under University Ledger for {currentUser.usn}</p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded">
                    Total: {complaints.filter(c => c.studentUsn === currentUser.usn).length}
                  </span>
                </div>

                {complaints.filter(c => c.studentUsn === currentUser.usn).length === 0 ? (
                  <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h4 className="font-semibold text-slate-700">No complaints logged yet</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Any tickets you lodge will be displayed here containing status steps and response trackers.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {complaints.filter(c => c.studentUsn === currentUser.usn).map((comp) => {
                      const catDetails = getCategoryDetails(comp.category);
                      return (
                        <div key={comp.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
                          
                          {/* Image preview thumbnail (if exists) */}
                          {comp.imageUrl && (
                            <div className="md:w-36 h-28 md:h-auto bg-slate-100 border-r border-slate-200 flex-shrink-0">
                              <img src={comp.imageUrl} alt="attached diagnostics" className="w-full h-full object-cover" />
                            </div>
                          )}

                          {/* Content */}
                          <div className="p-5 flex-1 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${catDetails.color}`}>
                                  {catDetails.icon}
                                  {comp.category}
                                </span>
                                {comp.isAnonymous && (
                                  <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                    Anonymous Submission
                                  </span>
                                )}
                                {comp.isEscalated && (
                                  <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
                                    Escalated Authority
                                  </span>
                                )}
                              </div>
                              <span className={`text-[11px] font-bold px-2.5 py-0.5 border rounded-full ${getStatusBadge(comp.status)}`}>
                                {comp.status}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-bold text-slate-900 text-base">{comp.title}</h4>
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{comp.description}</p>
                            </div>

                            {/* Admin responses tracker */}
                            {(comp.adminNotes || comp.status === "Resolved") && (
                              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                <div className="flex items-center gap-1.5">
                                  <CornerDownRight className="w-4 h-4 text-indigo-600" />
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 font-mono">
                                    Official Resolution Notes Desk
                                  </span>
                                </div>
                                <p className="text-xs text-slate-700 italic pr-4">
                                  "{comp.adminNotes || "Ticket resolved. Staff dispatched details checked."}"
                                </p>

                                {/* Satisfactory Feedback submission drawer */}
                                {comp.status === "Resolved" && (
                                  <div className="pt-2 border-t border-slate-200 mt-2">
                                    {comp.feedback ? (
                                      <div className="flex items-center gap-2.5 text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                                        <span className="font-bold text-slate-900">Your Feedback:</span>
                                        <div className="flex text-amber-400">
                                          {Array.from({ length: 5 }).map((_, i) => (
                                            <Star key={i} className={`w-3.5 h-3.5 ${i < (comp.feedback?.rating || 0) ? 'fill-current' : 'text-slate-200'}`} />
                                          ))}
                                        </div>
                                        <span className="italic">"{comp.feedback.comments}"</span>
                                      </div>
                                    ) : (
                                      feedbackActiveId === comp.id ? (
                                        <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-3 mt-1">
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-700">Rate your resolution experience:</span>
                                            <div className="flex items-center gap-1">
                                              {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                  key={star}
                                                  onClick={() => setFeedbackRating(star)}
                                                  className="p-0.5 text-amber-400 focus:outline-none hover:scale-115 transition-transform cursor-pointer"
                                                >
                                                  <Star className={`w-5 h-5 ${star <= feedbackRating ? 'fill-current' : 'text-slate-200'}`} />
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                          <div className="flex gap-2">
                                            <input
                                              type="text"
                                              value={feedbackComments}
                                              onChange={(e) => setFeedbackComments(e.target.value)}
                                              placeholder="Share comment on help quality..."
                                              className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none text-slate-900"
                                            />
                                            <button
                                              onClick={() => submitFeedback(comp.id)}
                                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                                            >
                                              Submit
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            setFeedbackActiveId(comp.id);
                                            setFeedbackRating(5);
                                          }}
                                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1 cursor-pointer"
                                        >
                                          <Star className="w-3.5 h-3.5 fill-current text-indigo-600" /> Share satisfactory feedback rating
                                        </button>
                                      )
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-100">
                              <span>TICKET: {comp.id}</span>
                              <span>ASSIGNED TO: {comp.department}</span>
                              <span>CREATED: {new Date(comp.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: BROWSE STUDENT COMPLAINTS BOARD (UPVOTE BOARD) */}
            {studentTab === 'browse' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-indigo-900 border border-indigo-950 p-6 rounded-2xl text-white relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Activity className="w-40 h-40 text-white" />
                  </div>
                  <h3 className="text-lg font-black text-slate-100">Student Community Notice Board</h3>
                  <p className="text-xs text-indigo-200 mt-1 max-w-2xl leading-relaxed">
                    Collaborative portal monitoring campus maintenance and services. Read complaints from fellow students and cast upvotes to escalate severity levels for admin priority.
                  </p>
                </div>

                {/* Filter and research */}
                <div className="flex flex-wrap gap-2.5 items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search community issues..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs placeholder:text-slate-400 text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="text-xs font-semibold px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg text-slate-700"
                    >
                      <option value="All">All Categories</option>
                      {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Board tickets list */}
                {filteredComplaints.filter(c => !c.isAnonymous).length === 0 ? (
                  <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                    No community posts matching criteria at this moment.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredComplaints.filter(c => !c.isAnonymous).map((comp) => {
                      const catDetails = getCategoryDetails(comp.category);
                      const hasUpvoted = comp.upvotedBy.includes(currentUser.usn);
                      return (
                        <div key={comp.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 transition-all shadow-sm flex flex-col justify-between hover:shadow-md">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${catDetails.color}`}>
                                {catDetails.icon}
                                {comp.category}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(comp.status)}`}>
                                {comp.status}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-bold text-slate-900 text-sm leading-tight line-clamp-1">{comp.title}</h4>
                              <p className="text-xs text-slate-600 line-clamp-3 mt-1.5 leading-relaxed">{comp.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-slate-100">
                            <div>
                              <p className="text-[10px] font-bold text-slate-700 truncate max-w-[140px]">{comp.studentName}</p>
                              <p className="text-[9px] text-slate-400 font-mono mt-0.5">{comp.studentClass}</p>
                            </div>

                            <button
                              onClick={() => handleUpvote(comp.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono tracking-wider transition-all flex items-center gap-2 cursor-pointer ${hasUpvoted ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                            >
                              <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'fill-current' : ''}`} />
                              <span>{comp.upvotes}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

          </div>
        )}

        {/* -------------------------------------------------------------
            STAGE 3: ADMINISTRATIVE WORKSPACE
           ------------------------------------------------------------- */}
        {isAdmin && (
          <div className="space-y-6">

            {/* Admin navigation bar */}
            <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-xl border border-slate-200 gap-4 shadow-sm">
              <div className="flex gap-2">
                <button
                  id="admin_tab_board"
                  onClick={() => setAdminTab('board')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${adminTab === 'board' ? 'bg-slate-900 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Live Tickets Ledger ({complaints.length})
                </button>
                <button
                  id="admin_tab_analytics"
                  onClick={() => setAdminTab('analytics')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${adminTab === 'analytics' ? 'bg-slate-900 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  Analytics & Visual Insights
                </button>
                <button
                  id="admin_tab_roster"
                  onClick={() => setAdminTab('roster')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${adminTab === 'roster' ? 'bg-slate-900 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Pre-Authorized Students
                </button>
              </div>

              {/* Status breakdown logs */}
              <div className="flex gap-2 text-[10px] font-mono">
                <span className="px-2 py-1 bg-amber-50 border border-amber-200 rounded text-amber-700 font-bold">
                  PENDING: {pendingCount}
                </span>
                <span className="px-2 py-1 bg-sky-50 border border-sky-200 rounded text-sky-700 font-bold">
                  REVIEWING: {reviewCount}
                </span>
                <span className="px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-emerald-700 font-bold">
                  SOLVED: {resolvedCount}
                </span>
              </div>
            </div>

            {/* Emergency Real-Time Student Alert Portal */}
            {(() => {
              const unresolvedEscalated = complaints.filter(c => c.isEscalated && c.status !== "Resolved");
              if (unresolvedEscalated.length === 0) return null;
              return (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-50/95 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md backdrop-blur-sm"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold flex-shrink-0 relative overflow-hidden shadow-md shadow-rose-600/20">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <AlertTriangle className="w-5 h-5 relative z-10" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-rose-950 dark:text-rose-200 uppercase tracking-wider font-mono flex items-center gap-2">
                        <span>🚨 Critical Student Grievance Dispatch</span>
                        <span className="bg-rose-600 text-white font-bold font-mono px-1.5 py-0.5 rounded text-[10px] animate-pulse">
                          {unresolvedEscalated.length} Urgent Dispatch
                        </span>
                      </h4>
                      <p className="text-xs text-rose-750 dark:text-rose-300 mt-1 font-medium leading-relaxed max-w-2xl">
                        High-urgency emergency ticket(s) submitted by student(s) to the Director Office are awaiting administrative resolution. Immediate check and action are required.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button 
                      onClick={() => {
                        setFilterEscalation("Escalated Only");
                        setFilterStatus("All");
                        setSearchQuery("");
                        setAdminTab('board');
                      }}
                      className="w-full md:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md hover:shadow-lg shadow-rose-600/10 hover:shadow-rose-600/20 whitespace-nowrap active:scale-95"
                    >
                      Filter Emergency Queue
                    </button>
                  </div>
                </motion.div>
              );
            })()}

            {/* TAB: TICKETS BOARD */}
            {adminTab === 'board' && (
              <div className="space-y-6">
                {/* Departmental Category filters block */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                    <span className="text-[10px] font-mono tracking-widest text-indigo-600 uppercase font-black flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Departmental Complaint Filter Engine
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Select a department category to immediately review its specific tickets</span>
                  </div>
                  
                  {/* Category badges row */}
                  <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                    <button
                      type="button"
                      onClick={() => setFilterCategory("All")}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-bold font-sans tracking-wide transition-all flex items-center gap-2 cursor-pointer border shrink-0 ${
                        filterCategory === "All"
                          ? "bg-indigo-600 border-indigo-700 text-white shadow-md shadow-indigo-600/15"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <span>📂 All Categories</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                        filterCategory === "All" ? "bg-indigo-500 text-indigo-50" : "bg-slate-100 text-slate-500"
                      }`}>
                        {complaints.length}
                      </span>
                    </button>

                    {categoriesList.map(cat => {
                      const count = complaints.filter(c => c.category === cat).length;
                      let iconEmoji = "📝";
                      switch (cat) {
                        case 'Hostel': iconEmoji = "🏨"; break;
                        case 'IT Department': iconEmoji = "💻"; break;
                        case 'Library': iconEmoji = "📚"; break;
                        case 'Anti-Ragging': iconEmoji = "🛡️"; break;
                        case 'Academics': iconEmoji = "🎓"; break;
                        case 'Infrastructure': iconEmoji = "🏗️"; break;
                        case 'Other': iconEmoji = "🛠️"; break;
                      }
                      const isSelected = filterCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setFilterCategory(cat)}
                          className={`px-3.5 py-2.5 rounded-xl text-xs font-bold font-sans tracking-wide transition-all flex items-center gap-2 cursor-pointer border shrink-0 whitespace-nowrap ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-700 text-white shadow-md shadow-indigo-600/15"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                          }`}
                        >
                          <span>{iconEmoji} {cat}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-black ${
                            isSelected ? "bg-indigo-500 text-indigo-50" : "bg-slate-100 text-slate-500"
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* LIST OF CAMPUS COMPLAINTS (Left Column 7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Filters Board header */}
                  <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-sm">
                    {/* Escalation Filter Tabs */}
                    <div className="flex border-b border-slate-100 pb-1.5 gap-1 overflow-x-auto scrollbar-none">
                      <button
                        onClick={() => setFilterEscalation("All")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${filterEscalation === "All" ? "bg-slate-900 border border-slate-950 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}
                      >
                        All Grievance Tickets
                      </button>
                      <button
                        onClick={() => setFilterEscalation("Regular Only")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${filterEscalation === "Regular Only" ? "bg-slate-900 border border-slate-950 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}
                      >
                        Standard Level
                      </button>
                      <button
                        onClick={() => setFilterEscalation("Escalated Only")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${filterEscalation === "Escalated Only" ? "bg-rose-600 border border-rose-700 text-white antialiased shadow" : "text-rose-600 hover:bg-rose-50 hover:text-rose-700"}`}
                      >
                        <span className="w-2 h-2 rounded-full bg-white inline-block animate-ping"></span>
                        🚨 Escalated to Higher Authorities
                      </button>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-700">
                      <Search className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search USN, name, description key or grievance code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-xs placeholder:text-slate-400 focus:outline-none bg-transparent text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="block text-[9px] text-slate-400 font-bold font-mono tracking-wider uppercase mb-1">Status</span>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="w-full font-semibold p-2 border border-slate-200 bg-white rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        >
                          <option value="All">All Status</option>
                          <option value="Pending">Pending</option>
                          <option value="Under Review">Under Review</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Escalated">Escalated</option>
                        </select>
                      </div>

                      <div>
                        <span className="block text-[9px] text-slate-400 font-bold font-mono tracking-wider uppercase mb-1">Category</span>
                        <select
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                          className="w-full font-semibold p-2 border border-slate-200 bg-white rounded-lg text-slate-700"
                        >
                          <option value="All">All Categories</option>
                          {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      <div>
                        <span className="block text-[9px] text-slate-400 font-bold font-mono tracking-wider uppercase mb-1">Office Desk</span>
                        <select
                          value={filterDepartment}
                          onChange={(e) => setFilterDepartment(e.target.value)}
                          className="w-full font-semibold p-2 border border-slate-200 bg-white rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        >
                          <option value="All">All Departments</option>
                          <option value="Hostel Office">Hostel Office</option>
                          <option value="IT Support Staff">IT Support Staff</option>
                          <option value="Library Staff">Library Staff</option>
                          <option value="Anti-Ragging Cell">Anti-Ragging Cell</option>
                          <option value="Academic Dean Office">Academic Dean Office</option>
                          <option value="Estate & Maintenance">Estate & Maintenance</option>
                          <option value="Director Office">Director Office</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Complaint rows matching filter */}
                  {filteredComplaints.length === 0 ? (
                    <div className="bg-white border border-slate-200 p-8 rounded-xl text-center text-slate-400 text-xs">
                      No tickets match filter parameters. Modify selections or query keyword.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {filteredComplaints.map((comp) => {
                        const catDetails = getCategoryDetails(comp.category);
                        const isSelected = selectedComplaint?.id === comp.id;
                        return (
                          <div
                            key={comp.id}
                            onClick={() => handleComplaintSelect(comp)}
                            className={`p-4 bg-white border rounded-xl hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between gap-3 ${isSelected ? 'border-indigo-600 ring-2 ring-indigo-50 bg-indigo-50/10' : 'border-slate-200'}`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <span className="font-mono text-[9px] text-slate-400 block tracking-tight font-semibold">TICKET ID: {comp.id}</span>
                                <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">{comp.title}</h4>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-full ${getStatusBadge(comp.status)}`}>
                                {comp.status}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{comp.description}</p>

                            <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 font-mono border-t border-slate-100 pt-2 bg-slate-50 p-2 rounded">
                              <div className="flex gap-2">
                                <span className="text-slate-800 font-bold">{comp.isAnonymous ? "ANONYMOUS STUDENT" : comp.studentUsn}</span>
                                <span className="text-slate-400">|</span>
                                <span className="text-indigo-600 font-semibold">{comp.isAnonymous ? "CONFIDENTIAL" : `${comp.studentClass} ${comp.studentSec}`}</span>
                              </div>
                              <span className="font-bold text-slate-700">{comp.department}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* DETAILED ACTIVE COMPLAINT DRAWER (Right Column 5 cols) */}
                <div className="lg:col-span-5">
                  {selectedComplaint ? (
                    <div className="bg-white border-2 border-slate-200 rounded-2xl shadow-xl overflow-hidden sticky top-28 space-y-5">
                      {/* Detailed Accent */}
                      <div className="bg-slate-900 text-white p-5 space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-[10px] tracking-widest text-indigo-400 uppercase font-bold">Comprehensive Audit Log</span>
                          <span className={`text-[10px] font-mono tracking-wider font-bold p-1 bg-slate-800 text-slate-200 border border-slate-700 rounded`}>
                            {selectedComplaint.id}
                          </span>
                        </div>
                        <h3 className="text-base font-black leading-snug text-slate-100">{selectedComplaint.title}</h3>
                        <p className="text-xs text-slate-300">
                          Filed by: <strong className="text-white">{selectedComplaint.isAnonymous ? "Confidential (Anonymous)" : selectedComplaint.studentName}</strong> ({selectedComplaint.isAnonymous ? "Identity Strictly Masked" : selectedComplaint.studentUsn})
                        </p>
                      </div>

                      <div className="p-5 space-y-5">
                        
                        {/* Auto populated class metrics shown specifically */}
                        <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-center">
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold font-mono block">ROSTER USN</span>
                            <span className="text-[11px] font-mono font-bold text-slate-500 italic">{selectedComplaint.isAnonymous ? "MASKED" : selectedComplaint.studentUsn}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold font-mono block">CLASS LEVEL</span>
                            <span className="text-[11px] font-bold text-slate-500 italic">{selectedComplaint.isAnonymous ? "MASKED" : (selectedComplaint.studentClass || "N/A")}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold font-mono block">SECTION GROUP</span>
                            <span className="text-[11px] font-bold text-slate-500 italic">{selectedComplaint.isAnonymous ? "MASKED" : `Sec- ${selectedComplaint.studentSec || "N/A"}`}</span>
                          </div>
                        </div>

                        {/* Complaint attachments */}
                        {selectedComplaint.imageUrl && (
                          <div className="rounded-xl overflow-hidden border border-slate-200">
                            <span className="text-[9px] uppercase font-bold text-slate-500 font-mono bg-slate-100 px-3 py-1 block border-b">Attached Screenshot Diagnostics</span>
                            <div className="aspect-video bg-slate-100">
                              <img src={selectedComplaint.imageUrl} alt="Attached screenshot" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        )}

                        <div>
                          <span className="text-[10px] font-mono tracking-wide uppercase text-slate-400 font-semibold block mb-1">Issue Description Detail</span>
                          <p className="text-xs text-slate-700 bg-slate-50/50 p-3 rounded-lg border border-slate-150 leading-relaxed max-h-36 overflow-y-auto">
                            {selectedComplaint.description}
                          </p>
                        </div>

                        {/* Administrative action section */}
                        <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                          <span className="text-[10px] font-black tracking-wider text-slate-500 dark:text-slate-400 uppercase font-mono block">Executive Actions and Notes</span>

                          {/* Beautiful Interactive Change Status Buttons */}
                          <div className="space-y-2">
                            <label className="text-[9px] text-slate-400 font-bold block uppercase font-mono">Set Resolution Stage (One-Click Selection)</label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-0.5">
                              {(["Pending", "Under Review", "In Progress", "Resolved", "Escalated"] as ComplaintStatus[]).map((st) => {
                                const isSelected = statusDraft === st;
                                let themeClass = "";
                                switch (st) {
                                  case "Pending": 
                                    themeClass = isSelected 
                                      ? "bg-amber-600 text-white border-amber-700 shadow-sm" 
                                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-amber-50/50 hover:text-amber-800 dark:hover:bg-amber-950/20"; 
                                    break;
                                  case "Under Review": 
                                    themeClass = isSelected 
                                      ? "bg-purple-600 text-white border-purple-700 shadow-sm" 
                                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-purple-50/50 hover:text-purple-800 dark:hover:bg-purple-950/20"; 
                                    break;
                                  case "In Progress": 
                                    themeClass = isSelected 
                                      ? "bg-sky-600 text-white border-sky-700 shadow-sm" 
                                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-sky-50/50 hover:text-sky-800 dark:hover:bg-sky-950/20"; 
                                    break;
                                  case "Resolved": 
                                    themeClass = isSelected 
                                      ? "bg-emerald-600 text-white border-emerald-700 shadow-sm" 
                                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-emerald-50/50 hover:text-emerald-800 dark:hover:bg-emerald-950/20"; 
                                    break;
                                  case "Escalated": 
                                    themeClass = isSelected 
                                      ? "bg-rose-600 text-white border-rose-700 shadow-sm" 
                                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-rose-50/50 hover:text-rose-800 dark:hover:bg-rose-950/20"; 
                                    break;
                                }
                                return (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => setStatusDraft(st)}
                                    className={`py-2 px-1 text-[11px] font-bold border rounded-lg transition-all text-center cursor-pointer ${themeClass}`}
                                  >
                                    {st}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                            <div className="sm:col-span-8">
                              <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase font-mono">Reassign Staff Office Desk</label>
                              <select
                                value={deptDraft}
                                onChange={(e) => setDeptDraft(e.target.value as Department)}
                                className="w-full font-bold p-2 text-xs border border-slate-200 dark:border-slate-720 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                              >
                                <option value="Hostel Office">Hostel Office</option>
                                <option value="IT Support Staff">IT Support Staff</option>
                                <option value="Library Staff">Library Staff</option>
                                <option value="Anti-Ragging Cell">Anti-Ragging Cell</option>
                                <option value="Academic Dean Office">Academic Dean Office</option>
                                <option value="Estate & Maintenance">Estate & Maintenance</option>
                                <option value="Director Office">Director Office</option>
                              </select>
                            </div>

                            <div className="sm:col-span-4 flex items-end">
                              <button
                                onClick={handleReassignDept}
                                className="w-full py-2 bg-slate-900 dark:bg-slate-850 hover:bg-slate-800 dark:hover:bg-slate-750 border border-slate-950 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                              >
                                Commit Routing
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2 pt-1">
                            <div>
                              <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase font-mono">Action Ledger Notes</label>
                              <textarea
                                value={adminNotesDraft}
                                onChange={(e) => setAdminNotesDraft(e.target.value)}
                                placeholder="State specific repairs made, update messages, or patch resolutions for the student's status tracker ledger."
                                className="w-full p-2.5 text-xs text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                                rows={2}
                              />
                            </div>

                            <button
                              onClick={handleUpdateStatus}
                              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl tracking-wider transition-all cursor-pointer shadow-md hover:shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 flex items-center justify-center gap-1.5"
                            >
                              Save status & update student ledger
                            </button>
                          </div>
                        </div>

                        {/* Gemini AI Diagnostics & Smart Triage Panel */}
                        <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black tracking-wider text-indigo-700 dark:text-indigo-300 uppercase font-mono flex items-center gap-1.5">
                              <Cpu className="w-3.5 h-3.5" /> Gemini AI Diagnostics
                            </span>
                            <button
                              type="button"
                              disabled={aiLoading}
                              onClick={() => handleFetchAiAdvice(selectedComplaint.id)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                            >
                              {aiLoading ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin" /> Analyzing...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3" /> {aiAdvice ? "Re-run AI Analysis" : "Analyze with AI"}
                                </>
                              )}
                            </button>
                          </div>

                          {aiError && (
                            <div className="p-2.5 bg-rose-50 text-rose-700 text-[11px] rounded-lg border border-rose-200">
                              {aiError}
                            </div>
                          )}

                          {aiAdvice ? (
                            <div className="space-y-3 pt-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300">
                                  Threat Level: {aiAdvice.threatLevel}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300">
                                    Suggested: <strong>{aiAdvice.suggestedRouting}</strong>
                                  </span>
                                  {aiAdvice.suggestedRouting !== deptDraft && (
                                    <button
                                      type="button"
                                      onClick={() => setDeptDraft(aiAdvice.suggestedRouting as Department)}
                                      className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded cursor-pointer"
                                    >
                                      Apply
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-100 dark:border-slate-800 space-y-1.5">
                                <span className="text-[9px] font-mono font-bold uppercase text-slate-400 block">Recommended Action Steps</span>
                                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                                  {aiAdvice.actionSteps.map((step, idx) => (
                                    <li key={idx}>{step}</li>
                                  ))}
                                </ul>
                              </div>

                              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-100 dark:border-slate-800 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-mono font-bold uppercase text-slate-400">Suggested Official Reply</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAdminNotesDraft(aiAdvice.draftReply);
                                      showToast("Draft Applied", "AI draft reply copied into Action Ledger Notes.", "info");
                                    }}
                                    className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                                  >
                                    Use in Action Notes
                                  </button>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 italic leading-relaxed">
                                  "{aiAdvice.draftReply}"
                                </p>
                              </div>

                              {aiSimulated && (
                                <p className="text-[9px] font-mono text-slate-400">
                                  Running built-in triage template (set GEMINI_API_KEY in environment for live Gemini generation).
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-[11px] text-indigo-900/70 dark:text-indigo-200/70 leading-relaxed">
                              Click <strong>Analyze with AI</strong> to assess severity, recommended department routing, action steps, and a draft response.
                            </p>
                          )}
                        </div>

                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-100/50 border border-dashed border-slate-300 p-8 rounded-2xl text-center text-slate-400 text-xs sticky top-28 select-none">
                      <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      Select any complaint card on the list board to view detailed metadata audit logs, execute status milestones, manually transfer staff office, or launch Gemini AI diagnostics.
                    </div>
                  )}
                </div>

              </div>
              </div>
            )}

            {/* TAB: COMPLAINT ANALYTICS & INSIGHT DIAGRAMS */}
            {adminTab === 'analytics' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Highlight widgets */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-white border border-slate-200 p-4 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Total Lodged</span>
                    <p className="text-2xl font-extrabold text-slate-950 mt-1">{totalComplaints}</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Active Complaints</span>
                    <p className="text-2xl font-extrabold text-amber-600 mt-1">{pendingCount + reviewCount}</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Resolved Rate</span>
                    <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                      {totalComplaints ? ((resolvedCount / totalComplaints) * 100).toFixed(0) : 0}%
                    </p>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-xl text-center col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold text-rose-500 uppercase font-mono">Direct Escalations</span>
                    <p className="text-2xl font-extrabold text-rose-600 mt-1">{escalatedCount}</p>
                  </div>
                  <div className="bg-indigo-950 text-white p-4 rounded-xl text-center col-span-2 sm:col-span-1 border border-indigo-900 shadow">
                    <span className="text-[10px] font-bold text-indigo-300 uppercase font-mono">Average Rating</span>
                    <p className="text-2xl font-black mt-1 text-slate-100 flex items-center justify-center gap-1">
                      {averageRating} <Star className="w-5 h-5 fill-current text-amber-400" />
                    </p>
                  </div>
                </div>

                {/* Diagrams bento boxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Category Pillar Chart */}
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-slate-900">Department based counts</h3>
                      <p className="text-[11px] text-slate-400">Total volume of issues generated relative to department categorization</p>
                    </div>

                    <div className="space-y-4">
                      {categoryCounts.map((cat) => {
                        const scorePct = Math.round((cat.count / maxCategoryCount) * 100);
                        const cDetails = getCategoryDetails(cat.name as Category);
                        return (
                          <div key={cat.name} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                                {cDetails.icon}
                                {cat.name}
                              </span>
                              <span className="font-mono font-bold text-slate-950 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                                {cat.count} ticket{cat.count !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${scorePct}%` }}
                                transition={{ duration: 1 }}
                                className="h-full bg-indigo-600 rounded-full"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Status distribution with custom SVG visual representation */}
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Real-time Ticket Life stages</h3>
                      <p className="text-[11px] text-slate-400">Proportional lifecycle segments of active issues</p>
                    </div>

                    <div className="my-6 flex justify-center">
                      {/* Interactive circular representation or styled progress nodes */}
                      <div className="grid grid-cols-2 gap-4 w-full">
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <span className="text-[10px] text-slate-400 block font-mono">RESOLVED STATS</span>
                          <span className="text-lg font-black text-emerald-600 block mt-1">{resolvedCount} tickets</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Campus check completed</span>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <span className="text-[10px] text-slate-400 block font-mono">IN DISPATCH</span>
                          <span className="text-lg font-black text-sky-600 block mt-1">
                            {complaints.filter(c => c.status === "In Progress" || c.status === "Under Review").length} tickets
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Under technician evaluation</span>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <span className="text-[10px] text-slate-400 block font-mono">CRITICAL ESCALATIONS</span>
                          <span className="text-lg font-black text-rose-600 block mt-1">{escalatedCount} tickets</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Dean directly alerted</span>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <span className="text-[10px] text-slate-400 block font-mono">STALE / NO ACTIONS</span>
                          <span className="text-lg font-black text-amber-600 block mt-1">{pendingCount} tickets</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Unassigned/Action pending</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-xl text-center">
                      <span className="text-xs font-bold text-indigo-900 block">Department SLA Health Index</span>
                      <p className="text-[11px] text-indigo-700 leading-normal mt-1 pr-6 pl-6">
                        Auto routing system averages a 24-hr initial review milestone with a category priority coefficient.
                      </p>
                    </div>

                  </div>

                </div>

                {/* Student feedback analysis table */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-900">Direct Student Resolution Feedbacks</h3>
                    <p className="text-[11px] text-slate-400">Post resolution transparency star ratings and suggestions log</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-mono text-[9px] uppercase tracking-wider">
                          <th className="py-2">Ticket Title</th>
                          <th className="py-2">Department</th>
                          <th className="py-2">Rating</th>
                          <th className="py-2">Student Feedback Comments</th>
                          <th className="py-2 text-right">Submitted Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {complaints.filter(c => c.feedback).length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                              No resolution satisfaction reviews filed by students yet.
                            </td>
                          </tr>
                        ) : (
                          complaints.filter(c => c.feedback).map((comp) => (
                            <tr key={comp.id} className="hover:bg-slate-50/50">
                              <td className="py-3 pr-4 font-semibold text-slate-900 truncate max-w-[200px]">{comp.title}</td>
                              <td className="py-3 text-slate-500">{comp.department}</td>
                              <td className="py-3">
                                <div className="flex text-amber-500">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={`w-3 h-3 ${i < (comp.feedback?.rating || 0) ? 'fill-current' : 'text-slate-200'}`} />
                                  ))}
                                </div>
                              </td>
                              <td className="py-3 text-slate-700 italic">"{comp.feedback?.comments}"</td>
                              <td className="py-3 text-right text-slate-400 font-mono text-[10px]">
                                {new Date(comp.feedback?.submittedAt || "").toLocaleDateString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </motion.div>
            )}

            {/* TAB: PRE-SET AUTHORISED ROSTER */}
            {adminTab === 'roster' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column: Authorized List */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          Authorized University USN Register
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                            {studentRoster.length} Students
                          </span>
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">Database seed listings authorized to access this secure grievance portal</p>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 w-full sm:w-56">
                        <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <input
                          type="text"
                          value={rosterSearch}
                          onChange={(e) => setRosterSearch(e.target.value)}
                          placeholder="Filter USN or name..."
                          className="w-full text-xs bg-transparent focus:outline-none text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 font-mono text-[9px] uppercase tracking-wider">
                            <th className="py-2.5">REGISTERED USN</th>
                            <th className="py-2.5">STUDENT FULL NAME</th>
                            <th className="py-2.5">ROSTER DEPARTMENT</th>
                            <th className="py-2.5">CLASS LEVEL</th>
                            <th className="py-2.5">SECTION GROUP</th>
                            <th className="py-2.5">PASSWORD</th>
                            <th className="text-right py-2.5 pr-2">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {studentRoster
                            .filter((s) =>
                              !rosterSearch.trim() ||
                              s.usn.toLowerCase().includes(rosterSearch.toLowerCase()) ||
                              s.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
                              s.department.toLowerCase().includes(rosterSearch.toLowerCase())
                            )
                            .map((student) => (
                            <tr key={student.usn} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 font-sans transition-colors ${editingStudent?.usn === student.usn ? 'bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-50/60' : ''}`}>
                              <td 
                                onClick={() => handleViewStudentComplaints(student.usn)}
                                className="py-3 font-mono font-bold tracking-wider text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                title="Click to view and change status of this student's grievances on the core ledger"
                              >
                                {student.usn}
                              </td>
                              <td 
                                onClick={() => handleViewStudentComplaints(student.usn)}
                                className="py-3 font-semibold text-slate-900 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                                title="Click to view and change status of this student's grievances on the core ledger"
                              >
                                {student.name}
                              </td>
                              <td className="py-3 text-slate-600">{student.department}</td>
                              <td className="py-3 text-slate-500 font-medium">{student.class}</td>
                              <td className="py-3 font-mono text-slate-800 font-bold">{student.section}</td>
                              <td className="py-3 font-mono text-indigo-600 font-bold">{student.password || "123456"}</td>
                              <td className="py-3 text-right pr-2">
                                {confirmDeleteUsn === student.usn ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      disabled={rosterSubmitting}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        executeDeleteStudent(student.usn);
                                      }}
                                      className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-md transition-colors cursor-pointer"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      type="button"
                                      disabled={rosterSubmitting}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmDeleteUsn(null);
                                      }}
                                      className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded-md transition-colors cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end gap-2 text-slate-400">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEditingStudent(student);
                                      }}
                                      title="Edit student details"
                                      className="p-1.5 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmDeleteUsn(student.usn);
                                      }}
                                      title="Deauthorize student account"
                                      className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs flex gap-3 text-slate-600 mt-2">
                      <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <p className="leading-relaxed">
                        Student name, class level, and section fields are synchronized automatically from this authorized database ledger upon USN authentication. This completely circumvents manual student typing entry errors and maintains database integrity.
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Authorize New Student Form */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4 self-start">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {editingStudent ? "Edit Student Details" : "Add & Authorize Student"}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {editingStudent ? (
                          <span>
                            Modifying active database credentials for <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{editingStudent.usn}</span>
                          </span>
                        ) : (
                          "Register a new student USN to authorize immediate login"
                        )}
                      </p>
                    </div>

                    <form onSubmit={handleAuthorizeOrUpdateStudent} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 font-mono">
                          University USN
                        </label>
                        <input
                          type="text"
                          required
                          disabled={!!editingStudent}
                          value={newStudentUsn}
                          onChange={(e) => setNewStudentUsn(e.target.value)}
                          placeholder="e.g. SG24CSE180"
                          className={`w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none text-xs font-mono uppercase ${editingStudent ? 'bg-slate-100 text-slate-500 cursor-not-allowed font-medium' : 'bg-slate-50 focus:ring-2 focus:ring-indigo-600 font-bold'}`}
                        />
                        {editingStudent && (
                          <span className="text-[10px] text-amber-600 font-medium mt-1 block">University USN index cannot be altered.</span>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 font-mono">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={newStudentName}
                          onChange={(e) => setNewStudentName(e.target.value)}
                          placeholder="e.g. Anand Sharma"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900 bg-slate-50"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 font-mono">
                          Department
                        </label>
                        <select
                          value={newStudentDept}
                          onChange={(e) => setNewStudentDept(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs bg-slate-50 text-slate-800"
                        >
                          <option>Computer Science & Engineering</option>
                          <option>Information Science & Engineering</option>
                          <option>Electronics & Communication</option>
                          <option>Mechanical Engineering</option>
                          <option>Civil Engineering</option>
                          <option>Electrical & Electronics</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 font-mono">
                            Class Level
                          </label>
                          <select
                            value={newStudentClass}
                            onChange={(e) => setNewStudentClass(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs bg-slate-50 text-slate-800"
                          >
                            <option>1st Semester</option>
                            <option>2nd Semester</option>
                            <option>3rd Semester</option>
                            <option>4th Semester</option>
                            <option>5th Semester</option>
                            <option>6th Semester</option>
                            <option>7th Semester</option>
                            <option>8th Semester</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 font-mono">
                            Section Group
                          </label>
                          <select
                            value={newStudentSec}
                            onChange={(e) => setNewStudentSec(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs bg-slate-50 text-slate-800"
                          >
                            <option>A</option>
                            <option>B</option>
                            <option>C</option>
                            <option>D</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 font-mono">
                          Assign Personal Password
                        </label>
                        <input
                          type="text"
                          value={newStudentPassword}
                          onChange={(e) => setNewStudentPassword(e.target.value)}
                          placeholder="e.g. 123456"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-950 bg-slate-50 font-mono tracking-wider font-bold"
                        />
                        <span className="text-[9px] text-slate-400 font-mono mt-1 block">Specify custom login password or leave empty to default to "123456".</span>
                      </div>

                      {rosterStatusMsg && (
                        <div className="p-2.5 bg-emerald-50 text-emerald-700 text-[11px] rounded-lg font-medium border border-emerald-100">
                          {rosterStatusMsg}
                        </div>
                      )}

                      {rosterErrorMsg && (
                        <div className="p-2.5 bg-rose-50 text-rose-700 text-[11px] rounded-lg font-medium border border-rose-100">
                          {rosterErrorMsg}
                        </div>
                      )}

                      <div className="flex flex-col gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={rosterSubmitting}
                          className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                        >
                          {rosterSubmitting
                            ? "Saving..."
                            : editingStudent
                              ? "Update Student Details"
                              : "Authorize Student Account"}
                        </button>
                        
                        {editingStudent && (
                          <button
                            type="button"
                            onClick={cancelEditingStudent}
                            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                          >
                            Cancel Editing
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                </div>
              </motion.div>
            )}

          </div>
        )}

      </main>

      {/* Footer System labels */}
      <footer className="mt-auto py-5 bg-white border-t border-slate-200 text-center text-[11px] text-slate-400 font-mono select-none">
        UNIVERSITY DIGITAL TRANSIT PANEL • CLOSED LAN CONNECTION ONLY • SECURITY ENCRYPTED
      </footer>

    </div>
  );
}
