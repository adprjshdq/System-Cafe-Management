# Aroma Cafe Management System (Aroma POS)
> **Sistem Manajemen Kafe Modern Terintegrasi (POS, Kitchen Display, & Analytics)**  
> Dibuat untuk Portofolio Profesional & Tugas Besar / Skripsi Kuliah.

---

## 🌟 Fitur Utama (Level Menengah / Intermediate)

1. **Autentikasi & Otorisasi Multi-Peran (RBAC - Role-Based Access Control):**
   - **Admin / Manager:** Akses analitik omzet, kelola menu & HPP, kelola denah meja, dan riwayat pesanan.
   - **Kasir (Cashier):** Akses antarmuka Point of Sale (POS), pemilihan meja, transaksi tunai/non-tunai, dan cetak struk kasir.
   - **Dapur / Barista (Kitchen Display System - KDS):** Layar antrean real-time (Pending ➔ Cooking ➔ Ready).
   - **Pelayan (Waiter):** Cek ketersediaan meja kosong dan input pesanan walk-in.

2. **Point of Sale (POS) Kasir Interaktif:**
   - Filter menu instan berdasarkan kategori & search bar.
   - Pilihan tipe pesanan: *Dine-In* (Makan di Tempat) atau *Takeaway* (Bungkus).
   - Pemilihan nomor meja terintegrasi status meja (*Available*, *Occupied*, *Reserved*).
   - Keranjang pesanan dinamis (*quantity +/-*, subtotal otomatis, catatan pesanan menu cth: *"Less Sugar"*, *"Extra Hot"*).
   - Kalkulasi otomatis PPN/PB1 Restoran 10%.
   - Dialog pembayaran multi-metode (Tunai dengan kalkulasi uang kembali, QRIS mockup, Transfer Bank).
   - Pratinjau dan pencetakan struk pembayaran (Thermal receipt print layout).

3. **Kitchen Display System (KDS):**
   - Kanban board pesanan dapur (*Pesanan Masuk* ➔ *Sedang Dimasak* ➔ *Siap Disajikan*).
   - Tombol peralihan status sekali klik untuk efisiensi koki & barista.

4. **Katalog & Kelola Menu:**
   - Input harga jual dan harga pokok penjualan (HPP) untuk kalkulasi margin keuntungan.
   - Switch status ketersediaan menu (*Tersedia* / *Habis*).

5. **Manajemen Meja & Denah:**
   - Visualisasi kartu meja berbasis warna (*Hijau: Tersedia*, *Merah: Terisi*, *Kuning: Reservasi*).
   - Kapasitas kursi dan update status cepat.

6. **Dashboard Analitik Penjualan:**
   - Metrik KPI: Omzet hari ini, omzet bulanan, jumlah transaksi, dan utilisasi meja.
   - Top 5 Menu Terlaris (*Best-Seller*).

---

## 🛠️ Tech Stack & Arsitektur

- **Backend:** PHP 8.4+ / Laravel 11/12 (RESTful API, Sanctum Authentication, DB Transactions, Eloquent ORM).
- **Frontend:** React 19 + Vite 8 + Tailwind CSS + Lucide Icons + Axios + React Router 7.
- **Database:** MySQL / MariaDB (Relational ERD dengan Foreign Key cascades).

---

## 🚀 Panduan Menjalankan Sistem

### 1. Prasyarat:
Pastikan MySQL (di Laragon, XAMPP, atau service lokal) aktif pada port `3306`.
Buat database bernama `cafe_management`:
```sql
CREATE DATABASE cafe_management;
```

### 2. Menjalankan Backend (Laravel API):
Masuk ke direktori `backend`:
```bash
cd backend
php artisan migrate --seed
php artisan serve
```
> Server backend akan berjalan di: `http://localhost:8000`

### 3. Menjalankan Frontend (React SPA):
Buka terminal baru, masuk ke direktori `frontend`:
```bash
cd frontend
npm run dev
```
> Aplikasi frontend akan terbuka di: `http://localhost:5173`

---

## 🔐 Kredensial Akun Bawaan (Database Seeder)

Semua akun menggunakan kata sandi default: `password123`

| Peran (Role) | Email | Akses Halaman |
|---|---|---|
| **Admin / Owner** | `admin@cafe.com` | Seluruh Modul & Dashboard |
| **Kasir (Cashier)** | `kasir@cafe.com` | POS Kasir, Meja & Riwayat |
| **Dapur (Kitchen)** | `dapur@cafe.com` | Kitchen Display System (KDS) |
| **Pelayan (Waiter)** | `pelayan@cafe.com` | POS Kasir & Ketersediaan Meja |

*(Tersedia tombol preset 1-klik di halaman login untuk kemudahan demo sidang dosen atau review portofolio).*

---

## 📡 Daftar Endpoint API Utama (`/api/v1`)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Login user & dapatkan token Sanctum |
| `GET` | `/api/v1/dashboard/stats` | Statistik omzet & menu terlaris |
| `GET` | `/api/v1/menus` | List katalog menu (dengan filter kategori & pencarian) |
| `POST` | `/api/v1/menus` | Tambah menu baru (HPP & harga jual) |
| `GET` | `/api/v1/tables` | List meja & status keterisian |
| `POST` | `/api/v1/orders` | Checkout transaksi POS & kalkulasi total |
| `PATCH`| `/api/v1/orders/{id}/status`| Update status antrean pesanan |
| `POST` | `/api/v1/orders/{id}/pay` | Pemrosesan pembayaran & pelunasan |
| `GET` | `/api/v1/orders/{id}/receipt`| Ambil data cetak struk kasir |
