import { BadgeCheck, Heart, MessageCircle, ChevronLeft, ChevronRight, Send } from 'lucide-react'
import moment from 'moment'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'
import {
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText
} from "@mui/material"
import {
    MoreVert,
    Edit,
    Delete
} from "@mui/icons-material"
import ShareModal from './ShareModal'

const PostCard = ({ post, onDelete }) => {

    const getLikeIds = (list) => {
        if (!Array.isArray(list)) return [];
        return list.map(item => (typeof item === 'object' && item._id) ? item._id : item);
    };

    const location = useLocation()
    const navigate = useNavigate()

    const { getToken } = useAuth()
    const currentUser = useSelector((state) => state.user.value)

    const [likes, setLikes] = useState(post.likes_count)

    useEffect(() => {
        setLikes(post.likes_count || [])
    }, [post.likes_count])

    const [comments, setComments] = useState(post.comments || [])
    const [showComments, setShowComments] = useState(false)
    const [commentText, setCommentText] = useState("")
    const [isSubmittingComment, setIsSubmittingComment] = useState(false)

    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    const [content, setContent] = useState(post.content)
    const [isDeleted, setIsDeleted] = useState(false)

    const [isShareModalOpen, setIsShareModalOpen] = useState(false)

    const [anchorEl, setAnchorEl] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState(post.content)

    const open = Boolean(anchorEl)
    const isOwnPost = currentUser && post.user._id === currentUser._id
    const isProfilePage = location.pathname.includes('/profile')
    const showMenu = isOwnPost && isProfilePage

    const postWithHashtags = (text) => text.replace(/(#\w+)/g, '<span class="text-indigo-600">$1</span>')

    if (isDeleted) return null;

    const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const handleCommentSubmit = async () => {
        if (!commentText.trim()) return;
        setIsSubmittingComment(true);
        try {
            const token = await getToken();
            const { data } = await api.post(`/api/post/${post._id}/comment`,
                { text: commentText },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                setComments(data.comments);
                setCommentText("");
                toast.success("Comment added");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsSubmittingComment(false);
        }
    }

    const handleDeleteComment = async (commentId) => {
        try {
            const token = await getToken();
            const { data } = await api.delete(`/api/post/${post._id}/comment/${commentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                setComments((prev) => prev.filter((c) => c._id !== commentId));
                toast.success("Comment deleted");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleLike = async () => {
        try {
            const token = await getToken();
            const { data } = await api.post(`/api/post/like`, { postId: post._id },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            if (data.success) {
                toast.success(data.message)
                setLikes(prev => prev.includes(currentUser._id)
                    ? prev.filter(id => id !== currentUser._id)
                    : [...prev, currentUser._id]
                )
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const handleDelete = async () => {
        try {
            const token = await getToken();
            const { data } = await api.delete(`/api/post/${post._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                toast.success("Post deleted");
                if (onDelete) {
                    onDelete(post._id);
                } else {
                    setIsDeleted(true);
                }
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Could not delete post");
        }
        handleMenuClose();
    };

    const handleUpdate = async () => {
        try {
            const token = await getToken();
            const { data } = await api.put(`/api/post/${post._id}`,
                { content: editContent },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                toast.success("Post updated");
                setContent(editContent);
                setIsEditing(false);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Could not update post");
        }
    };

    const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % post.image_urls.length)
    const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + post.image_urls.length) % post.image_urls.length)

    return (
        <div className='bg-white rounded-xl shadow p-4 space-y-4 w-full max-w-2xl'>

            {/* Header */}
            <div className='flex justify-between items-start'>
                <div
                    onClick={() => navigate('/profile/' + post.user._id)}
                    className='inline-flex items-center gap-3 cursor-pointer'
                >
                    <img
                        src={post.user.profile_picture}
                        alt=""
                        className='w-10 h-10 rounded-full shadow object-cover'
                    />
                    <div>
                        <div className='flex items-center space-x-1'>
                            <span>{post.user.full_name}</span>
                            <BadgeCheck className='w-4 h-4 text-blue-500' />
                        </div>
                        <div className='text-gray-500 text-sm'>
                            @{post.user.username} • {moment(post.createdAt).fromNow()}
                        </div>
                    </div>
                </div>

                {/* Three Dot Menu */}
                {showMenu && (
                    <div>
                        <IconButton
                            onClick={handleMenuClick}
                            size="small"
                            aria-controls={open ? 'post-menu' : undefined}
                            aria-haspopup="true"
                            aria-expanded={open ? 'true' : undefined}
                        >
                            <MoreVert />
                        </IconButton>
                        <Menu
                            id="post-menu"
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleMenuClose}
                            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            PaperProps={{
                                elevation: 3,
                                sx: {
                                    mt: 1,
                                    minWidth: '120px',
                                }
                            }}
                        >
                            <MenuItem
                                onClick={() => {
                                    setIsEditing(true);
                                    handleMenuClose();
                                }}
                            >
                                <ListItemIcon>
                                    <Edit fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>Edit</ListItemText>
                            </MenuItem>

                            <MenuItem
                                onClick={handleDelete}
                                sx={{ color: "error.main" }}
                            >
                                <ListItemIcon>
                                    <Delete fontSize="small" color="error" />
                                </ListItemIcon>
                                <ListItemText>Delete</ListItemText>
                            </MenuItem>
                        </Menu>
                    </div>
                )}
            </div>

            {/* Content */}
            {isEditing ? (
                <div className="space-y-2">
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className='w-full p-3 border border-gray-200 rounded-lg'
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className='px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer'
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdate}
                            className='px-4 py-2 bg-gradient-to-r from-indigo-500 to bg-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition cursor-pointer'
                        >
                            Save
                        </button>
                    </div>
                </div>
            ) : (
                content && (
                    <div
                        className='text-gray-800 text-sm whitespace-pre-line'
                        dangerouslySetInnerHTML={{ __html: postWithHashtags(content) }}
                    />
                )
            )}

            {/* Images */}

            {post.image_urls && post.image_urls.length > 0 && (
                <div className='relative group'>
                    <div className='w-3/4 h-auto rounded-lg mx-auto'>
                        <img
                            src={post.image_urls[currentImageIndex]}
                            className='w-full h-101 object-contain rounded-lg'
                            alt=""
                        />
                    </div>
                    {post.image_urls.length > 1 && (
                        <>
                            <button
                                onClick={prevImage}
                                className='absolute left-2 top-1/2 transform -translate-y-1/2 bg-transparent bg-opacity-80 text-black p-2 rounded-full hover:bg-opacity-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10'
                            >
                                <ChevronLeft className='w-5 h-5' />
                            </button>
                            <button
                                onClick={nextImage}
                                className='absolute right-2 top-1/2 transform -translate-y-1/2 bg-transparent bg-opacity-80 text-black p-2 rounded-full hover:bg-opacity-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10'
                            >
                                <ChevronRight className='w-5 h-5' />
                            </button>
                            <div className='absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1'>
                                {post.image_urls.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`w-2 h-2 rounded-full ${index === currentImageIndex ? 'bg-white' : 'bg-gray-500'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className='flex items-center gap-6 text-gray-500 text-sm pt-2 border-t border-gray-100'>
                <div className='flex items-center gap-1.5 cursor-pointer group' onClick={handleLike}>
                    <Heart className={`w-5 h-5 transition-colors ${likes.includes(currentUser._id) ? 'text-red-500 fill-red-500' : 'group-hover:text-red-500'}`} />
                    <span>{likes.length}</span>
                </div>
                <div
                    className='flex items-center gap-1.5 cursor-pointer hover:text-indigo-600 transition-colors'
                    onClick={() => setShowComments(!showComments)}
                >
                    <MessageCircle className='w-5 h-5' />
                    <span>{comments.length}</span>
                </div>
                <div
                    onClick={() => setIsShareModalOpen(true)}
                    className='flex items-center gap-1.5 cursor-pointer hover:text-indigo-600 transition-colors'
                >
                    <Send className='w-5 h-5' />
                </div>
            </div>

            {showComments && (
                <div className="pt-2 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">

                    {/* Comment Input */}
                    <div className="flex gap-2 items-center mb-4">
                        <img src={currentUser.profile_picture} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Write a comment..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
                                className="w-full bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 pr-10"
                            />
                            <button
                                onClick={handleCommentSubmit}
                                disabled={!commentText.trim() || isSubmittingComment}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                        {comments.length > 0 ? (
                            comments.map((comment, index) => (
                                <div key={index} className="flex gap-2 items-start group">
                                    <img
                                        src={comment.user?.profile_picture}
                                        alt=""
                                        className="w-8 h-8 rounded-full object-cover cursor-pointer"
                                        onClick={() => navigate('/profile/' + comment.user?._id)}
                                    />
                                    <div className="flex-1">
                                        <div className="bg-gray-100 rounded-2xl px-3 py-2 relative">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="font-bold text-xs cursor-pointer hover:underline text-gray-900"
                                                        onClick={() => navigate('/profile/' + comment.user?._id)}
                                                    >
                                                        @{comment.user?.username}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500">{moment(comment.createdAt).fromNow()}</span>
                                                </div>
                                                {(currentUser._id === (comment.user?._id || comment.user) || currentUser._id === post.user._id) && (
                                                    <button
                                                        onClick={() => handleDeleteComment(comment._id)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Delete comment"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-800 mt-0.5">{comment.text}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-sm text-gray-400 py-2">No comments yet.</p>
                        )}
                    </div>
                </div>
            )}

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                post={post}
            />

        </div>
    )
}

export default PostCard