# SafeSight K3

SafeSight K3 adalah web app monitoring K3 untuk mendeteksi worker dan kepatuhan penggunaan PPE dari **kamera laptop/webcam** terlebih dahulu. Arsitekturnya sudah disiapkan supaya nanti bisa di-upgrade ke model custom YOLO dan input CCTV/RTSP.

## Fitur

- Worker detection
- PPE detection: helmet, vest, shoes
- PPE compliance checker
- Real-time alert
- Database log pelanggaran
- Dashboard monitoring UI
- Report CSV generator
- Siap dikembangkan ke CCTV / RTSP stream

## Catatan Penting

Project ini **sudah lengkap secara struktur full-stack**, tapi akurasi PPE asli tetap bergantung pada **model custom** yang kamu latih sendiri.

Kalau file `models/ppe.pt` belum ada, aplikasi akan tetap jalan dalam **demo mode** agar dashboard, alur logging, alert, dan report tetap bisa dipresentasikan.

## Cara Menjalankan

### 1. Buat virtual environment

```bash
python -m venv .venv
```

---

## 🏗 Agile & Scrum Project Management

This project follows the Agile/Scrum framework to ensure iterative development, team collaboration, and continuous delivery. Below is the documentation of our project management process.

### 1. Team Roles
- **Product Owner (PO):** `[Name 1 / Daffa]`
  - *Responsibilities:* Defines the product vision, sets feature priorities (e.g., analytics, real-time alerts), ensures the application meets industrial safety standards, and manages the Product Backlog.
- **Scrum Master:** `[Name 2]`
  - *Responsibilities:* Facilitates Daily Standups, resolves technical blockers (e.g., Roboflow API integration, CORS issues), and ensures the team adheres to the Sprint timeline.
- **Developer:** `[Name 3]`
  - *Responsibilities:* Implements the architecture (Python/Flask backend, JavaScript frontend), designs the SQLite schema, trains the AI model, and manages the GitHub repository.

### 2. Product Backlogs & Priority

| ID | Priority | Type | Backlog Title | User Story & Goal |
| :--- | :---: | :--- | :--- | :--- |
| **BL-01** | 🔴 High | Feature | **AI Model Training** | *Goal:* Train a computer vision model on Roboflow to detect Helmets, Vests, and Shoes for real-time inference. |
| **BL-02** | 🔴 High | Feature | **Flask API & Backend** | *Goal:* Build a Python Flask backend to stream camera frames to Roboflow and return bounding box data. |
| **BL-03** | 🔴 High | Feature | **Live Monitoring UI** | *Goal:* Build a frontend dashboard using HTML5 Canvas to display real-time AI detection results. |
| **BL-04** | 🟡 Med | Feature | **Role-Based Access Control** | *Goal:* Separate user sessions into Superadmin (full config access) and Admin (monitoring only). |
| **BL-05** | 🟡 Med | Bug | **Dynamic Class Label Fix** | *Bug:* Workers not detected due to custom Roboflow labels (`none` / `no_helmet`). *Goal:* Update Python mapping logic. |
| **BL-06** | 🟡 Med | Feature | **Global Camera Config** | *Goal:* Create a centralized Modal UI for Superadmins to switch between USB Webcams and IP CCTV URLs. |
| **BL-07** | 🟢 Low | Bug | **DB Empty Log Prevention** | *Bug:* SQLite fills up with "Compliant" logs when rooms are empty. *Goal:* Block SQL `INSERT` when no subject is detected. |
| **BL-08** | 🟢 Low | Feature | **Analytics & CSV Export** | *Goal:* Visualize violation data using Chart.js and provide a CSV report download feature. |

### 3. Sprint Timeline (Daily Sprint Log)

We executed our development across multiple daily sprints. Below is the breakdown of tasks by date and technical domain:

*   **April 23, 2026 (Sprint Day 1 - Foundation)**
    *   **Backend:** Initialized Python Flask server environment and basic routing.
    *   **Frontend:** Designed the basic HTML structure and industrial-style CSS tokens.
    *   **Database:** Created the SQLite schema (`logs` table) and initialization script.
*   **April 25, 2026 (Sprint Day 2 - AI & Camera Integration)**
    *   **Backend:** Integrated Roboflow REST API via Python `requests` to process base64 images.
    *   **Frontend:** Implemented `navigator.mediaDevices` for USB webcam streaming and Canvas frame extraction.
*   **April 27, 2026 (Sprint Day 3 - Logic & UI Expansion)**
    *   **Backend:** Added geometric intersection algorithms to group detected PPE items per person.
    *   **Frontend:** Implemented bounding box drawing logic (Canvas 2D) and real-time alert boxes.
*   **April 28, 2026 (Sprint Day 4 - Enterprise Polish)**
    *   **Backend:** Implemented Flask Sessions for Superadmin vs Admin RBAC authentication.
    *   **Frontend:** Built the Settings Modal UI and integrated Chart.js for real-time violation analytics.
    *   **Database:** Added the CSV Export API endpoint.
*   **April 29, 2026 (Sprint Day 5 - Bug Fixing & Deployment)**
    *   **Backend:** Fixed critical logic bug to support custom Roboflow labels (`none`, `no_helmet`, `worker`).
    *   **Frontend:** Resolved CSS Specificity (`!important`) bugs on the Camera Modal and cleaned up demo logic.
    *   **Database:** Optimized `INSERT` statements to prevent database spamming on empty frames.

### 4. Sprint Review & Retrospective

- **Sprint Goal:** Deliver a robust, enterprise-grade real-time PPE detection system using Roboflow API with centralized hardware management and analytics.
- **Progress Completed:** 100% of core features (Computer Vision, Dashboard UI, Database Logging, RBAC) successfully implemented and deployed to the `main` branch.
- **Task Distribution:** Tasks were effectively parallelized—PO drafted the UI/UX, Scrum Master managed Git workflows, and Developer executed the Python/JS stack.
- **Challenges:**
  - *Data Mismatch:* Roboflow AI returned unconventional labels (`none` / `no_helmet`) instead of `person`, causing failure in worker detection.
  - *Data Spam:* The logging script was aggressively saving empty "safe" frames into SQLite every 1.8 seconds.
- **Solutions:**
  - Expanded Python validation arrays dynamically in `detector.py` to identify custom dataset labels.
  - Implemented an `if result.worker_detected:` gatekeeper to block empty frame insertions into the database.
- **Plan for Week 2:**
  - Conduct User Acceptance Testing (UAT) simulating actual factory conditions.
  - Prepare Pitch Deck and perform a live presentation demonstrating Superadmin IP CCTV integration.
