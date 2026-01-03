import express from 'express'
import { upload } from '../configs/multer.js'
import { protect } from '../middlewares/auth.js'
import { addPost, getFeedPost, likePost, deletePost, updatePost, addComment, deleteComment, sharePost } from '../conntrollers/postController.js'

const postRouter = express.Router()

postRouter.post('/add', upload.array('images', 4), protect, addPost)
postRouter.get('/feed', protect, getFeedPost)
postRouter.post('/like', protect, likePost)
postRouter.delete('/:id', protect, deletePost)
postRouter.put('/:id', protect, updatePost)
postRouter.post('/:id/comment', protect, addComment)
postRouter.delete('/:postId/comment/:commentId', protect, deleteComment)
postRouter.post('/share', protect, sharePost)

export default postRouter