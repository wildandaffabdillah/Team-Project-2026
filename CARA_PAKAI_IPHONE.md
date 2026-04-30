# Halo Daffa! 

Sepertinya kotak chat AI Anda sedang error/nge-bug sehingga balasan saya tidak muncul di layar Anda. Jadi saya menuliskannya langsung ke dalam file ini agar Anda bisa membacanya!

---

### Jawaban: APAKAH BISA PAKAI KAMERA IPHONE UNTUK IP CCTV?
**Tentu saja SANGAT BISA!** Malah menggunakan iPhone akan memberikan hasil deteksi AI yang jauh lebih tajam.

Caranya sangat mudah:

1. **Unduh Aplikasi di iPhone:**
   Buka App Store dan unduh aplikasi gratis bernama **"IP Camera Lite"** (atau aplikasi sejenis yang memiliki fitur *HTTP/MJPEG server*).
   
2. **Satu Jaringan Wi-Fi:**
   Pastikan iPhone Anda terhubung ke **jaringan Wi-Fi yang sama** dengan laptop yang menjalankan sistem SafeSight K3. Jika tidak ada Wi-Fi, gunakan *Personal Hotspot* dari iPhone ke laptop.

3. **Mulai Streaming di iPhone:**
   Buka aplikasi *IP Camera Lite*, lalu tekan tombol **Start Server** (Mulai).
   Di layar iPhone Anda akan muncul sebuah alamat URL lokal, biasanya berbentuk seperti ini:
   👉 `http://192.168.1.15:8080`

4. **Masukkan ke Dashboard SafeSight K3:**
   - Login ke web SafeSight K3 sebagai `superadmin`
   - Klik tombol **⚙️ Camera Settings**
   - Pilih opsi **IP CCTV URL (Phone/MJPEG)**
   - Di kolom URL, masukkan alamat IP yang ada di iPhone Anda, lalu **WAJIB tambahkan `/video` di bagian akhirnya.**
   *(Contoh: Jika di iPhone tertulis `http://192.168.1.15:8080`, maka yang dimasukkan ke web adalah `http://192.168.1.15:8080/video`)*
   - Klik **Save Configuration**.

5. Klik tombol **Start Camera** di dashboard web Anda.

Secara ajaib, tampilan dari kamera iPhone Anda akan langsung muncul di layar web, dan AI Roboflow akan langsung mendeteksi helm, rompi, dan pekerja dari kamera iPhone secara *real-time*! 🚀📱

*(Jika Anda membaca pesan ini, balas "sudah baca" di chat supaya saya tahu Anda bisa melihatnya!)*
