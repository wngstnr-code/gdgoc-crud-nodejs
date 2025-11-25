# GDGOC CRUD Node.js

## 1. Deskripsi Singkat Program

Program ini adalah **REST API CRUD (Create, Read, Update, Delete)** sederhana untuk manajemen data user menggunakan **Node.js** dan **MongoDB**. API ini memungkinkan pengguna untuk melakukan operasi:
- Membuat user baru
- Melihat semua user
- Melihat detail user berdasarkan ID
- Mengupdate data user
- Menghapus user

---

## 2. Framework & Library yang Digunakan

### Dependencies:
- **Express.js (v5.1.0)** - Framework web untuk membuat REST API
- **Mongoose (v9.0.0)** - ODM (Object Data Modeling) untuk MongoDB
- **MongoDB (v7.0.0)** - Driver MongoDB native
- **Body-parser (v2.2.1)** - Middleware untuk parsing request body
- **Dotenv (v17.2.3)** - Mengelola environment variables

### DevDependencies:
- **Nodemon (v3.1.11)** - Auto-restart server saat ada perubahan file

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
    age: {type: Number, required: true}
})

// Export model User berdasarkan schema
export default mongoose.model("User", userSchema);
```

**Penjelasan:**
- `mongoose.Schema()` - Mendefinisikan struktur data user
- **name** - String, wajib diisi (`required: true`)
- **email** - String, wajib diisi, dan harus unik (`unique: true`)
- **age** - Number, wajib diisi
- `mongoose.model("User", userSchema)` - Membuat model bernama "User" yang akan menjadi collection "users" di MongoDB
- `unique: true` - Memastikan tidak ada duplikasi email di database

---

## 5. Penjelasan `userController.js`

File ini berisi **business logic** untuk semua operasi CRUD.

### **createUser** - Membuat user baru
```javascript
export const createUser = async (req, res) => {
    try {
        const newUser = new User(req.body); // Ambil data dari request body
        const {email} = newUser;

        // Cek apakah email sudah terdaftar
        const userExist = await User.findOne({email});
        if (userExist) {
            return res.status(400).json({errorMessage: "User with this email already exists"});
        }

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
        const userData = await User.find(); // Ambil semua user dari database
        
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
        const id = req.params.id; // Ambil ID dari URL parameter
        const userExist = await User.findById(id); // Cari user berdasarkan ID

        if(!userExist) {
            return res.status(404).json({message: "User Not Found"});
        }

        res.status(200).json(userExist);

    } catch (error) {
        res.status(500).json({errorMessage: error.message});
    }
}
```

### **updateUser** - Update data user
```javascript
export const updateUser = async (req, res) => {
    try {
        const id = req.params.id;
        const userExist = await User.findById(id);

        if(!userExist) {
            return res.status(404).json({message: "User Not Found"});
        }

        // Update dan return data terbaru dengan {new: true}
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

        await User.findByIdAndDelete(id); // Hapus user dari database
        res.status(200).json({message: "User Deleted Successfully"});

    } catch (error) {
        res.status(500).json({errorMessage: error.message});
    }
}
```

**Penjelasan:**
- `async/await` - Digunakan untuk operasi asynchronous ke database
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

