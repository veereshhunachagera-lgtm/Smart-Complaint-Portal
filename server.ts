import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { Student, Complaint, SystemNotification, Category, Department, ComplaintStatus } from "./src/types";

dotenv.config();

// Standard lazy initialization of GoogleGenAI
let ai: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is not defined in environment secrets. AI analysis will run in simulation mode.");
    }
    ai = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

// -------------------------------------------------------------
// PERSISTENT DATA LAYER
// -------------------------------------------------------------
const STU_DB_FILE = path.join(process.cwd(), "db_students.json");
const COMP_DB_FILE = path.join(process.cwd(), "db_complaints.json");

const SEED_STUDENTS: Student[] = [
  { usn: "SG24CSE170", name: "Veeresh Reddy", class: "4th Semester", section: "A", department: "Computer Science & Engineering", password: "123456" },
  { usn: "SG24CSE164", name: "Vaibhav", class: "4th Semester", section: "B", department: "Computer Science & Engineering", password: "123456" },
  { usn: "SG24CSE152", name: "Sumit", class: "4th Semester", section: "A", department: "Computer Science & Engineering", password: "123456" },
  { usn: "SG24CSE173", name: "vishal", class: "4th Semester", section: "C", department: "Computer Science & Engineering", password: "123456" },
  { usn: "SG24CSE124", name: "Sharanagoda", class: "4th Semester", section: "B", department: "Computer Science & Engineering", password: "123456" },
  { usn: "SG24CSE128", name: "Shiva", class: "4th Semester", section: "A", department: "Computer Science & Engineering", password: "123456" },
  { usn: "SG24CSE512", name: "Vinod G ", class: "4th Semester", section: "c", department: "Computer Science & Engineering", password: "123456" },
];

let STU_DB: Student[] = [];
let isFreshStudentSeed = false;

try {
  if (fs.existsSync(STU_DB_FILE)) {
    STU_DB = JSON.parse(fs.readFileSync(STU_DB_FILE, "utf-8"));
    // Ensure all loaded students have passwords
    STU_DB.forEach(s => {
      if (!s.password) {
        s.password = "123456";
      }
    });
  } else {
    STU_DB = [...SEED_STUDENTS];
    isFreshStudentSeed = true;
    fs.writeFileSync(STU_DB_FILE, JSON.stringify(STU_DB, null, 2), "utf-8");
  }
} catch (e) {
  console.error("Failed to load/save STU_DB, using memory layout", e);
  STU_DB = [...SEED_STUDENTS];
}

