# GDGOC CRUD Node.js

## 1. Deskripsi Singkat Program

Program ini adalah **REST API CRUD (Create, Read, Update, Delete)** sederhana untuk manajemen data user menggunakan **Node.js** dan **MongoDB** dengan integrasi **Google Gemini AI** untuk auto-generate bio user. API ini memungkinkan pengguna untuk melakukan operasi:
- Membuat user baru (dengan bio yang di-generate otomatis oleh AI)
- Melihat semua user
- Melihat detail user berdasarkan ID
- Mengupdate data user (bio akan di-regenerate jika name/age/address berubah)
- Menghapus user

**🌍 Fitur Baru:** Bio akan di-generate dalam bahasa resmi sesuai negara yang di-input pada field `address`.

---

## 2. Framework & Library yang Digunakan

### Dependencies:
| Library | Versi | Fungsi |
|---------|-------|--------|
| **Express.js** | v5.1.0 | Framework web untuk membuat REST API |
| **Mongoose** | v9.0.0 | ODM (Object Data Modeling) untuk MongoDB |
| **MongoDB** | v7.0.0 | Driver MongoDB native |
| **Body-parser** | v2.2.1 | Middleware untuk parsing request body |
| **Dotenv** | v17.2.3 | Mengelola environment variables |
| **@google/generative-ai** | v0.24.1 | SDK untuk integrasi Google Gemini AI |

### DevDependencies:
| Library | Versi | Fungsi |
|---------|-------|--------|
| **Nodemon** | v3.1.11 | Auto-restart server saat ada perubahan file |

---

## 3. Penjelasan `server.js`

File ini adalah **entry point** aplikasi yang mengatur server dan koneksi database.

```javascript
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import route from './routes/userRoutes.js';

// Inisialisasi Express
const app = express();

// Middleware untuk parsing JSON dari request body
app.use(bodyParser.json());

// Load environment variables dari file .env
dotenv.config();

// Ambil PORT dan MONGODB_URL dari environment variables
const PORT = process.env.PORT || 4000;
const MONGODB_URL = process.env.MONGODB_URL;

// Gunakan routes dengan prefix /api
app.use(`/api`, route);

// Koneksi ke MongoDB menggunakan Mongoose
mongoose
    .connect(MONGODB_URL)
    .then(() => {
        console.log('Connected to MongoDB');
        // Jalankan server setelah koneksi database berhasil
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => console.log(error));
```

**Penjelasan:**
- `express()` - Membuat instance aplikasi Express
- `bodyParser.json()` - Middleware untuk parsing JSON request body
- `dotenv.config()` - Load konfigurasi dari file `.env`
- `app.use('/api', route)` - Semua route akan diawali dengan `/api`
- `mongoose.connect()` - Koneksi ke MongoDB database
- `app.listen()` - Server berjalan di port yang ditentukan

---

## 4. Penjelasan `userModel.js`

File ini mendefinisikan **schema** dan **model** untuk data user di MongoDB.

```javascript
import mongoose from "mongoose";

// Definisi schema untuk User
const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    age: {type: Number, required: true},
    address: {type: String, required: true},
    bio: {type: String}
})

// Export model User berdasarkan schema
export default mongoose.model("User", userSchema);
```

**Penjelasan:**
| Field | Tipe | Keterangan |
|-------|------|------------|
| **name** | String | Wajib diisi (`required: true`) |
| **email** | String | Wajib diisi dan harus unik (`unique: true`) |
| **age** | Number | Wajib diisi |
| **address** | String | Wajib diisi, menentukan bahasa bio yang di-generate |
| **bio** | String | Opsional, di-generate otomatis oleh Gemini AI |

- `mongoose.Schema()` - Mendefinisikan struktur data user
- `mongoose.model("User", userSchema)` - Membuat model bernama "User" yang akan menjadi collection "users" di MongoDB
- `unique: true` - Memastikan tidak ada duplikasi email di database

---

## 5. Penjelasan `userController.js`

File ini berisi **business logic** untuk semua operasi CRUD dengan integrasi **Google Gemini AI**.

### **Inisialisasi Gemini AI**
```javascript
import User from "../model/userModel.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// Inisialisasi Gemini AI dengan API Key dari environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
```

**Penjelasan:**
- `GoogleGenerativeAI` - Class dari SDK Google untuk mengakses Gemini AI
- `process.env.GEMINI_API_KEY` - API Key disimpan di file `.env` untuk keamanan
- `gemini-2.5-pro` - Model Gemini yang digunakan (cepat dan efisien)

