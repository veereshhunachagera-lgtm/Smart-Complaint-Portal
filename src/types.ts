export type ComplaintStatus = 'Pending' | 'Under Review' | 'In Progress' | 'Resolved' | 'Escalated';

export type Category = 'Hostel' | 'IT Department' | 'Library' | 'Anti-Ragging' | 'Academics' | 'Infrastructure' | 'Other';

export type Department = 'Hostel Office' | 'IT Support Staff' | 'Library Staff' | 'Anti-Ragging Cell' | 'Academic Dean Office' | 'Estate & Maintenance' | 'Director Office';

export interface Student {
  usn: string;
  name: string;
  class: string;
  section: string;
  department: string;
  password?: string;
}

export interface Feedback {
  rating: number; // 1 to 5 stars
  comments: string;
  submittedAt: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: Category;
  department: Department;
  status: ComplaintStatus;
  isAnonymous: boolean;
  isEscalated: boolean; // escalated to higher authorities
  upvotes: number;
  upvotedBy: string[]; // USNs of students who upvoted
  imageUrl?: string; // base64 string or placeholder
  createdAt: string;
  updatedAt: string;
  studentUsn: string;
  studentName: string; // Auto-filled
  studentClass: string; // Auto-filled
  studentSec: string; // Auto-filled
  adminNotes?: string;
  feedback?: Feedback;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'alert';
  read: boolean;
  forUsn?: string; // For a specific student, or undefined for admin
}
