import User from "../model/userModel.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

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

export const createUser = async (req, res) => {
    try {
        const newUser = new User(req.body);
        const {email} = newUser;

        const userExist = await User.findOne({email});
        if (userExist) {
            return res.status(400).json({errorMessage: "User with this email already exists"});
        }

        const aiGeneratedBio = await generateBio(newUser.name, newUser.age, newUser.address);
        newUser.bio = aiGeneratedBio;

        const saveData = await newUser.save();
        res.status(200).json(saveData);

    } catch (error) {
        res.status(500).json({errorMessage: error.message});
    }
}

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

export const updateUser = async (req, res) => {
    try {
        const id = req.params.id;
        const userExist = await User.findById(id);

        if(!userExist) {
            return res.status(404).json({message: "User Not Found"});
        }

        if (req.body.name || req.body.age) {
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