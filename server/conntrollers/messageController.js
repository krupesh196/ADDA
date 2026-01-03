import fs from 'fs'
import imagekit from '../configs/imageKit.js'
import Message from '../models/Message.js'

// Create an empty object to store SS event connections
const connections = {}

// Controller function for the SSE endpoint    const { userId } = req.params
export const sseController = (req, res) => {

    const { userId } = req.params

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')

    if (!userId) {
        res.write('error: No User ID provided\n\n');
        res.end();
        return;
    }

    // Add the client's response object to the connections object
    connections[userId] = res

    // Send an initial event to the client
    res.write('log: Connected to SSE stream\n\n')

    // Handle client disconnection
    req.on('close', () => {
        // Remove the client's response object from the connections array
        delete connections[userId]

    })
}

// Send Message
export const sendMessage = async (req, res) => {
    try {
        const { userId } = req.auth()
        const { to_user_id, text } = req.body
        const image = req.file

        let media_url = ''
        let message_type = image ? 'image' : 'text'

        if (message_type === 'image') {
            const fileBuffer = fs.readFileSync(image.path)
            const response = await imagekit.upload({
                file: fileBuffer,
                fileName: image.originalname,
            })
            media_url = imagekit.url({
                path: response.filePath,
                transformation: [
                    { quality: 'auto' },
                    { format: 'webp' },
                    { width: '1280' },
                ]
            })
        }

        const message = await Message.create({
            from_user_id: userId,
            to_user_id,
            text,
            message_type,
            media_url
        })

        res.json({ success: true, message })

        //Send message to to_user_id using SSE
        const messageWithUserData = await Message.findById(message._id).populate('from_user_id')

        if (connections[to_user_id]) {
            connections[to_user_id].write(`data: ${JSON.stringify(messageWithUserData)}\n\n`)
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Get Chat Messages
export const getChatMessages = async (req, res) => {
    try {
        const { userId } = req.auth()
        const { to_user_id } = req.body

        const messages = await Message.find({
            $or: [
                { from_user_id: userId, to_user_id },
                { from_user_id: to_user_id, to_user_id: userId },
            ],
            deletedBy: { $ne: userId }
        }).sort({ createdAt: -1 })

        // mark messages as seen
        await Message.updateMany({ from_user_id: to_user_id, to_user_id: userId }, { isRead: true })

        res.json({ success: true, messages })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export const getUserRecentMessages = async (req, res) => {
    try {
        const { userId } = req.auth()
        const messages = await Message.find({
            $or: [
                { to_user_id: userId },
                { from_user_id: userId }
            ]
        })
            .populate('from_user_id to_user_id')
            .sort({ createdAt: -1 })

        res.json({ success: true, messages })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.auth()

        await Message.findByIdAndUpdate(id, {
            $addToSet: { deletedBy: userId }
        });

        res.json({ success: true, message: 'Message deleted for you' })

    } catch (error) {
        console.log(error)
        resjson({ success: false, message: error.message })
    }
}

export const deleteConversation = async (req, res) => {
    try {
        const { userId } = req.auth()
        const { userId: otherId } = req.params
        await Message.deleteMany({
            $or: [
                { from_user_id: userId, to_user_id: otherId },
                { from_user_id: otherId, to_user_id: userId }
            ]
        })
        res.json({ success: true, message: 'Conversation deleted' })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}