function saveStudentsDB() {
  try {
    fs.writeFileSync(STU_DB_FILE, JSON.stringify(STU_DB, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write students DB to disk", err);
  }
}

const ROUTING_MAP: Record<Category, Department> = {
  'Hostel': 'Hostel Office',
  'IT Department': 'IT Support Staff',
  'Library': 'Library Staff',
  'Anti-Ragging': 'Anti-Ragging Cell',
  'Academics': 'Academic Dean Office',
  'Infrastructure': 'Estate & Maintenance',
  'Other': 'Academic Dean Office'
};

const SEED_COMPLAINTS: Complaint[] = [
  {
    id: "comp_101",
    title: "WiFi Access Point offline in Block-B Hostel Corridor",
    description: "The primary wireless access point is offline for the past three days. We are unable to access study materials and online classes. Kindly fix this as early as possible.",
    category: "IT Department",
    department: "IT Support Staff",
    status: "Resolved",
    isAnonymous: false,
    isEscalated: false,
    upvotes: 8,
    upvotedBy: ["SG24CSE164", "SG24CSE152"],
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    studentUsn: "SG24CSE170",
    studentName: "Veeresh Reddy",
    studentClass: "4th Semester",
    studentSec: "A",
    adminNotes: "IT team refreshed the specific router on 2nd Floor, Block B. Access is now verified and operational.",
    feedback: {
      rating: 5,
      comments: "Prompt action! WiFi is working great now.",
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  },
  {
    id: "comp_102",
    title: "Standard Reference books unavailable in Library",
    description: "The core text books for Computer Networks (8th edition by Tanenbaum) are very few in numbers (only 3 copies), causing high inconvenience. We request adding at least 10 more library copies.",
    category: "Library",
    department: "Library Staff",
    status: "In Progress",
    isAnonymous: false,
    isEscalated: false,
    upvotes: 14,
    upvotedBy: ["SG24CSE170", "SG24CSE152", "SG24CSE173"],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    studentUsn: "SG24CSE164",
    studentName: "Vaibhav",
    studentClass: "4th Semester",
    studentSec: "B",
    adminNotes: "Approved procurement of 12 more copies of Tanenbaum - Computer Networks. Ordered is placed, delivery expected on June 12th."
  },
  {
    id: "comp_103",
    title: "Emergency: senior students hostile behavior outside hostel entrance",
    description: "A group of senior students has been gathering outside the Block-B hostel entrance during late evening hours, causing noise and acting aggressively. We request immediate physical security patrol surveillance to keep our environment safe.",
    category: "Anti-Ragging",
    department: "Anti-Ragging Cell",
    status: "Under Review",
    isAnonymous: true,
    isEscalated: true,
    upvotes: 21,
    upvotedBy: ["SG24CSE170", "SG24CSE164", "SG24CSE173"],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    studentUsn: "SG24CSE152",
    studentName: "Anonymous Student",
    studentClass: "4th Semester",
    studentSec: "A",
    adminNotes: "Campus security supervisor alert dispatched. Patrolling scheduled between 7:30 PM & 9:30 PM daily."
  },
  {
    id: "comp_104",
    title: "Broken fan in Lecture Hall CR-401",
    description: "The second ceiling fan on row 3 is completely loose and producing standard high-frequency metallic noises when operational. Requesting early repairs to avoid a hazard.",
    category: "Infrastructure",
    department: "Estate & Maintenance",
    status: "Pending",
    isAnonymous: false,
    isEscalated: false,
    upvotes: 3,
    upvotedBy: [],
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    studentUsn: "SG24CSE173",
    studentName: "vishal",
    studentClass: "4th Semester",
    studentSec: "C"
  }
];

let complaints: Complaint[] = [];
let isFreshComplaintSeed = false;

try {
  if (fs.existsSync(COMP_DB_FILE)) {
    complaints = JSON.parse(fs.readFileSync(COMP_DB_FILE, "utf-8"));
  } else {
    complaints = [...SEED_COMPLAINTS];
    isFreshComplaintSeed = true;
    fs.writeFileSync(COMP_DB_FILE, JSON.stringify(complaints, null, 2), "utf-8");
  }
} catch (e) {
  console.error("Failed to load/save complaints DB, using memory seed", e);
  complaints = [...SEED_COMPLAINTS];
}

function saveComplaintsDB() {
  try {
    fs.writeFileSync(COMP_DB_FILE, JSON.stringify(complaints, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write complaints DB to disk", err);
  }
}

let notifications: SystemNotification[] = [
  {
    id: "notif_1",
    title: "Complaint Resolved",
    message: "Your complaint about WiFi Block-B Hostel has been marked as Resolved by IT Support Staff.",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    type: "success",
    read: true,
    forUsn: "SG24CSE170"
  },
  {
    id: "notif_2",
    title: "🚨 Urgent Security Escalation",
    message: "A critical Anti-Ragging grievance has been reported. Auto-routed dynamically to the Director Office.",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    type: "alert",
    read: false
  },
  {
    id: "notif_3",
    title: "Status Update",
    message: "Complaint 'Reference books unavailable' is now In Progress. Procurement of 12 copies approved.",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    type: "info",
    read: false,
    forUsn: "SG24CSE164"
  }
];

// Helper to push standard notifications
function addNotification(title: string, message: string, type: 'info' | 'success' | 'alert', forUsn?: string) {
  const notif: SystemNotification = {
    id: `notif_${Date.now()}`,
    title,
    message,
    timestamp: new Date().toISOString(),
    type,
    read: false,
    forUsn
  };
  notifications.unshift(notif);
}

// -------------------------------------------------------------
// START SERVER FUNCTION
// -------------------------------------------------------------
async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '12mb' }));

  // API: Verify USN & Password (Authenticating Student)
  app.post("/api/students/verify", (req, res) => {
    const { usn, password } = req.body;
    if (!usn) {
      return res.status(400).json({ error: "USN is required" });
    }
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    const cleanedUsn = usn.trim().toUpperCase();
    const student = STU_DB.find(s => s.usn === cleanedUsn);

    if (!student) {
      return res.status(404).json({ error: "USN not authorized or record missing in institute roster." });
    }

    const studentPass = student.password || "123456";
    if (password.trim() !== studentPass.trim()) {
      return res.status(401).json({ error: "Invalid student credentials. Please verify your USN and Password." });
    }

    res.json({ student });
  });

  // API: Add new student to authorized roster (Supports Password creation, defaults to 123456)
  app.post("/api/students", (req, res) => {
    const { usn, name, class: classLvl, section, department, password } = req.body;
    if (!usn || !name || !classLvl || !section || !department) {
      return res.status(400).json({ error: "All student fields are required: usn, name, class, section, department." });
    }

    const cleanedUsn = usn.trim().toUpperCase();
    if (STU_DB.some(s => s.usn === cleanedUsn)) {
      return res.status(400).json({ error: "This student USN is already authorized in the database." });
    }

    const newStudent: Student = {
      usn: cleanedUsn,
      name: name.trim(),
      class: classLvl.trim(),
      section: section.trim().toUpperCase(),
      department: department.trim(),
      password: (password && password.trim()) || "123456"
    };

    STU_DB.push(newStudent);
    isFreshStudentSeed = false;
    saveStudentsDB();
    res.status(201).json({ student: newStudent, students: STU_DB, message: "Authorized successfully" });
  });

  // API: Get authorized student list (for admin reference view)
  app.get("/api/students", (req, res) => {
    res.json(STU_DB);
  });

  // API: Update authorized student details (Allows password changes)
  app.put("/api/students/:usn", (req, res) => {
    const usn = decodeURIComponent(req.params.usn);
    const { name, class: classLvl, section, department, password } = req.body;
    
    if (!name || !classLvl || !section || !department) {
      return res.status(400).json({ error: "All student fields are required: name, class, section, department." });
    }

    const cleanedUsn = usn.trim().toUpperCase();
    const studentIdx = STU_DB.findIndex(s => s.usn === cleanedUsn);
    if (studentIdx === -1) {
      return res.status(404).json({ error: "Student not found in institute roster." });
    }

    STU_DB[studentIdx] = {
      usn: cleanedUsn,
      name: name.trim(),
      class: classLvl.trim(),
      section: section.trim().toUpperCase(),
      department: department.trim(),
      password: (password && password.trim()) ? password.trim() : (STU_DB[studentIdx].password || "123456")
    };

    isFreshStudentSeed = false;
    saveStudentsDB();
    res.json({ student: STU_DB[studentIdx], students: STU_DB, message: "Student account details updated successfully." });
  });

  // API: Delete student from authorized roster
  app.delete("/api/students/:usn", (req, res) => {
    const usn = decodeURIComponent(req.params.usn);
    const cleanedUsn = usn.trim().toUpperCase();

    const studentIdx = STU_DB.findIndex(s => s.usn === cleanedUsn);
    if (studentIdx === -1) {
      return res.status(404).json({ error: "Student not found in institute roster." });
    }

    STU_DB.splice(studentIdx, 1);
    isFreshStudentSeed = false;
    saveStudentsDB();
    res.json({ students: STU_DB, message: "Student de-authorized and removed from roster successfully." });
  });

  // API: Client-Server Self-Healing Sync & Restore Handshake
  // Only restores from client backup when server started from a fresh ephemeral seed
  app.post("/api/sync-restore", (req, res) => {
    const { students: clientStudents, complaints: clientComplaints } = req.body;

    if (isFreshStudentSeed && Array.isArray(clientStudents) && clientStudents.length > 0) {
      STU_DB = clientStudents
        .filter((s: Student) => s && s.usn && s.name)
        .map((s: Student) => ({
          ...s,
          usn: s.usn.trim().toUpperCase(),
          section: (s.section || "A").trim().toUpperCase(),
          password: s.password || "123456"
        }));
      isFreshStudentSeed = false;
      saveStudentsDB();
    }

    if (isFreshComplaintSeed && Array.isArray(clientComplaints) && clientComplaints.length > 0) {
      let updatedComp = false;
      clientComplaints.forEach((clientComp: Complaint) => {
        if (!clientComp.id) return;
        const idx = complaints.findIndex(c => c.id === clientComp.id);
        if (idx === -1) {
          complaints.unshift(clientComp);
          updatedComp = true;
        } else {
          const sC = complaints[idx];
          if (
            clientComp.status !== sC.status ||
            (clientComp.upvotes || 0) > (sC.upvotes || 0) ||
            clientComp.adminNotes !== sC.adminNotes ||
            clientComp.isEscalated !== sC.isEscalated
          ) {
            complaints[idx] = { ...sC, ...clientComp };
            updatedComp = true;
          }
        }
      });
      if (updatedComp) {
        saveComplaintsDB();
      }
      isFreshComplaintSeed = false;
    }

    res.json({
      students: STU_DB,
      complaints: complaints
    });
  });

  // API: Fetch all complaints
  app.get("/api/complaints", (req, res) => {
    res.json(complaints);
  });

  // API: Create new complaint (Automated Routing based on Category)
  app.post("/api/complaints", (req, res) => {
    const { title, description, category, isAnonymous, isEscalated, studentUsn, imageUrl } = req.body;

    if (!title || !description || !category || !studentUsn) {
      return res.status(400).json({ error: "Title, Description, Category, and Student USN are required" });
    }

    // Identify Student Record
    const student = STU_DB.find(s => s.usn === studentUsn);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Department routing logic
    let targetDept = ROUTING_MAP[category as Category] || "Academic Dean Office";
    if (isEscalated) {
      targetDept = "Director Office"; // Escalated goes direct to top-tier
    }

    const newComplaint: Complaint = {
      id: `comp_${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category: category as Category,
      department: targetDept,
      status: isEscalated ? "Escalated" : "Pending",
      isAnonymous: !!isAnonymous,
      isEscalated: !!isEscalated,
      upvotes: 0,
      upvotedBy: [],
      imageUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      studentUsn,
      studentName: isAnonymous ? "Anonymous Student" : student.name,
      studentClass: student.class,
      studentSec: student.section
    };

    complaints.unshift(newComplaint);
    saveComplaintsDB();

    // Notifications
    addNotification(
      isEscalated ? "🚨 Critical Escalation Filed" : "📝 New Complaint Filed",
      `Student ${newComplaint.studentName} filed a complaint under '${category}' routed to ${targetDept}.`,
      isEscalated ? "alert" : "info"
    );

    res.status(201).json(newComplaint);
  });

  // API: Toggle complaint upvote
  app.post("/api/complaints/:id/upvote", (req, res) => {
    const { id } = req.params;
    const { studentUsn } = req.body;

    if (!studentUsn) {
      return res.status(400).json({ error: "Student USN is required to register an upvote." });
    }

    const complaint = complaints.find(c => c.id === id);
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    const upvoteIndex = complaint.upvotedBy.indexOf(studentUsn);
    if (upvoteIndex !== -1) {
      // already upvoted, remove it
      complaint.upvotedBy.splice(upvoteIndex, 1);
      complaint.upvotes = Math.max(0, complaint.upvotes - 1);
    } else {
      // add upvote
      complaint.upvotedBy.push(studentUsn);
      complaint.upvotes += 1;

      // notify the creator if they aren't anonymous and didn't upvote themselves
      if (complaint.studentUsn !== studentUsn && !complaint.isAnonymous) {
        addNotification(
          "🔥 Complaint Upvoted",
          `Your post about '${complaint.title.substring(0, 30)}...' has reached ${complaint.upvotes} upvote(s).`,
          "info",
          complaint.studentUsn
        );
      }
    }

    complaint.updatedAt = new Date().toISOString();
    saveComplaintsDB();
    res.json(complaint);
  });

  // API: Update complaint status & admin notes (Admin Action)
  app.put("/api/complaints/:id/status", (req, res) => {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status fits is required." });
    }

    const complaint = complaints.find(c => c.id === id);
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    complaint.status = status as ComplaintStatus;
    if (adminNotes !== undefined) {
      complaint.adminNotes = adminNotes.trim();
    }
    complaint.updatedAt = new Date().toISOString();

    // Create notifications for the specific student
    addNotification(
      `🔔 Complaint ${status}`,
      `Department updated your complaint '${complaint.title.substring(0, 25)}...' to ${status}.`,
      status === "Resolved" ? "success" : "info",
      complaint.studentUsn
    );

    saveComplaintsDB();
    res.json(complaint);
  });

  // API: Assign department manually (Admin Overriding Route)
  app.put("/api/complaints/:id/assign", (req, res) => {
    const { id } = req.params;
    const { department } = req.body;

    if (!department) {
      return res.status(400).json({ error: "Department is required." });
    }

    const complaint = complaints.find(c => c.id === id);
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    const oldDept = complaint.department;
    complaint.department = department as Department;
    complaint.updatedAt = new Date().toISOString();

    addNotification(
      "🔄 Department Reassigned",
      `Complaint escalated / transferred from ${oldDept} to ${department}.`,
      "info",
      complaint.isAnonymous ? undefined : complaint.studentUsn
    );

    saveComplaintsDB();
    res.json(complaint);
  });

  // API: Student Feedback once Resolved
  app.put("/api/complaints/:id/feedback", (req, res) => {
    const { id } = req.params;
    const { rating, comments } = req.body;

    if (!rating) {
      return res.status(400).json({ error: "Feedback rating is required." });
    }

    const complaint = complaints.find(c => c.id === id);
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    if (complaint.status !== "Resolved") {
      return res.status(400).json({ error: "Feedback can only be submitted on resolved complaints." });
    }

    complaint.feedback = {
      rating,
      comments: (comments || "").trim(),
      submittedAt: new Date().toISOString()
    };
    complaint.updatedAt = new Date().toISOString();

    addNotification(
      "⭐ Student Feedback Submitted",
      `Student rated ${rating} Stars for complaint resolved by department '${complaint.department}'.`,
      "success"
    );

    saveComplaintsDB();
    res.json(complaint);
  });

  // API: System notifications list
  app.get("/api/notifications", (req, res) => {
    res.json(notifications);
  });

  // API: Mark notifications as read
  app.post("/api/notifications/read", (req, res) => {
    const { usn } = req.body;
    notifications.forEach(n => {
      if (usn) {
        if (n.forUsn === usn) n.read = true;
      } else {
        // Admin
        if (!n.forUsn) n.read = true;
      }
    });
    res.json({ success: true });
  });

  // API: AI Advice powered by Gemini
  app.post("/api/complaints/:id/ai-advice", async (req, res) => {
    const { id } = req.params;
    const complaint = complaints.find(c => c.id === id);

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Return simulated advice when key is not configured
      const simulatedAdvice = {
        threatLevel: complaint.isEscalated ? "High" : "Medium",
        suggestedRouting: ROUTING_MAP[complaint.category] || "Academic Dean Office",
        actionSteps: [
          "Arrange an immediate brief physical check or status review at the venue.",
          "Check CCTV records or maintenance logs corresponding to the timeline given.",
          "Inform the corresponding department lead immediately regarding pending timelines."
        ],
        draftReply: `Dear Student, we acknowledge the issue filed regarding "${complaint.title}". Our team has dispatched staff from the ${ROUTING_MAP[complaint.category]} team to examine this and institute necessary repairs/checks. Thank you for your alert.`
      };
      return res.json({ advice: simulatedAdvice, simulated: true });
    }

    try {
      const gemini = getGemini();

      const promptString = `You are a Smart Assistant for college Deans, Wardens and Administrative Staff.
Analyze this student complaint and return a structured JSON evaluation.

--- Student Complaint ---
Title: ${complaint.title}
Description: ${complaint.description}
Category: ${complaint.category}
Is Escalated: ${complaint.isEscalated ? "Yes (Highly Urgent)" : "No"}
-------------------------

Evaluate:
1. "threatLevel": One of ["Low", "Medium", "High", "Critical"].
2. "suggestedRouting": A logical target office department from: ["Hostel Office", "IT Support Staff", "Library Staff", "Anti-Ragging Cell", "Academic Dean Office", "Estate & Maintenance", "Director Office"].
3. "actionSteps": Array of 3 distinct, practical steps the admin staff should execute now to mitigate or solve the issue.
4. "draftReply": A warm, structured, reassuring, professional official reply we can send to the student. Ensure referencing the exact nature of their issue. If the issue is anonymous, respond neutrally and safely.

You must respond with the strict JSON format matching:
{
  "threatLevel": "string",
  "suggestedRouting": "string",
  "actionSteps": ["string", "string", "string"],
  "draftReply": "string"
}`;

      const response = await gemini.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: promptString,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              threatLevel: { type: Type.STRING },
              suggestedRouting: { type: Type.STRING },
              actionSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              draftReply: { type: Type.STRING }
            },
            required: ["threatLevel", "suggestedRouting", "actionSteps", "draftReply"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response text from Gemini");
      }

      const parsed = JSON.parse(text);
      res.json({ advice: parsed, simulated: false });

    } catch (err: any) {
      console.error("Gemini advice API error:", err);
      res.status(500).json({ error: "Failed to generate AI advice: " + err.message });
    }
  });

  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.argv[1]?.endsWith("server.cjs");

  // Vite middleware for development; static dist serving for production
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === "true" ? false : { server: httpServer },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Stop the other process or run with PORT=3001.`);
      process.exit(1);
    }
    throw err;
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started!`);
    console.log(`Local URL: http://localhost:${PORT}`);
    console.log(`Loopback URL: http://127.0.0.1:${PORT}`);
  });
}

startServer();