### **generateBio()** - Function untuk Generate Bio dengan AI (Multi-Bahasa)
```javascript
async function generateBio(name, age, address) {
    try {
        const prompt = `Buat SATU kalimat bio singkat dan lucu untuk ${name} (${age} tahun) yang tinggal di ${address}. Tulis bio dalam bahasa resmi negara ${address}. Langsung tulis bionya saja tanpa pilihan atau penjelasan. Maksimal 15 kata.`;
        
        const result = await model.generateContent(prompt);
        const response = result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Gemini Error:", error.message);
        return `${name} adalah pengguna berusia ${age} tahun dan tinggal di ${address}.`;
    }
}
```

**Penjelasan:**
- `prompt` - Instruksi yang dikirim ke Gemini AI untuk generate bio dalam bahasa sesuai negara
- `model.generateContent(prompt)` - Mengirim request ke Gemini AI
- `response.text().trim()` - Mengambil teks hasil dan menghapus spasi berlebih
- Jika error, akan mengembalikan bio default sebagai fallback

**Contoh Output Berdasarkan Negara:**
| Address | Bahasa | Contoh Bio |
|---------|--------|------------|
| Indonesia | Indonesia | "Budi, 20 tahun, hobinya rebahan sambil ngemil kerupuk." |
| Japan | Jepang | "田中、25歳、趣味はラーメンを食べながらアニメを見ること。" |
| Korea | Korea | "김, 22살, 취미는 치킨 먹으며 K-드라마 정주행하기." |
| France | Prancis | "Pierre, 30 ans, adore manger des croissants devant Netflix." |
| Germany | Jerman | "Hans, 28 Jahre alt, liebt Bier trinken und Fußball schauen." |
| Spain | Spanyol | "Carlos, 35 años, amante de la paella y el fútbol." |
| Italy | Italia | "Giovanni, 40 anni, appassionato di pasta e opera." |
| Netherlands | Belanda | "Jan, 50 jaar, houdt van fietsen en stroopwafels." |
| Portugal | Portgual | "João, 45 anos, fã de bacalhau e fado." |
| Russia | Rusia | "Ivan, 55 лет, любит борщ и хоккей." |
| Thailand | Thailand | "Somchai, 60 ปี, ชอบกินต้มยำและดูละครไทย." |
| Vietnam | Vietnam | "Nguyễn, 25 tuổi, thích ăn phở và nghe nhạc V-pop." |
| Malaysia | Malaysia | "Ahmad, 30 tahun, penggemar nasi lemak dan bola sepak." |
| United States | Inggris | "John, 28 years old, loves burgers and watching NFL." |
| United Kingdom | Inggris | "Oliver, 32 years old, enjoys fish and chips and rugby." |
| *dan negara lainnya* | *Bahasa resmi negara tersebut* |

### **createUser** - Membuat user baru dengan AI-generated bio
```javascript
export const createUser = async (req, res) => {
    try {
        const newUser = new User(req.body);
        const {email} = newUser;

        // Cek apakah email sudah terdaftar
        const userExist = await User.findOne({email});
        if (userExist) {
            return res.status(400).json({errorMessage: "User with this email already exists"});
        }

        // Generate bio menggunakan Gemini AI dengan parameter address
        const aiGeneratedBio = await generateBio(newUser.name, newUser.age, newUser.address);
        newUser.bio = aiGeneratedBio;

        // Simpan user baru ke database
        const saveData = await newUser.save();
        res.status(200).json(saveData);

    } catch (error) {
        res.status(500).json({errorMessage: error.message});
    }
}
```

### **getAllUsers** - Mengambil semua data user
```javascript
export const getAllUsers = async (req, res) => {
    try {
        const userData = await User.find(); //Ambil SEMUA dokumen dari collection users
        
        //Cek apakah data kosong
        if (!userData || userData.length === 0) {
            res.status(404).json({message: "Users data Not Found"});
        }

        return res.status(200).json(userData);

    } catch (error) {
        res.status(500).json({errorMessage: error.message});
    }
}
```

### **getUserById** - Mengambil user berdasarkan ID
```javascript
export const getUserById = async (req, res) => {
    try {
        const id = req.params.id; //Ambil ID dari URL parameter (/api/user/:id)
        const userExist = await User.findById(id); //Cari user berdasarkan _id di MongoDB

        if(!userExist) {
            return res.status(404).json({message: "User Not Found"});
        }

        res.status(200).json(userExist);

    } catch (error) {
        res.status(500).json({errorMessage: error.message});
    }
}
```

### **updateUser** - Update data user dengan regenerate bio
```javascript
export const updateUser = async (req, res) => {
    try {
        const id = req.params.id; //Ambil ID dari URL parameter (/api/user/:id)
        const userExist = await User.findById(id); //Cari user berdasarkan _id di MongoDB

        if(!userExist) {
            return res.status(404).json({message: "User Not Found"});
        }

        // Regenerate bio jika name, age, atau address berubah
        if (req.body.name || req.body.age || req.body.address) {
            const updatedName = req.body.name || userExist.name;
            const updatedAge = req.body.age || userExist.age;
            const updatedAddress = req.body.address || userExist.address;
            
            req.body.bio = await generateBio(updatedName, updatedAge, updatedAddress);
        }

        const updatedData = await User.findByIdAndUpdate(id, req.body, {new:true});
        res.status(200).json(updatedData);

    } catch (error) {
        res.status(500).json({errorMessage: error.message});
    }
}
```

