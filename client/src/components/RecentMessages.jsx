import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import moment from 'moment'
import { useAuth, useUser } from '@clerk/clerk-react'
import api from '../api/axios'
import { useRef } from 'react'

const RecentMessages = () => {

    const [messages, setMessages] = useState([])
    const { user } = useUser()
    const { getToken } = useAuth()

    const { userId: currentChatId } = useParams()
    const prevUnreadMap = useRef({});
    const isFirstLoad = useRef(true);

    const fetchRecentMessages = async () => {
        try {
            const token = await getToken()
            const { data } = await api.get('/api/user/recent-messages', {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (data.success) {
                const latestMessagesMap = {}
                const unreadCountsMap = {}

                data.messages.forEach(message => {
                    const isMe = message.from_user_id._id === user.id;
                    const partnerId = isMe ? message.to_user_id._id : message.from_user_id._id;

                    if (!latestMessagesMap[partnerId] || new Date(message.createdAt) > new Date(latestMessagesMap[partnerId].createdAt)) {
                        latestMessagesMap[partnerId] = message;
                    }

                    if (!isMe && !message.isRead) {
                        unreadCountsMap[partnerId] = (unreadCountsMap[partnerId] || 0) + 1
                    }
                })

                const combinedMessages = Object.values(latestMessagesMap).map(msg => {
                    const isMe = msg.from_user_id._id === user.id
                    const partnerId = isMe ? msg.to_user_id._id : msg.from_user_id._id

                    return {
                        ...msg,
                        unreadCount: unreadCountsMap[partnerId] || 0
                    }
                })

                const sortedMessages = combinedMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                setMessages(sortedMessages);
            }
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        if (user) {
            fetchRecentMessages();
            const intervalId = setInterval(fetchRecentMessages, 1000)

            const handleChatUpdate = () => fetchRecentMessages()
            window.addEventListener('chatUpdate', handleChatUpdate)
            return () => {
                clearInterval(intervalId);
                window.removeEventListener('chatUpdate', handleChatUpdate)
            };
        }
    }, [user, currentChatId]);

    const handleUserClick = () => {
        setTimeout(() => {
            fetchRecentMessages()
        })
    }

    return (
        <div className='bg-white max-w-xs mt-4 p-4 min-h-20 rounded-md shadow text-xs text-slate-800'>
            <h3 className='font-semibold text-slate-8 mb-4'>Recent Messages</h3>
            <div className='flex flex-col max-h-56 overflow-y-scroll no-scrollbar'>
                {messages.map((message, index) => {
                    const isMe = message.from_user_id._id === user.id;
                    const otherUser = isMe ? message.to_user_id : message.from_user_id;

                    const isCurrentChat = otherUser._id === currentChatId;
                    const showBadge = message.unreadCount > 0 && !isCurrentChat;

                    return (
                        <Link
                            to={`/messages/${otherUser._id}`}
                            key={index}
                            onClick={() => handleUserClick(otherUser._id)}
                            className={`flex items-start gap-2 py-2 hover:bg-slate-100 transition-colors rounded-md px-1 ${isCurrentChat ? 'bg-slate-50' : ''}`}
                        >
                            <img
                                src={otherUser.profile_picture}
                                alt=""
                                className='w-8 h-8 rounded-full object-cover border border-gray-200'
                            />
                            <div className='w-full'>
                                <div className='flex justify-between items-center'>
                                    <p className='font-semibold text-gray-900'>{otherUser.full_name}</p>
                                    <p className='text-[10px] text-slate-400 whitespace-nowrap ml-1'>
                                        {moment(message.createdAt).fromNow(true)}
                                    </p>
                                </div>
                                <div className='flex justify-between items-center mt-0.5'>
                                    <p className={`truncate max-w-[140px] ${showBadge ? 'font-medium text-gray-500' : 'text-gray-500'}`}>
                                        {isMe && <span className="font-normal text-gray-400">You: </span>}
                                        {message.message_type === 'image' ? 'Sent an image' : message.text}
                                    </p>

                                    {showBadge && (
                                        <span className='bg-indigo-500 text-white min-w-[16px] h-4 flex items-center justify-center rounded-full text-[10px] px-1 shadow-sm'>
                                            {message.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>

                        </Link>
                    )
                })}
                {messages.length === 0 && (
                    <p className="text-gray-400 text-center py-4">No recent messages</p>
                )}
            </div>
        </div>
    )
}

export default RecentMessages