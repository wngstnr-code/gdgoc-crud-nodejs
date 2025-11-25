import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {
        type: String, 
        required: true, 
        unique: true,
        validate: {
            validator: function(v) {
                return v.endsWith('@gmail.com');
            },
            message: 'Email harus menggunakan @gmail.com'
        }
    },
    age: {type: Number, required: true},
    bio: {type: String}
})

export default mongoose.model("User", userSchema);