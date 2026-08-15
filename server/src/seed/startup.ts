import bcrypt from 'bcryptjs';
import { memoryDb, initMemoryStore } from '../db/memoryStore.js';

export async function seedOnStartup(): Promise<void> {
  initMemoryStore();

  if (memoryDb.users.count() > 0) {
    console.log('📂 Loaded existing data from store');
    return;
  }

  console.log('🌱 Seeding demo data...');
  const password = await bcrypt.hash('password123', 12);

  memoryDb.users.create({
    fullName: 'TaskAnt Admin',
    email: 'admin@taskant.com',
    phone: '+8801700000000',
    password,
    location: 'Dhaka',
    bio: 'Platform administrator',
    role: 'admin',
    verificationStatus: 'Verified',
    rating: 5,
    reviewCount: 0,
    completedTasks: 0,
    postedTasks: 0,
    isSuspended: false,
  });

  const shohan = memoryDb.users.create({
    fullName: 'Shohan Hossain',
    email: 'shohan@taskant.com',
    phone: '+8801711111111',
    password,
    location: 'Dhaka',
    bio: 'Student at Dhaka University. Often need help with tasks in other districts.',
    skills: ['Document Handling', 'Communication'],
    role: 'user',
    verificationStatus: 'Verified',
    rating: 4.8,
    reviewCount: 12,
    completedTasks: 8,
    postedTasks: 15,
    isSuspended: false,
  });

  const rahim = memoryDb.users.create({
    fullName: 'Rahim Ahmed',
    email: 'rahim@taskant.com',
    phone: '+8801722222222',
    password,
    location: 'Pabna',
    bio: 'Local task helper in Pabna district. Available for document and errand tasks.',
    skills: ['Document & Office Work', 'Local Errands', 'Parcel Collection'],
    role: 'user',
    verificationStatus: 'Verified',
    rating: 4.9,
    reviewCount: 24,
    completedTasks: 32,
    postedTasks: 5,
    isSuspended: false,
  });

  const karim = memoryDb.users.create({
    fullName: 'Karim Uddin',
    email: 'karim@taskant.com',
    phone: '+8801733333333',
    password,
    location: 'Rajshahi',
    bio: 'Reliable helper for shopping and local purchases in Rajshahi.',
    skills: ['Shopping & Purchase', 'Parcel & Delivery'],
    role: 'user',
    verificationStatus: 'Verified',
    rating: 4.7,
    reviewCount: 18,
    completedTasks: 21,
    postedTasks: 3,
    isSuspended: false,
  });

  const task1 = memoryDb.tasks.create({
    title: 'Collect Academic Certificate from Pabna',
    description:
      'I need someone to visit Pabna University and collect my academic certificate from the registrar office. I will provide authorization letter.',
    category: 'Academic Services',
    location: 'Pabna',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    budget: 800,
    additionalInstructions: 'Office hours: 9 AM - 4 PM. Bring student ID copy.',
    status: 'Bidding',
    posterId: shohan._id,
    progressNotes: [],
  });

  memoryDb.tasks.create({
    title: 'Receive Parcel from Pabna Post Office',
    description:
      'A parcel has arrived at Pabna General Post Office. Need someone to collect it with the tracking number I will share.',
    category: 'Parcel & Delivery',
    location: 'Pabna',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    budget: 500,
    status: 'Open',
    posterId: shohan._id,
    progressNotes: [],
  });

  memoryDb.tasks.create({
    title: 'Purchase Local Product from Rajshahi',
    description:
      'Looking for someone to purchase traditional Rajshahi silk fabric from a specific shop and ship it to Dhaka.',
    category: 'Shopping & Purchase',
    location: 'Rajshahi',
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    budget: 1500,
    status: 'Open',
    posterId: karim._id,
    progressNotes: [],
  });

  memoryDb.tasks.create({
    title: 'Submit Documents to Local Office in Dhaka',
    description:
      'Need help submitting visa application documents to the relevant office in Dhaka Motijheel area.',
    category: 'Document & Office Work',
    location: 'Dhaka',
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    budget: 600,
    status: 'Open',
    posterId: rahim._id,
    progressNotes: [],
  });

  memoryDb.bids.create({
    taskId: task1._id,
    bidderId: rahim._id,
    amount: 750,
    message:
      'I am located in Pabna and visit the university area regularly. I can collect your certificate within 2 days.',
    estimatedCompletion: '2 days',
    status: 'Pending',
  });

  memoryDb.notifications.create({
    userId: shohan._id,
    type: 'new_bid',
    title: 'New Bid Received',
    message: `Rahim Ahmed submitted a bid of ৳750 on "${task1.title}"`,
    link: `/tasks/${task1._id}`,
    read: false,
  });

  console.log('✅ Demo data seeded');
  console.log('   admin@taskant.com / password123');
  console.log('   shohan@taskant.com / password123');
  console.log('   rahim@taskant.com / password123');
}
