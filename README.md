# 🏘️ Resident Management & Community Fee System  
**(IT_4082 – Software Engineering Project)**

A **Full-Stack Web Application** for managing **residents, households, and community fees** in local residential areas (e.g. *community blocks / wards*).  
The system helps **community administrators** digitalize population management, fee collection, reporting, and resident notifications.

---

## 💻 Tech Stack

| Category | Technologies |
|:----------|:-------------|
| **Frontend** | React, Vite, React Router DOM, Axios |
| **Backend** | Node.js, Express.js |
| **ORM** | Prisma |
| **Database** | PostgreSQL |
| **Authentication & Security** | JWT, bcryptjs |
| **Reports & Export** | ExcelJS, PDFKit |
| **Development Tools** | Git, GitHub, VS Code |

---

## 🧭 Features

| Role | Main Responsibilities |
|:-----|:-----------------------|
| **Head / Deputy / Accountant** | Manage households, residents, fees, reports, and notifications |
| **Resident (Household)** | View household information, fees, invoices, and announcements |

---

## 🧩 Database Design (ERD & Schema Diagram)

The following diagrams illustrate the **database structure and relationships** used in the Resident Management & Community Fee System.

<p align="center">
  <img src="./docs/demo/ERD.drawio.png" width="700" alt="ERD Diagram" />
</p>
<p align="center">
  <img src="./docs/demo/schema.drawio.png" width="700" alt="Schema Diagram" />
</p>

---

## 🖼️ DEMO

### 👩‍💼 **Staff (Community Management) Interface**

<p align="center">
  <img src="./docs/demo/login-page.png" width="700" alt="Login Page" />
</p>

#### 🔹 Step-by-Step

1. **Login**  
   → Access the management dashboard based on assigned role permissions.  
   <p align="center">
      <img src="./docs/demo/staff-dashboard1.png" width="350" alt="Staff Dashboard 1" />
      <img src="./docs/demo/staff-dashboard2.png" width="350" alt="Staff Dashboard 2" />
   </p>

2. **Household Management**  
   → Create, update, and deactivate households; manage household information.  
   <p align="center"><img src="./docs/demo/households.png" width="700" alt="Household Management" /></p>
   <p align="center"><img src="./docs/demo/create-household.png" width="700" alt="Create Household" /></p>
   <p align="center"><img src="./docs/demo/household-detail.png" width="700" alt="Household Detail" /></p>

3. **Resident Management**  
   → Add residents, update resident status, and manage household members.  
   <p align="center"><img src="./docs/demo/residents.png" width="700" alt="Resident Management" /></p>
   <p align="center"><img src="./docs/demo/resident-detail.png" width="700" alt="Resident Detail" /></p>
   <p align="center"><img src="./docs/demo/resident-detail2.png" width="700" alt="Resident Detail 2" /></p>

4. **Resident Change Management**  
   → Create and manage resident change records (birth, temporary residence, move-in, move-out, etc.).  
   <p align="center"><img src="./docs/demo/resident-changes.png" width="700" alt="Resident Changes" /></p>
   <p align="center"><img src="./docs/demo/create-resident-changes.png" width="700" alt="Create Resident Changes" /></p>
   <p align="center"><img src="./docs/demo/resident-change-detail.png" width="700" alt="Resident Change Detail" /></p>

5. **Resident Change History**  
   → Track population changes such as birth registration, temporary residence, temporary absence, move-in, and move-out.  
   <p align="center"><img src="./docs/demo/resident-changes-history.png" width="700" alt="Resident Change History" /></p>
   <p align="center"><img src="./docs/demo/resident-change-detail2.png" width="700" alt="Resident Change Detail 2" /></p>

6. **Fee Management**  
   → Create mandatory or voluntary community fees and define fee duration.  
   <p align="center"><img src="./docs/demo/fees.png" width="700" alt="Fee Management" /></p>
   <p align="center"><img src="./docs/demo/create-fee.png" width="700" alt="Create Fee" /></p>
   <p align="center"><img src="./docs/demo/fee-record.png" width="700" alt="Fee Record" /></p>

7. **Fee History**  
   → View fee collection history, payment status, and detailed invoices for each household.  
   <p align="center"><img src="./docs/demo/fee-history.png" width="700" alt="Fee History" /></p>
   <p align="center"><img src="./docs/demo/fee-history-detail.png" width="700" alt="Fee History Detail" /></p>

