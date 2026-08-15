export type VerificationStatus = 'Unverified' | 'Pending' | 'Verified' | 'Rejected';
export type TaskStatus = 'Open' | 'Bidding' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled';
export type TaskCategory =
  | 'Document & Office Work'
  | 'Parcel & Delivery'
  | 'Shopping & Purchase'
  | 'Academic Services'
  | 'Local Errands'
  | 'Government/Institutional Assistance'
  | 'Personal Assistance'
  | 'Other';

export interface IUser {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
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
  isSuspended: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITask {
  _id: string;
  title: string;
  description: string;
  category: TaskCategory;
  location: string;
  deadline: Date;
  budget: number;
  additionalInstructions?: string;
  attachments?: string[];
  status: TaskStatus;
  posterId: string;
  workerId?: string;
  acceptedBidId?: string;
  progressNotes?: { note: string; status: TaskStatus; createdAt: Date }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IBid {
  _id: string;
  taskId: string;
  bidderId: string;
  amount: number;
  message: string;
  estimatedCompletion: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  createdAt: Date;
}

export interface IMessage {
  _id: string;
  taskId: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachment?: string;
  read: boolean;
  createdAt: Date;
}

export interface INotification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

export interface IPayment {
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
  createdAt: Date;
}

export interface IReview {
  _id: string;
  taskId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface IVerification {
  _id: string;
  userId: string;
  documentType: string;
  documentNumber: string;
  notes?: string;
  status: VerificationStatus;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReport {
  _id: string;
  reporterId: string;
  reportType: string;
  description: string;
  relatedUserId?: string;
  relatedTaskId?: string;
  attachment?: string;
  status: 'Pending' | 'Under Review' | 'Resolved' | 'Dismissed';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicUser {
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
  createdAt: Date;
}

export interface AuthRequest {
  user?: {
    id: string;
    role: 'user' | 'admin';
  };
}
