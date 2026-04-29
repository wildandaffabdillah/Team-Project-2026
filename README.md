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