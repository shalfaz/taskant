import mongoose, { Schema, Document, Model } from 'mongoose';
import type {
  VerificationStatus,
  TaskStatus,
  TaskCategory,
} from '../types/index';

export interface UserDocument extends Document {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  location: string;
  bio?: string;
  skills?: string[];
  profilePhoto?: string;
  profilePhotoPublicId?: string;
  role: 'user' | 'admin';
  tokenVersion: number;
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
    profilePhotoPublicId: String,
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    tokenVersion: { type: Number, default: 0 },
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
  pickup?: string;
  destination?: string;
  deadline: Date;
  budget: number;
  additionalInstructions?: string;
  attachments?: string[];
  attachmentAssets?: { url: string; publicId: string }[];
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
    pickup: String,
    destination: String,
    deadline: { type: Date, required: true },
    budget: { type: Number, required: true },
    additionalInstructions: String,
    attachments: [String],
    attachmentAssets: [{ url: { type: String, required: true }, publicId: { type: String, required: true } }],
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

export interface RideDocument extends Document {
  pickup: string;
  destination: string;
  vehicleType: 'Car' | 'Bike';
  departureAt: Date;
  availableSeats: number;
  fare: number;
  description?: string;
  status: 'Open' | 'Cancelled';
  driverId: mongoose.Types.ObjectId;
}

const rideSchema = new Schema<RideDocument>(
  {
    pickup: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    vehicleType: { type: String, enum: ['Car', 'Bike'], required: true },
    departureAt: { type: Date, required: true },
    availableSeats: { type: Number, required: true, min: 1, max: 8 },
    fare: { type: Number, required: true, min: 1 },
    description: { type: String, maxlength: 500 },
    status: { type: String, enum: ['Open', 'Cancelled'], default: 'Open' },
    driverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export interface RideRequestDocument extends Document {
  rideId: mongoose.Types.ObjectId;
  passengerId: mongoose.Types.ObjectId;
  status: 'Pending';
}

const rideRequestSchema = new Schema<RideRequestDocument>(
  {
    rideId: { type: Schema.Types.ObjectId, ref: 'Ride', required: true },
    passengerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Pending'], default: 'Pending' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

rideRequestSchema.index({ rideId: 1, passengerId: 1 }, { unique: true });

export interface StoreListingDocument extends Document {
  title: string;
  description: string;
  price: number;
  category: 'Electronics' | 'Fashion' | 'Books' | 'Furniture' | 'Accessories' | 'Home Appliances' | 'Others';
  condition: 'New' | 'Used';
  location: string;
  photos: string[];
  photoAssets?: { url: string; publicId: string }[];
  status: 'Available' | 'Sold';
  sellerId: mongoose.Types.ObjectId;
}

const storeListingSchema = new Schema<StoreListingDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    price: { type: Number, required: true, min: 1, max: 10000000 },
    category: {
      type: String,
      enum: ['Electronics', 'Fashion', 'Books', 'Furniture', 'Accessories', 'Home Appliances', 'Others'],
      required: true,
    },
    condition: { type: String, enum: ['New', 'Used'], required: true },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    photos: { type: [String], default: [], validate: [(photos: string[]) => photos.length <= 5, 'A listing can include at most five photos.'] },
    photoAssets: [{ url: { type: String, required: true }, publicId: { type: String, required: true } }],
    status: { type: String, enum: ['Available', 'Sold'], default: 'Available' },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

storeListingSchema.index({ sellerId: 1, status: 1, createdAt: -1 });
storeListingSchema.index({ category: 1, status: 1, createdAt: -1 });

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
  taskId?: mongoose.Types.ObjectId;
  listingId?: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  content: string;
  attachment?: string;
  attachmentPublicId?: string;
  read: boolean;
}

const messageSchema = new Schema<MessageDocument>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task' },
    listingId: { type: Schema.Types.ObjectId, ref: 'StoreListing' },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    attachment: String,
    attachmentPublicId: String,
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

export const User: Model<UserDocument> =
  (mongoose.models.User as Model<UserDocument> | undefined) ??
  mongoose.model<UserDocument>('User', userSchema);
export const Task: Model<TaskDocument> =
  (mongoose.models.Task as Model<TaskDocument> | undefined) ??
  mongoose.model<TaskDocument>('Task', taskSchema);
export const Ride: Model<RideDocument> =
  (mongoose.models.Ride as Model<RideDocument> | undefined) ??
  mongoose.model<RideDocument>('Ride', rideSchema);
export const RideRequest: Model<RideRequestDocument> =
  (mongoose.models.RideRequest as Model<RideRequestDocument> | undefined) ??
  mongoose.model<RideRequestDocument>('RideRequest', rideRequestSchema);
export const StoreListing: Model<StoreListingDocument> =
  (mongoose.models.StoreListing as Model<StoreListingDocument> | undefined) ??
  mongoose.model<StoreListingDocument>('StoreListing', storeListingSchema);
export const Bid: Model<BidDocument> =
  (mongoose.models.Bid as Model<BidDocument> | undefined) ??
  mongoose.model<BidDocument>('Bid', bidSchema);
export const Message: Model<MessageDocument> =
  (mongoose.models.Message as Model<MessageDocument> | undefined) ??
  mongoose.model<MessageDocument>('Message', messageSchema);
export const Notification: Model<NotificationDocument> =
  (mongoose.models.Notification as Model<NotificationDocument> | undefined) ??
  mongoose.model<NotificationDocument>('Notification', notificationSchema);
export const Payment: Model<PaymentDocument> =
  (mongoose.models.Payment as Model<PaymentDocument> | undefined) ??
  mongoose.model<PaymentDocument>('Payment', paymentSchema);
export const Review: Model<ReviewDocument> =
  (mongoose.models.Review as Model<ReviewDocument> | undefined) ??
  mongoose.model<ReviewDocument>('Review', reviewSchema);
export const Verification: Model<VerificationDocument> =
  (mongoose.models.Verification as Model<VerificationDocument> | undefined) ??
  mongoose.model<VerificationDocument>('Verification', verificationSchema);
export const Report: Model<ReportDocument> =
  (mongoose.models.Report as Model<ReportDocument> | undefined) ??
  mongoose.model<ReportDocument>('Report', reportSchema);
