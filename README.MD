# 🎓 Studify Server

Backend API for **Studify**, a full-stack assignment management system.  
This server handles assignment CRUD, secure Firebase-authenticated routes, submission logic, and role-safe evaluations.

---

## 🌟 Features

- 📄 **Assignment Management:** Post, view, update, and delete assignments with filters for difficulty and title.
- 👥 **User-Specific Access:** Firebase-authenticated access with token validation and uid matching.
- ✅ **Submission Handling:** Prevent duplicate or self-submission of assignments.
- 📝 **Assignment Evaluation:** Only allow users to evaluate others' submissions — preventing self-evaluation, duplicate evaluations, and enabling updates to marks, feedback, and status.
- 🔍 **Search & Filter:** Filter assignments by difficulty or keyword.

---

## 🔗 Related Links

- **Client Repository:** [https://github.com/SarfarazAkram17/Studify-Client](https://github.com/SarfarazAkram17/Studify-Client)
- **Live Client Site:** [https://assignment-11-sarfaraz-akram.netlify.app](https://assignment-11-sarfaraz-akram.netlify.app)

---

## 🛠 Tech Stack

| Technology     | Purpose                            |
| -------------- | ---------------------------------- |
| Node.js        | JavaScript runtime                 |
| Express.js     | Web server & routing               |
| MongoDB Atlas  | Cloud-hosted NoSQL database        |
| Firebase Admin | Secure ID token verification       |
| dotenv         | Environment variable configuration |
| cors           | Cross-origin resource sharing      |

---

## 🔐 Authentication & Security

- Firebase ID tokens are passed via **Authorization: Bearer** headers.
- Middleware:
  - `verifyFirebaseToken`: Validates token and extracts UID.
  - `verifyTokenUid`: Ensures token UID matches query UID (user identity).

---

## 📦 API Endpoints

### 📘 Assignments

| Method | Endpoint           | Description                                         |
| ------ | ------------------ | --------------------------------------------------- |
| GET    | `/assignments`     | Get all assignments with optional filters           |
| GET    | `/assignments/:id` | Get assignment details by ID                        |
| GET    | `/myAssignments`   | Get assignments posted by a specific user (secured) |
| POST   | `/assignments`     | Create a new assignment (secured)                   |
| PUT    | `/assignments/:id` | Update an assignment (secured, only by owner)       |
| DELETE | `/assignments/:id` | Delete an assignment (secured, only by owner)       |

### 🧾 Submissions

| Method | Endpoint           | Description                                           |
| ------ | ------------------ | ----------------------------------------------------- |
| GET    | `/submissions`     | Get submissions by status or examinee email (secured) |
| GET    | `/submissions/:id` | Get submission with linked assignment info            |
| POST   | `/submissions`     | Submit assignment (secured, no self or duplicate)     |
| PATCH  | `/submissions/:id` | Evaluate a submission (secured, not self-review)      |

---

## 🧠 Submission Logic

- Prevents:
  - Submitting your own posted assignments.
  - Submitting the same assignment more than once.
  - Re-evaluating already completed submissions.
  - Self-evaluation of submissions.

# 🛠️ Getting Started

git clone https://github.com/SarfarazAkram17/Studify-Server.git <br />
cd Studify-Server
