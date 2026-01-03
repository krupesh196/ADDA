import fs from 'fs'
import imagekit from '../configs/imageKit.js'
import Post from '../models/Post.js'
import User from '../models/User.js'
import Message from "../models/Message.js";

//Add Post
export const addPost = async (req, res) => {
    try {
        const { userId } = req.auth()
        const { content, post_type } = req.body
        const images = req.files

        let image_urls = []

        if (images.length) {
            image_urls = await Promise.all(
                images.map(async (image) => {
                    const fileBuffer = fs.readFileSync(image.path)
                    const response = await imagekit.upload({
                        file: fileBuffer,
                        fileName: image.originalname,
                        folder: 'posts',
                    })

                    const url = imagekit.url({
                        path: response.filePath,
                        transformation: [
                            { quality: 'auto' },
                            { format: 'webp' },
                            { width: '1280' },
                        ]
                    })
                    return url
                })
            )
        }

        await Post.create({
            user: userId,
            content,
            image_urls,
            post_type
        })
        res.json({ success: true, message: 'Post created successfully' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Get Post
export const getFeedPost = async (req, res) => {
    try {
        const { userId } = req.auth()
        const user = await User.findById(userId)

        const userIds = [userId, ...user.connections, ...user.following]

        const posts = await Post.find({ user: { $in: userIds } })
            .populate('user')
            .populate({
                path: 'comments.user',
                select: 'username full_name profile_picture'
            })
            .sort({ createdAt: -1 })

        res.json({ success: true, posts })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Like Post
export const likePost = async (req, res) => {
    try {
        const { userId } = req.auth()
        const { postId } = req.body

        const post = await Post.findById(postId)

        if (!post) {
            return res.json({ success: false, message: 'Post not found' })
        }

        if (post.likes_count.some(id => id.toString() === userId)) {
            post.likes_count = post.likes_count.filter(id => id.toString() !== userId)
            await post.save()
            res.json({ success: true, message: 'Post unliked' })
        } else {
            post.likes_count.push(userId)
            await post.save()
            res.json({ success: true, message: 'Post liked' })
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

/* Delete Post */
export const deletePost = async (req, res) => {
    try {
        const { userId } = req.auth()
        const { id } = req.params

        const post = await Post.findById(id)

        if (!post) {
            return res.json({ success: false, message: 'Post not found' })
        }

        // Check if the user deleting is the owner
        if (post.user.toString() !== userId) {
            return res.json({ success: false, message: 'Unauthorized Action' })
        }

        await Post.findByIdAndDelete(id)

        res.json({ success: true, message: 'Post deleted successfully' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

/* Edit Post */
export const updatePost = async (req, res) => {
    try {
        const { userId } = req.auth()
        const { id } = req.params
        const { content } = req.body

        const post = await Post.findById(id)

        if (!post) {
            return res.json({ success: false, message: 'Post not found' })
        }

        // Check ownership
        if (post.user.toString() !== userId) {
            return res.json({ success: false, message: 'Unauthorized Action' })
        }

        const updatedPost = await Post.findByIdAndUpdate(
            id,
            { content },
            { new: true }
        ).populate('user')

        res.json({ success: true, post: updatedPost, message: 'Post updated successfully' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

/* Add Comment */
export const addComment = async (req, res) => {
    try {
        const { id } = req.params
        const { text } = req.body
        const { userId } = req.auth()

        const post = await Post.findById(id)

        if (!post) {
            return res.json({ success: false, message: 'Post not found' })
        }

        const newComment = {
            user: userId,
            text: text,
            createdAt: new Date()
        }

        post.comments.push(newComment)
        await post.save()

        const updatedPost = await Post.findById(id).populate({
            path: 'comments.user',
            select: 'username full_name profile_picture'
        })

        res.json({ success: true, comments: updatedPost.comments, message: 'Comment added' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

/* Delete Comment */
export const deleteComment = async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const { userId } = req.auth();

        const post = await Post.findById(postId);
        if (!post) return res.json({ success: false, message: "Post not found" });

        const comment = post.comments.find((c) => c._id.toString() === commentId);
        if (!comment) return res.json({ success: false, message: "Comment not found" });

        const commentOwnerId = comment.user._id ? comment.user._id.toString() : comment.user.toString();
        const postOwnerId = post.user.toString();

        if (commentOwnerId !== userId && postOwnerId !== userId) {
            return res.json({ success: false, message: "Not authorized to delete this comment" });
        }

        post.comments = post.comments.filter((c) => c._id.toString() !== commentId);
        await post.save();

        res.json({ success: true, message: "Comment deleted" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

/* Share Post */
export const sharePost = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { postId, recipientId } = req.body;

        if (!recipientId || !postId) {
            return res.json({ success: false, message: "Missing data" });
        }

        const newMessage = await Message.create({
            sender: userId,
            recipient: recipientId,
            post: postId,
            message_type: 'post'
        });

        res.json({ success: true, message: "Post shared successfully" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}