8. **Reports & Export**  
   → View revenue statistics and export reports to Excel or PDF.  
   <p align="center"><img src="./docs/demo/report1.png" width="700" alt="Reports 1" /></p>
   <p align="center"><img src="./docs/demo/report2.png" width="700" alt="Reports 2" /></p>
   <p align="center"><img src="./docs/demo/report3.png" width="700" alt="Reports 3" /></p>
   <p align="center"><img src="./docs/demo/report-excel.png" width="700" alt="Export Excel" /></p>

9. **Notifications**  
   → Create announcements and warnings for all households.  
   <p align="center"><img src="./docs/demo/notification.png" width="700" alt="Notifications" /></p>

---

### 🏠 **Resident Interface**

#### 🔹 Step-by-Step

1. **Login as Resident**  
   → Access the household home.  
   <p align="center"><img src="./docs/demo/resident-home.png" width="700" alt="Resident Home" /></p>
   <p align="center"><img src="./docs/demo/resident-home2.png" width="700" alt="Resident Home 2" /></p>
   <p align="center"><img src="./docs/demo/resident-home3.png" width="700" alt="Resident Home 3" /></p>

2. **Household Information**  
   → View household members, household code, and current status.  
   <p align="center"><img src="./docs/demo/resident-household.png" width="700" alt="Household Information" /></p>

3. **Fee & Invoice Tracking**  
   → View fees, invoices, and payment status.  
   <p align="center"><img src="./docs/demo/resident-view-fees.png" width="700" alt="Resident Fees" /></p>
   <p align="center"><img src="./docs/demo/resident-view-fees2.png" width="700" alt="Resident Fees 2" /></p>
   <p align="center"><img src="./docs/demo/resident-view-fees3.png" width="700" alt="Resident Fees 3" /></p>
   <p align="center"><img src="./docs/demo/resident-view-fee-history.png" width="700" alt="Resident Fee History" /></p>

4. **Notifications**  
   → Receive announcements and important notices from community management.  
   <p align="center"><img src="./docs/demo/resident-notification.png" width="700" alt="Resident Notifications" /></p>

---

## 🚀 Run the Project on Your Machine

### ⚙️ Prerequisites
Before starting, make sure you have installed:
- **Node.js** ≥ 18.x  
- **npm** ≥ 9.x  
- **PostgreSQL** ≥ 14  
- **Git**

---

### 🧱 1. Clone Repository

| Step | Command |
|:-----|:---------|
| Clone the project from GitHub | `git clone https://github.com/your-username/IT_4082-resident-management.git` |
| Move into the project directory | `cd IT_4082-resident-management` |

---

### 🗃️ 2. Database Setup (Local PostgreSQL)

| Step | Command |
|:-----|:---------|
| Create a new database | `CREATE DATABASE resident_management;` |

---

### 🖥️ 3. Backend Setup

| Step | Command |
|:-----|:---------|
| Navigate to backend folder | `cd backend` |
| Install dependencies | `npm install` |
| Generate Prisma client | `npx prisma generate` |
| Apply database migrations | `npx prisma migrate dev --name init` |
| (Optional) Insert seed data | `npx prisma db seed` |
| Start backend server | `npm run dev` |

✅ The backend server will run at **http://localhost:5000**

---

### 💻 4. Frontend Setup

| Step | Command |
|:-----|:---------|
| Move to frontend directory | `cd ../frontend` |
| Install dependencies | `npm install` |
| Start frontend server | `npm run dev` |

✅ The frontend server will run at **http://localhost:5173**

---

### 👤 5. Test Accounts (from Seed Data)

| Role | Username | Password |
|:-----|:---------|:----------|
| Head | head | 123456 |
| Accountant | accountant | 123456 |
| Resident | resident | 123456 |

Use these accounts to log in and explore the system.

---

### 🧩 6. Build for Production (Optional)

| Step | Command |
|:-----|:---------|
| Build frontend | `cd frontend` → `npm run build` → `npm run preview` |
| Build and run backend | `cd ../backend` → `npm run build` → `npm start` |

---

### 🧰 7. Common Issues

| Issue | Possible Cause / Solution |
|:------|:---------------------------|
| **Database connection error** | Check `DATABASE_URL` and ensure PostgreSQL is running |
| **Prisma migration fails** | Make sure the database exists before migrating |
| **CORS issue** | Verify frontend API URL matches backend |
| **Port already in use** | Change port in `.env` or configuration files |
| **Git conflicts** | Run `git pull --rebase origin main` before pushing |

---

### ✅ Project Ready!
Open your browser and visit:  
- **Staff Dashboard:** http://localhost:5173/staff  
- **Resident Home:** http://localhost:5173/resident
