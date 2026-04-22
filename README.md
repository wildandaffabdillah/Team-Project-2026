# Team Project 2026 - PPE Compliance Monitoring System

## Description
A comprehensive AI-powered Personal Protective Equipment (PPE) Compliance Monitoring System. Designed to track worker safety autonomously via CCTV integrations, utilizing real-time Computer Vision detection, and presenting data through an interactive Glassmorphism Web Dashboard.

## Team Members
1. Wildan Daffa
2. Jeremi
3. Sasi

## Roles Distribution
1. **Wildan Daffa** - Backend
2. **Jeremi** - Database
3. **Sasi** - Frontend

## Technologies & Tools
- **Frontend:** ReactJS, Vite, Chart.js, Vanilla CSS
- **Backend:** Python, Flask, OpenCV (cv2), SQLite, JWT Configs
- **AI/ML Model:** Roboflow Remote API Detection
- **Version Control:** Git, GitHub

---

## Scrum Roles

| Member | Role | Responsibility |
|--------|------|--------------|
| **Jeremi** | Product Owner | Defines requirements, manages backlog, sets priorities |
| **Sasi** | Scrum Master | Facilitates sprint process, ensures coordination |
| **Wildan, Jeremi, Sasi** | Developer | Develops backend, AI model, and system integration |

---

## Product Backlog List

### **1. Worker Detection from CCTV**
- **Type:** Feature
- **User Story:** As a system, I want to detect workers from CCTV so that monitoring can be automated
- **Goal:** Identify human presence in video
- **Priority:** 🔴 High

### **2. PPE Detection (Helmet, Vest, Shoes)**
- **Type:** Feature
- **User Story:** As a system, I want to detect PPE usage so that safety compliance can be evaluated
- **Goal:** Detect helmet, vest, and safety shoes
- **Priority:** 🔴 High

### **3. PPE Compliance Checker**
- **Type:** Feature
- **User Story:** As a system, I want to evaluate PPE compliance so that violations can be identified
- **Goal:** Ensure workers follow PPE rules
- **Priority:** 🔴 High

### **4. Real-time Alert System**
- **Type:** Feature
- **User Story:** As a user, I want to receive alerts so that I can respond quickly to violations
- **Goal:** Send notifications when violations occur
- **Priority:** 🔴 High

### **5. Database for Logs & Violations**
- **Type:** Feature
- **User Story:** As a system, I want to store violation data so that it can be analyzed later
- **Goal:** Store worker activity and violations
- **Priority:** 🔴 High

### **6. Dashboard Monitoring UI**
- **Type:** Feature
- **User Story:** As a user, I want to monitor results visually so that I can track safety conditions
- **Goal:** Display CCTV feed and PPE status
- **Priority:** 🟡 Medium

### **7. Report Generation System**
- **Type:** Feature
- **User Story:** As a user, I want to generate reports so that I can review compliance trends
- **Goal:** Generate daily and weekly reports
- **Priority:** 🟡 Medium

### **8. Model Accuracy Improvement**
- **Type:** Improvement
- **User Story:** As a developer, I want to improve model accuracy so that detection becomes more reliable
- **Goal:** Reduce detection errors
- **Priority:** 🟢 Low

### **9. Bug Fix: False Detection**
- **Type:** Bug
- **User Story:** As a developer, I want to reduce false detection so that results are more accurate
- **Goal:** Fix incorrect detections
- **Priority:** 🟡 Medium

---

## Backlog Priority Summary

| Priority | Description |
|--------|------------|
| 🔴 High | Core system features (detection, compliance, alerts, database) |
| 🟡 Medium | Supporting features (UI, reporting, bug fixes) |
| 🟢 Low | Optimization and improvements |

---

## Sprint Methods

### 📆 Daily Sprint (Team Source Repo)
- **Time/Frequency:** Dilakukan setiap hari secara *asynchronous*.
- **Aktivitas:** Setiap _Developer_ mendorong (*push*) potongan kode fitur atau perbaikan *bug* ke Github (*repository*) secara berkala.
- **Goals:** Menjaga _version control_ tetap segar dan memastikan seluruh progres harian tercatat jelas. Dalam komunikasi harian, tim secara singkat memperbarui tentang:
    1. Apa yang dikerjakan kemarin?
    2. Apa yang akan dikerjakan hari ini?
    3. Apakah ada kendala/blocker yang menghalangi?