### **deleteUser** - Hapus user
```javascript
export const deleteUser = async (req, res) => {
    try {
        const id = req.params.id; //Ambil ID dari URL parameter (/api/user/:id)
        const userExist = await User.findById(id); //Cari user berdasarkan _id di MongoDB

        if(!userExist) {
            return res.status(404).json({message: "User Not Found"});
        }

        await User.findByIdAndDelete(id); //Cari dan hapus user berdasarkan ID
        res.status(200).json({message: "User Deleted Successfully"});

    } catch (error) {
        res.status(500).json({errorMessage: error.message});
    }
}
```

**Penjelasan Umum:**
- `async/await` - Digunakan untuk operasi asynchronous ke database dan API
- `try/catch` - Error handling
- `req.body` - Data yang dikirim dari client
- `req.params.id` - ID dari URL parameter
- `User.findOne()`, `User.find()`, `User.findById()` - Query Mongoose
- `User.save()`, `User.findByIdAndUpdate()`, `User.findByIdAndDelete()` - Operasi database

---

## 6. Penjelasan `userRoutes.js`

File ini mendefinisikan **endpoint** dan menghubungkannya dengan controller.

```javascript
import express from 'express';
import { 
    createUser, 
    deleteUser, 
    getAllUsers, 
    getUserById, 
    updateUser 
} from '../controller/userController.js';

export const route = express.Router();

// POST - Membuat user baru
route.post(`/user`, createUser);

// GET - Mengambil semua user
route.get(`/users`, getAllUsers);

// GET - Mengambil user berdasarkan ID
route.get(`/user/:id`, getUserById);

// PUT - Update user berdasarkan ID
route.put(`/update/user/:id`, updateUser);

// DELETE - Hapus user berdasarkan ID
route.delete(`/delete/user/:id`, deleteUser);

export default route;
```

**Penjelasan:**
- `express.Router()` - Membuat router untuk mengelompokkan routes
- **POST** `/api/user` - Endpoint untuk create user
- **GET** `/api/users` - Endpoint untuk get all users
- **GET** `/api/user/:id` - Endpoint untuk get user by ID (`:id` adalah parameter dinamis)
- **PUT** `/api/update/user/:id` - Endpoint untuk update user
- **DELETE** `/api/delete/user/:id` - Endpoint untuk delete user

---

## 7. Cara Menjalankan

### Langkah 1: Install Dependencies
```bash
cd server
npm install
```

### Langkah 2: Buat File `.env`
```env
PORT=4000
MONGODB_URL=mongodb://localhost:27017/crud-nodejs
GEMINI_API_KEY=your_gemini_api_key_here
```

### Langkah 3: Dapatkan Gemini API Key
1. Buka: https://aistudio.google.com/app/apikey
2. Login dengan Google Account
3. Klik "Create API Key"
4. Copy API Key dan paste ke `.env`

### Langkah 4: Jalankan Server
```bash
npm run dev
```

---

## 8. API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/user` | Membuat user baru (bio auto-generated sesuai bahasa negara) |
| GET | `/api/users` | Mengambil semua user |
| GET | `/api/user/:id` | Mengambil user berdasarkan ID |
| PUT | `/api/update/user/:id` | Update user (bio regenerated jika name/age/address berubah) |
| DELETE | `/api/delete/user/:id` | Hapus user |

---

## 9. Contoh Request & Response

### Create User (Indonesia)
**Request:**
```http
POST http://localhost:4000/api/user
Content-Type: application/json

{
    "name": "Budi Santoso",
    "email": "budi@example.com",
    "age": 20,
    "address": "Indonesia"
}
```

**Response:**
```json
{
    "_id": "507f1f77bcf86cd799439011",
    "name": "Budi Santoso",
    "email": "budi@example.com",
    "age": 20,
    "address": "Indonesia",
    "bio": "Budi Santoso, 20 tahun, hobinya rebahan sambil scroll TikTok sampai lupa waktu."
}
```

### Create User (Japan)
**Request:**
```http
POST http://localhost:4000/api/user
Content-Type: application/json

{
    "name": "Tanaka",
    "email": "tanaka@example.com",
    "age": 25,
    "address": "Japan"
}
```

**Response:**
```json
{
    "_id": "507f1f77bcf86cd799439012",
    "name": "Tanaka",
    "email": "tanaka@example.com",
    "age": 25,
    "address": "Japan",
    "bio": "田中、25歳、趣味はラーメンを食べながらアニメを見ること。"
}
```

