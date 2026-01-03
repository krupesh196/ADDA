import React, { useEffect, useRef, useState } from 'react'
import { dummyMessagesData, dummyUserData } from '../assets/assets'
import { Delete, ImageIcon, SendHorizontal } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios'
import { addMessage, fetchMessages, resetMessages } from '../features/messages/messagesSlice'
import toast from 'react-hot-toast'
import { Trash2, X } from 'lucide-react'
import { Checkbox, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material"
import { MoreVert, Checklist } from "@mui/icons-material"
import { deleteMessagesFromState } from '../features/messages/messagesSlice'

const ChatBox = () => {

    const { messages } = useSelector((state) => state.messages)
    const { userId } = useParams()
    const { getToken } = useAuth()
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const [text, setText] = useState('')
    const [image, setImage] = useState(null)
    const [user, setUser] = useState(null)
    const messagesEndRef = useRef(null)

    const [isSelectionMode, setIsSelectionMode] = useState(false)
    const [selectedIds, setSelectedIds] = useState([])
    const [anchorEl, setAnchorEl] = useState(null)
    const open = Boolean(anchorEl)

    const connections = useSelector((state) => state.connections.connections)

    const fetchUserMessages = async () => {
        try {
            const token = await getToken()
            await dispatch(fetchMessages({ token, userId })).unwrap()

            window.dispatchEvent(new Event('chatUpdate'))
        } catch (error) {
            toast.error(error.message)
        }
    }

    const sendMessage = async () => {
        try {
            if (!text && !image) return

            const token = await getToken()
            const formData = new FormData()
            formData.append('to_user_id', userId)
            formData.append('text', text)
            image && formData.append('image', image)

            const { data } = await api.post('/api/message/send', formData, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (data.success) {
                setText('')
                setImage(null)
                dispatch(addMessage(data.message))
            } else {
                throw new Error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const handleMenuClick = (event) => setAnchorEl(event.currentTarget)
    const handleMenuClose = () => setAnchorEl(null)

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode)
        setSelectedIds([])
        handleMenuClose()
    }

    const toggleMessageSelection = (msgId) => {
        setSelectedIds(prev => prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId])
    }

    const handleDeleteChat = async () => {

        try {
            const token = await getToken()
            const { data } = await api.delete(`/api/message/conversation/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (data.success) {
                toast.success("Chat deleted successfully")
                dispatch(resetMessages())
                navigate('/messages')
            } else {
                toast.error(data.message || "Failed to delete chat")
            }
        } catch (error) {
            console.error(error)
            toast.error("Could not delete chat")
        } finally {
            handleMenuClose()
        }
    }
    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return

        try {
            const token = await getToken()

            await Promise.all(selectedIds.map(id =>
                api.delete(`/api/message/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ));

            dispatch(deleteMessagesFromState(selectedIds))
            toast.success("Messages deleted");

            setIsSelectionMode(false)
            setSelectedIds([])

        } catch (error) {
            toast.error("Could not delete message")
        }
    }

    useEffect(() => {
        if (connections.length > 0) {
            const user = connections.find(connection => connection._id === userId)
            setUser(user)
        }
    }, [connections, userId])

    useEffect(() => {
        fetchUserMessages()
        return () => {
            dispatch(resetMessages())
        }
    }, [userId])

    useEffect(() => {

        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    return (
        <div className='flex flex-col h-screen'>
            <div className='flex items-center justify-between p-3 md:px-10 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-300 h-16 transition-all'>
                {isSelectionMode ? (
                    <div className="flex items-center justify-between w-full animate-in fade-in duration-200">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsSelectionMode(false)} className="p-2 hover:bg-black/5 rounded-full">
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                            <span className="font-semibold text-gray-800">{selectedIds.length} Selected</span>
                        </div>
                        <button onClick={handleDeleteSelected} disabled={selectedIds.length === 0} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors">
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <>
                        <div className='flex items-center gap-3'>
                            <img
                                src={user?.profile_picture || "https://via.placeholder.com/150"}
                                alt="Profile"
                                className='w-10 h-10 rounded-full object-cover border border-gray-200 bg-white'
                            />
                            <div className="flex flex-col justify-center">
                                {user ? (
                                    <>
                                        <p className='font-semibold text-gray-800 text-sm leading-tight'>{user.full_name}</p>
                                        <p className='text-xs text-gray-500'>@{user.username}</p>
                                    </>
                                ) : (
                                    <div className="h-8 flex items-center"><span className="text-sm text-gray-400">Loading user...</span></div>
                                )}
                            </div>
                        </div>

                        <div>
                            <IconButton onClick={handleMenuClick} size="small">
                                <MoreVert className="text-gray-600" />
                            </IconButton>
                            <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
                                <MenuItem onClick={toggleSelectionMode}>
                                    <ListItemIcon><Checklist fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Delete from Me" />
                                </MenuItem>
                                <MenuItem onClick={handleDeleteChat} sx={{ color: 'error.main' }}>
                                    <ListItemIcon><Trash2 fontSize="small" color="red" /></ListItemIcon>
                                    <ListItemText primary="Delete from everyone" />
                                </MenuItem>
                            </Menu>
                        </div>
                    </>
                )}
            </div>

            <div className='p-5 md:px-10 h-full overflow-y-scroll bg-slate-50'>
                <div className='space-y-4 max-w-4xl mx-auto'>
                    {messages.toSorted((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                        .map((message, index) => {
                            const isMyMessage = message.to_user_id === user?._id

                            const timeString = message.createdAt
                                ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : '';

                            return (
                                <div key={index} className={`flex items-end gap-2 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>

                                    {isSelectionMode && (
                                        <div className={`${isMyMessage ? 'order-2' : 'order-1'}`}>
                                            <Checkbox
                                                checked={selectedIds.includes(message._id)}
                                                onChange={() => toggleMessageSelection(message._id)}
                                                size="small"
                                                sx={{ padding: 0.5 }}
                                            />
                                        </div>
                                    )}

                                    <div className={`flex flex-col ${isMyMessage ? 'items-end order-1' : 'items-start order-2'}`}>
                                        <div
                                            onClick={() => isSelectionMode && toggleMessageSelection(message._id)}
                                            className={`p-2 text-sm max-w-sm shadow-sm cursor-pointer ${isMyMessage
                                                ? 'bg-indigo-600 text-white rounded-l-xl rounded-tr-xl'
                                                : 'bg-white text-slate-700 rounded-r-xl rounded-tl-xl border border-gray-200'
                                                } ${selectedIds.includes(message._id) ? 'ring-2 ring-offset-1 ring-indigo-500' : ''}`}
                                        >
                                            {message.message_type === 'image' && (
                                                <img src={message.media_url} className='w-full max-w-sm rounded-lg mb-1' alt="" />
                                            )}
                                            <p className="whitespace-pre-wrap">{message.text}</p>
                                        </div>
                                        <div className={`text-[9px] mt-1 text-right w-full ${isMyMessage ? 'text-gray-500' : 'text-gray-500'}`}>
                                            {timeString}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    }
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {!isSelectionMode && (
                <div className='px-4 pb-4 pt-2 bg-white'>
                    <div className='flex items-center gap-3 pl-5 p-1.5 bg-white w-full max-w-xl mx-auto border border-gray-200 shadow rounded-full'>
                        <input
                            type="text"
                            className='flex-1 outline-none text-slate-700'
                            placeholder='Type a message...'
                            onKeyDown={e => e.key === 'Enter' && sendMessage()}
                            onChange={(e) => setText(e.target.value)}
                            value={text}
                        />
                        <label htmlFor="image">
                            {image ? (
                                <img src={URL.createObjectURL(image)} alt="" className='h-8 rounded' />
                            ) : (
                                <ImageIcon className='size-7 text-gray-400 cursor-pointer hover:text-indigo-500 transition-colors' />
                            )}
                            <input type="file" id='image' accept='image/*' hidden onChange={(e) => setImage(e.target.files[0])} />
                        </label>
                        <button
                            onClick={sendMessage}
                            className='bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-800 active:scale-95 cursor-pointer text-white p-2 rounded-full shadow-md'
                        >
                            <SendHorizontal size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ChatBox