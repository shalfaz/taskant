import mongoose, { Schema, Document, Model } from 'mongoose';
import type {
  VerificationStatus,
  TaskStatus,
  TaskCategory,
} from '../types/index.js';

export interface UserDocument extends Document {
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
}

const userSchema = new Schema<UserDocument>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    location: { type: String, required: true },
    bio: String,
    skills: [String],
    profilePhoto: String,
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    verificationStatus: {
      type: String,
      enum: ['Unverified', 'Pending', 'Verified', 'Rejected'],
      default: 'Unverified',
    },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    postedTasks: { type: Number, default: 0 },
    isSuspended: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export interface TaskDocument extends Document {
  title: string;
  description: string;
  category: TaskCategory;
  location: string;
  deadline: Date;
  budget: number;
  additionalInstructions?: string;
  attachments?: string[];
  status: TaskStatus;
  posterId: mongoose.Types.ObjectId;
  workerId?: mongoose.Types.ObjectId;
  acceptedBidId?: mongoose.Types.ObjectId;
  progressNotes?: { note: string; status: TaskStatus; createdAt: Date }[];
}

const taskSchema = new Schema<TaskDocument>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: String, required: true },
    deadline: { type: Date, required: true },
    budget: { type: Number, required: true },
    additionalInstructions: String,
    attachments: [String],
    status: {
      type: String,
      enum: ['Open', 'Bidding', 'Assigned', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Open',
    },
    posterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    workerId: { type: Schema.Types.ObjectId, ref: 'User' },
    acceptedBidId: { type: Schema.Types.ObjectId, ref: 'Bid' },
    progressNotes: [
      {
        note: String,
        status: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export interface BidDocument extends Document {
  taskId: mongoose.Types.ObjectId;
  bidderId: mongoose.Types.ObjectId;
  amount: number;
  message: string;
  estimatedCompletion: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
}

const bidSchema = new Schema<BidDocument>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    bidderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    message: { type: String, required: true },
    estimatedCompletion: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export interface MessageDocument extends Document {
  taskId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  content: string;
  attachment?: string;
  read: boolean;
}

const messageSchema = new Schema<MessageDocument>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    attachment: String,
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export interface NotificationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: String,
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export interface PaymentDocument extends Document {
  taskId: mongoose.Types.ObjectId;
  payerId: mongoose.Types.ObjectId;
  payeeId: mongoose.Types.ObjectId;
  amount: number;
  serviceFee: number;
  total: number;
  method: string;
  transactionId: string;
  status: 'Pending' | 'Completed' | 'Failed';
}

const paymentSchema = new Schema<PaymentDocument>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    payerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    payeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    serviceFee: { type: Number, required: true },
    total: { type: Number, required: true },
    method: { type: String, required: true },
    transactionId: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export interface ReviewDocument extends Document {
  taskId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId;
  revieweeId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
}

const reviewSchema = new Schema<ReviewDocument>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    revieweeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export interface VerificationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  documentType: string;
  documentNumber: string;
  notes?: string;
  status: VerificationStatus;
  adminNotes?: string;
}

const verificationSchema = new Schema<VerificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    documentType: { type: String, required: true },
    documentNumber: { type: String, required: true },
    notes: String,
    status: {
      type: String,
      enum: ['Unverified', 'Pending', 'Verified', 'Rejected'],
      default: 'Pending',
    },
    adminNotes: String,
  },
  { timestamps: true }
);

export interface ReportDocument extends Document {
  reporterId: mongoose.Types.ObjectId;
  reportType: string;
  description: string;
  relatedUserId?: mongoose.Types.ObjectId;
  relatedTaskId?: mongoose.Types.ObjectId;
  attachment?: string;
  status: 'Pending' | 'Under Review' | 'Resolved' | 'Dismissed';
  adminNotes?: string;
}

const reportSchema = new Schema<ReportDocument>(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reportType: { type: String, required: true },
    description: { type: String, required: true },
    relatedUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    relatedTaskId: { type: Schema.Types.ObjectId, ref: 'Task' },
    attachment: String,
    status: {
      type: String,
      enum: ['Pending', 'Under Review', 'Resolved', 'Dismissed'],
      default: 'Pending',
    },
    adminNotes: String,
  },
  { timestamps: true }
);

export const User: Model<UserDocument> = mongoose.model<UserDocument>('User', userSchema);
export const Task: Model<TaskDocument> = mongoose.model<TaskDocument>('Task', taskSchema);
export const Bid: Model<BidDocument> = mongoose.model<BidDocument>('Bid', bidSchema);
export const Message: Model<MessageDocument> = mongoose.model<MessageDocument>('Message', messageSchema);
export const Notification: Model<NotificationDocument> = mongoose.model<NotificationDocument>('Notification', notificationSchema);
export const Payment: Model<PaymentDocument> = mongoose.model<PaymentDocument>('Payment', paymentSchema);
export const Review: Model<ReviewDocument> = mongoose.model<ReviewDocument>('Review', reviewSchema);
export const Verification: Model<VerificationDocument> = mongoose.model<VerificationDocument>('Verification', verificationSchema);
export const Report: Model<ReportDocument> = mongoose.model<ReportDocument>('Report', reportSchema);
