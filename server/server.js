import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import route from './routes/userRoutes.js';

const app = express();
app.use(bodyParser.json());
dotenv.config();

const PORT = process.env.PORT || 4000;
const MONGODB_URL = process.env.MONGODB_URL;

app.get('/', (req, res) => {
    res.json({ 
        status: 'OK',
        message: 'API is running!',
        version: '1.0.0',
        port: PORT,
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        endpoints: {
            createUser: 'POST /api/user',
            getAllUsers: 'GET /api/users',
            getUserById: 'GET /api/user/:id',
            updateUser: 'PUT /api/update/user/:id',
            deleteUser: 'DELETE /api/delete/user/:id'
        }
    });
});

app.use(`/api`, route);

mongoose
    .connect(MONGODB_URL)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on http://0.0.0.0:${PORT}`);
        });
    })
    .catch((error) => console.log(error));