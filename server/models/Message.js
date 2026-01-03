import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    from_user_id: {
        type: String,
        ref: 'User',
        required: true
    },
    to_user_id: {
        type: String,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        trim: true
    },
    message_type: {
        type: String,
        enum: ['text', 'image', 'post'],
        default: 'text'
    },
    media_url: {
        type: String
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
    },
    isRead: {
        type: Boolean,
        default: false
    },
    deletedBy: [{ type: String }],
}, { timestamps: true })

const Message = mongoose.model('Message', messageSchema)

export default Message