### 📅 Weekly Sprint (Sinkronisasi Mingguan)
- **Time/Frequency:** Sesi diskusi mendalam dilakukan setiap satu minggu sekali.
- **Aktivitas:** *Sprint Review* dan *Sprint Retrospective* bersama seluruh tim.
- **Goals:** Mendemonstrasikan fitur yang telah berhasil terintegrasi utuh (misal, backend berhasil mengirim data ke frontend). Mengukur persentase pencapaian dari iterasi minggu tersebut, mengkaji tantangan yang ditemui, serta menentukan *Priority Backlogs* mana yang akan dieksekusi untuk Sprint minggu selanjutnya.

## 🚀 Sprint 1 Report

---

### 🎯 Sprint Goal

The goal of Sprint 1 was to:

- Build the foundation of the PPE Monitoring System  
- Set up the backend (Flask API + AI detection)  
- Develop a basic frontend dashboard  
- Connect frontend with backend (API integration)  
- Implement basic authentication (login + token)  

---

### 📈 Progress Completed

The following have been successfully implemented:

#### 🔹 Backend
- Flask API with multiple endpoints:
  - `/login` (authentication)  
  - `/video/<cam_id>` (camera streaming + AI detection)  
  - `/alerts` (violation data)  
  - `/settings` (API key & camera configuration)  
  - `/report` (PDF export)  
- AI detection integrated using Roboflow API  
- PPE detection system (helmet & vest) with violation logging to database  
- Multi-threading implemented for non-blocking AI processing  

#### 🔹 Frontend
- Dashboard UI developed:
  - Worker statistics, violations, safe workers  
  - Chart visualization  
  - Alerts list fetched from backend  
- API integration using fetch (`/alerts`)  

#### 🔹 UI/UX
- Modern dashboard design (dark mode, card layout, grid system)  
- Basic page structure initialized (`index.html`)  

---

### 👥 Task Distribution

#### 👨‍💻 Backend Developer (Wildan)
- Flask API development  
- AI detection integration  
- Database & violation logging  
- Video streaming system  

#### 🎨 Frontend Developer (Sasi)
- Dashboard UI development  
- Chart & alert display  
- Styling and layout  

#### 📊 Product Owner / Database (Jeremi)
- Database structure design  
- Managing violation data  
- Defining core system features  

---

### ⚠️ Challenges & Solutions

#### 🔴 Challenges
- **Integrating AI with real-time video**  
  AI processing is heavy and may cause lag  

- **Frontend & backend synchronization**  
  Backend requires authentication token, but frontend does not fully handle it yet  

- **Static dashboard data**  
  Values (20, 5, 15) are still hardcoded  

- **Camera error handling**  
  Camera may go offline or fail to read frames  

---

#### 🟢 Solutions
- ✔ Implement background threading  
  → Already applied using `ThreadPoolExecutor`  

- ✔ Use prediction caching  
  → Avoid running detection on every frame  

- ✔ Add fallback mechanisms:
  - Offline frame display  
  - Delay handling for errors  

- ✔ Use API `/alerts` for real-time updates  
  → Already integrated in frontend  

---

### 📅 Plan for Week 2 (Sprint 2)

#### 🚀 Backend
- Improve authentication (frontend must use token)  
- Add new endpoints:
  - Real-time statistics (total workers, violations, safe workers)  
- Optimize database queries  

#### 🎨 Frontend
- Replace static data with dynamic API data  
- Add login page (since backend already supports it)  
- Integrate live video streaming into dashboard  

#### 🧠 AI & System
- Improve detection accuracy  
- Add more PPE categories (shoes, gloves, etc.)  
- Enhance logging (timestamp + violation type)  

#### 📊 Additional Features
- Real-time dashboard updates  
- Data filtering (daily / weekly)  
- UI for exporting reports (trigger `/report`)  
