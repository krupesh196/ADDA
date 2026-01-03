import express from 'express'
import { deleteMessage, getChatMessages, sendMessage, sseController, deleteConversation } from '../conntrollers/messageController.js'
import { upload } from '../configs/multer.js'
import { protect } from '../middlewares/auth.js'

const messageRouter = express.Router()

messageRouter.get('/:userId', sseController)
messageRouter.post('/send', upload.single('image'), protect, sendMessage)
messageRouter.post('/get', protect, getChatMessages)
messageRouter.delete('/:id', protect, deleteMessage)
messageRouter.delete('/conversation/:userId', protect, deleteConversation)

export default messageRouter