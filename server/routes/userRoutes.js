import express from 'express';
import { createUser, deleteUser, getAllUsers, getUserById, updateUser } from '../controller/userController.js';

export const route = express.Router();

route.post(`/user`, createUser);
route.get(`/users`, getAllUsers);
route.get(`/user/:id`, getUserById);
route.put(`/update/user/:id`, updateUser);
route.delete(`/delete/user/:id`, deleteUser);

export default route;