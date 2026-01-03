import mongoose, { connections } from "mongoose";

const UserSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    full_name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        unique: true
    },
    bio: {
        type: String,
        default: 'Hey there! I am using ADDA'
    },
    profile_picture: {
        type: String,
        default: ''
    },
    cover_photo: {
        type: String,
        default: ''
    },
    location: {
        type: String,
        default: ''
    },
    followers: [{
        type: String,
        ref: 'User'
    }],
    following: [{
        type: String,
        ref: 'User'
    }],
    connections: [{
        type: String,
        ref: 'User'
    }],
    liked_posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
}, { timestamps: true, minimize: false })

const User = mongoose.model('User', UserSchema)

export default User