import User from "../model/userModel.js";

export const createUser = async (req, res) => {
    try {
        const newUser = new User(req.body);
        const {email} = newUser;

        const userExist = await User.findOne({email});
        if (userExist) {
            return res.status(400).json({errorMessage: "User with this email already exists"});
        }

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