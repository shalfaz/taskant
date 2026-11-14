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
  pickup?: string;
  destination?: string;
  deadline: string;
  budget: number;
  additionalInstructions?: string;
  attachments?: string[];
  attachmentAssets?: CloudinaryAsset[];
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

export interface CloudinaryAsset {
  url: string;
  publicId: string;
  format?: string;
  bytes?: number;
}

export interface Ride {
  _id: string;
  pickup: string;
  destination: string;
  vehicleType: 'Car' | 'Bike';
  departureAt: string;
  availableSeats: number;
  fare: number;
  description?: string;
  status: 'Open' | 'Cancelled';
  driverId: string;
  driver?: User | null;
  createdAt: string;
  updatedAt: string;
  isSample?: boolean;
}

export interface RideRequest {
  _id: string;
  rideId: string;
  passengerId: string;
  status: 'Pending';
  passenger?: User | null;
  ride?: Ride;
  createdAt: string;
}

export type StoreCategory =
  | 'Electronics'
  | 'Fashion'
  | 'Books'
  | 'Furniture'
  | 'Accessories'
  | 'Home Appliances'
  | 'Others';

export interface StoreListing {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: StoreCategory;
  condition: 'New' | 'Used';
  location: string;
  photos: string[];
  photoAssets?: CloudinaryAsset[];
  status: 'Available' | 'Sold';
  sellerId: string;
  seller?: User | null;
  createdAt: string;
  updatedAt: string;
  isSample?: boolean;
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
  task?: Task | null;
  createdAt: string;
}

export interface Message {
  _id: string;
  taskId?: string;
  listingId?: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachment?: string;
  attachmentPublicId?: string;
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
  type?: 'task' | 'listing';
  taskId: string;
  listingId?: string;
  otherUserId?: string;
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
  'Delivery',
  'Shopping & Errands',
  'Document & Office Work',
  'Home Services',
  'Technology',
  'Education',
  'Others',
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