### Create User (Korea)
**Request:**
```http
POST http://localhost:4000/api/user
Content-Type: application/json

{
    "name": "Kim",
    "email": "kim@example.com",
    "age": 22,
    "address": "Korea"
}
```

**Response:**
```json
{
    "_id": "507f1f77bcf86cd799439013",
    "name": "Kim",
    "email": "kim@example.com",
    "age": 22,
    "address": "Korea",
    "bio": "김, 22살, 취미는 치킨 먹으며 K-드라마 정주행하기."
}
```

### Update User
**Request:**
```http
PUT http://localhost:4000/api/update/user/507f1f77bcf86cd799439011
Content-Type: application/json

{
    "age": 21
}
```

**Response:**
```json
{
    "_id": "507f1f77bcf86cd799439011",
    "name": "Budi Santoso",
    "email": "budi@example.com",
    "age": 21,
    "address": "Indonesia",
    "bio": "Budi Santoso, si 21 tahun yang masih bingung antara lanjut kuliah atau jadi sultan."
}
```

### Update User (Pindah Negara)
**Request:**
```http
PUT http://localhost:4000/api/update/user/507f1f77bcf86cd799439011
Content-Type: application/json

{
    "address": "France"
}
```

**Response:**
```json
{
    "_id": "507f1f77bcf86cd799439011",
    "name": "Budi Santoso",
    "email": "budi@example.com",
    "age": 21,
    "address": "France",
    "bio": "Budi Santoso, 21 ans, adore manger des croissants en regardant Netflix."
}
```

### Get All Users
**Request:**
```http
GET http://localhost:4000/api/users
```

**Response:**
```json
[
    {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Budi Santoso",
        "email": "budi@example.com",
        "age": 21,
        "address": "Indonesia",
        "bio": "Budi Santoso, 21 tahun, hobinya rebahan sambil nonton drakor."
    },
    {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Tanaka",
        "email": "tanaka@example.com",
        "age": 25,
        "address": "Japan",
        "bio": "田中、25歳、趣味はラーメンを食べながらアニメを見ること。"
    }
]
```

### Get User by ID
**Request:**
```http
GET http://localhost:4000/api/user/507f1f77bcf86cd799439011
```

**Response:**
```json
{
    "_id": "507f1f77bcf86cd799439011",
    "name": "Budi Santoso",
    "email": "budi@example.com",
    "age": 21,
    "address": "Indonesia",
    "bio": "Budi Santoso, 21 tahun, hobinya rebahan sambil nonton drakor."
}
```

### Delete User
**Request:**
```http
DELETE http://localhost:4000/api/delete/user/507f1f77bcf86cd799439011
```

**Response:**
```json
{
    "message": "User Deleted Successfully"
}
```

---

## 10. Struktur Folder

```
gdgoc-crud-nodejs/
└── server/
    ├── .env                    # Environment variables
    ├── package.json            # Dependencies
    ├── server.js               # Entry point
    ├── controller/
    │   └── userController.js   # Business logic + Gemini AI
    ├── model/
    │   └── userModel.js        # MongoDB Schema
    └── routes/
        └── userRoutes.js       # API Endpoints
```

---

## 11. Fitur Utama

✅ **CRUD Operations** - Create, Read, Update, Delete user  
✅ **AI-Generated Bio** - Bio otomatis di-generate oleh Gemini AI  
✅ **Multi-Language Bio** - Bio di-generate dalam bahasa sesuai negara (address)  
✅ **Auto-Regenerate Bio** - Bio di-update otomatis saat name/age/address berubah  
✅ **Email Validation** - Tidak boleh ada email duplikat  
✅ **Error Handling** - Penanganan error yang baik  
✅ **Fallback Bio** - Jika AI error, akan menggunakan bio default

---

## 12. Daftar Bahasa yang Didukung

| Negara (Address) | Bahasa Output |
|------------------|---------------|
| Indonesia | Bahasa Indonesia |
| Japan | 日本語 (Jepang) |
| Korea | 한국어 (Korea) |
| China | 中文 (Mandarin) |
| France | Français (Prancis) |
| Germany | Deutsch (Jerman) |
| Spain | Español (Spanyol) |
| Italy | Italiano (Italia) |
| Netherlands | Nederlands (Belanda) |
| Portugal | Português (Portugis) |
| Russia | Русский (Rusia) |
| Thailand | ไทย (Thailand) |
| Vietnam | Tiếng Việt (Vietnam) |
| Malaysia | Bahasa Melayu |
| United States | English (Inggris) |
| United Kingdom | English (Inggris) |
| *dan negara lainnya* | *Bahasa resmi negara tersebut* |

---

## 13. Author

**Wangsit Nursyahada**

---

## 14. License

ISC

