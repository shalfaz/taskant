# 🐜 TaskAnt — Local Task & Delivery Assistance Platform

**Live Demo:** [taskant.vercel.app](https://taskant.vercel.app/)

TaskAnt is a full-stack community task and service marketplace that connects users needing everyday assistance with nearby helpers across 8 service categories, replacing traditional delivery dependency with fast, community-driven task fulfillment.

---

## 📸 Screenshots

![Home Feed](link-to-your-screenshot-1.png)
![AI Support Chat](link-to-your-screenshot-2.png)

---

## ✨ Key Features

- **Community Task Feed:** Post tasks, browse across 8 service categories, and bid on local requests.
- **Hybrid Authentication:** Seamless authentication bridging **Firebase Google Sign-In** with custom HTTP-only **JWT** session management.
- **AI Live Support Widget:** Integrated bilingual (English & Bangla) customer support assistant powered by Google's `@google/genai` SDK (`gemini-2.5-flash`).
- **Real-Time Communication & Tracking:** Direct messaging, task completion tracking, and user review system.
- **Media Management:** Fast image uploads and optimization via **Cloudinary**.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 16 (App Router), React, TypeScript, Tailwind CSS
- **Backend & Database:** Next.js API Routes, MongoDB, Mongoose
- **Authentication:** Firebase Auth, Custom JWT (HTTP-only cookies)
- **AI & Services:** Google Gemini API (`@google/genai`), Cloudinary

---

## 🔐 Demo Credentials

To test the platform without registering:
- **Quick Access:** Click **"Continue with Google"** on the login page
- **Email:** `demouser@gmail.com`
- **Password:** `taskant`

---

## 🚀 Run Locally

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/taskant.git](https://github.com/your-username/taskant.git)
   cd taskant