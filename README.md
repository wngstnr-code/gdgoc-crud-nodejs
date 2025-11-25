# GDGOC CRUD Node.js

## 1. Deskripsi Singkat Program

Program ini adalah **REST API CRUD (Create, Read, Update, Delete)** sederhana untuk manajemen data user menggunakan **Node.js** dan **MongoDB** dengan integrasi **Google Gemini AI** untuk auto-generate bio user. API ini memungkinkan pengguna untuk melakukan operasi:
- Membuat user baru (dengan bio yang di-generate otomatis oleh AI)
- Melihat semua user
- Melihat detail user berdasarkan ID
- Mengupdate data user (bio akan di-regenerate jika name/age berubah)
- Menghapus user

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

### **generateBio()** - Function untuk Generate Bio dengan AI
```javascript
async function generateBio(name, age) {
    try {
        const prompt = `Buat SATU kalimat bio singkat dan lucu untuk ${name} (${age} tahun). Langsung tulis bionya saja tanpa pilihan atau penjelasan. Maksimal 15 kata.`;
        
        const result = await model.generateContent(prompt);
        const response = result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Gemini Error:", error.message);
        return `${name} adalah pengguna berusia ${age} tahun.`;
    }
}
```

**Penjelasan:**
- `prompt` - Instruksi yang dikirim ke Gemini AI untuk generate bio
- `model.generateContent(prompt)` - Mengirim request ke Gemini AI
- `response.text().trim()` - Mengambil teks hasil dan menghapus spasi berlebih
- Jika error, akan mengembalikan bio default sebagai fallback

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

        // Generate bio menggunakan Gemini AI
        const aiGeneratedBio = await generateBio(newUser.name, newUser.age);
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
        const userData = await User.find();
        
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
        const id = req.params.id;
        const userExist = await User.findById(id);

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
        const id = req.params.id;
        const userExist = await User.findById(id);

        if(!userExist) {
            return res.status(404).json({message: "User Not Found"});
        }

        // Regenerate bio jika name atau age berubah
        if (req.body.name || req.body.age) {
            const updatedName = req.body.name || userExist.name;
            const updatedAge = req.body.age || userExist.age;
            
            req.body.bio = await generateBio(updatedName, updatedAge);
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
        const id = req.params.id;
        const userExist = await User.findById(id);

        if(!userExist) {
            return res.status(404).json({message: "User Not Found"});
        }

        await User.findByIdAndDelete(id);
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
| POST | `/api/user` | Membuat user baru (bio auto-generated) |
| GET | `/api/users` | Mengambil semua user |
| GET | `/api/user/:id` | Mengambil user berdasarkan ID |
| PUT | `/api/update/user/:id` | Update user (bio regenerated jika name/age berubah) |
| DELETE | `/api/delete/user/:id` | Hapus user |

---

## 9. Contoh Request & Response

### Create User
**Request:**
```http
POST http://localhost:4000/api/user
Content-Type: application/json

{
    "name": "Budi Santoso",
    "email": "budi@example.com",
    "age": 20
}
```

**Response:**
```json
{
    "_id": "507f1f77bcf86cd799439011",
    "name": "Budi Santoso",
    "email": "budi@example.com",
    "age": 20,
    "bio": "Budi Santoso, 20 tahun, hobinya rebahan sambil scroll TikTok sampai lupa waktu."
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
    "bio": "Budi Santoso, si 21 tahun yang masih bingung antara lanjut kuliah atau jadi sultan."
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
✅ **Auto-Regenerate Bio** - Bio di-update otomatis saat name/age berubah  
✅ **Email Validation** - Tidak boleh ada email duplikat  
✅ **Error Handling** - Penanganan error yang baik  
✅ **Fallback Bio** - Jika AI error, akan menggunakan bio default

---

## 12. Author

**Wangsit Nursyahada**

---

## 13. License

ISC

