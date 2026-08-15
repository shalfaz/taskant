export type VerificationStatus = 'Unverified' | 'Pending' | 'Verified' | 'Rejected';
export type TaskStatus = 'Open' | 'Bidding' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled';

export interface User {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
  location: string;
  bio?: string;
  skills?: string[];
  profilePhoto?: string;
  role: 'user' | 'admin';
  verificationStatus: VerificationStatus;
  rating: number;
  reviewCount: number;
  completedTasks: number;
  postedTasks: number;
  createdAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  deadline: string;
  budget: number;
  additionalInstructions?: string;
  attachments?: string[];
  status: TaskStatus;
  posterId: string;
  workerId?: string;
  acceptedBidId?: string;
  progressNotes?: { note: string; status: TaskStatus; createdAt: string }[];
  poster?: User;
  worker?: User;
  bidCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Bid {
  _id: string;
  taskId: string;
  bidderId: string;
  amount: number;
  message: string;
  estimatedCompletion: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  bidder?: User;
  task?: Task;
  createdAt: string;
}

export interface Message {
  _id: string;
  taskId: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachment?: string;
  read: boolean;
  sender?: User;
  createdAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface Payment {
  _id: string;
  taskId: string;
  payerId: string;
  payeeId: string;
  amount: number;
  serviceFee: number;
  total: number;
  method: string;
  transactionId: string;
  status: 'Pending' | 'Completed' | 'Failed';
  taskTitle?: string;
  createdAt: string;
}

export interface Review {
  _id: string;
  taskId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string;
  reviewer?: User;
  taskTitle?: string;
  createdAt: string;
}

export interface Conversation {
  taskId: string;
  taskTitle: string;
  otherUser: User | null;
  lastMessage?: Message;
  unread: number;
}

export interface DashboardStats {
  postedCount: number;
  acceptedCount: number;
  activePosted: number;
  activeAccepted: number;
  completedPosted: number;
  completedAccepted: number;
  pendingBids: number;
  unreadNotifications: number;
  earnings: number;
  spending: number;
}

export const TASK_CATEGORIES = [
  'Document & Office Work',
  'Parcel & Delivery',
  'Shopping & Purchase',
  'Academic Services',
  'Local Errands',
  'Government/Institutional Assistance',
  'Personal Assistance',
  'Other',
];

export const REPORT_TYPES = [
  'Suspicious User',
  'Suspicious Task',
  'Fraud',
  'Inappropriate Behavior',
  'Payment Issue',
  'Other',
];

export const PAYMENT_METHODS = ['bKash Demo', 'Nagad Demo', 'Card Demo'];
