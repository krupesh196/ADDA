import React, { useEffect, useState } from 'react'
import { X, Search, Globe, UserCheck } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const ShareModal = ({ isOpen, onClose, post }) => {

    const { getToken } = useAuth()
    const navigate = useNavigate()

    const [users, setUsers] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [sentUsers, setSentUsers] = useState([])

    useEffect(() => {
        if (isOpen && searchQuery === '') {
            const fetchFollowing = async () => {
                setLoading(true);
                try {
                    const token = await getToken();
                    const { data } = await api.get('/api/user/connections', {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    if (data.success) {
                        setUsers(data.following || [])
                    }
                } catch (error) {
                    console.error("Error fetching following:", error)
                } finally {
                    setLoading(false)
                }
            };
            fetchFollowing()
        }
    }, [isOpen, searchQuery, getToken])

    // 2. Global Search when user types
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.trim()) {
                setLoading(true);
                try {
                    const token = await getToken();
                    // Calls the Global Discover endpoint
                    const { data } = await api.post('/api/user/discover',
                        { input: searchQuery },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    if (data.success) {
                        setUsers(data.users);
                    }
                } catch (error) {
                    console.error("Error searching users:", error);
                } finally {
                    setLoading(false);
                }
            }
        }, 500)

        return () => clearTimeout(delayDebounceFn)
    }, [searchQuery, getToken])

    const handleSend = async (user) => {
        try {
            const token = await getToken()
            const postLink = `${window.location.origin}/post/${post._id}`
            const messageText = `Check out this post: ${postLink}`

            const { data } = await api.post(`/api/message/send`,
                { to_user_id: user._id, text: messageText },
                { headers: { Authorization: `Bearer ${token}` } }
            )

            if (data.success || data) {
                setSentUsers((prev) => [...prev, user._id])
                toast.success(`Sent to @${user.username}`)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to share")
        }
    }

    if (!isOpen) return null
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Share Post</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-3 border-b">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search for anyone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Helper Text */}
                    <div className="px-1 mt-2 flex items-center gap-2 text-xs text-gray-400">
                        {searchQuery ? (
                            <><Globe className="w-3 h-3" /> <span>Searching all users</span></>
                        ) : (
                            <><UserCheck className="w-3 h-3" /> <span>Suggested: People you follow</span></>
                        )}
                    </div>
                </div>

                {/* Users List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading...</div>
                    ) : users.length > 0 ? (
                        users.map((user) => (
                            <div key={user._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={user.profile_picture}
                                        alt=""
                                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                    />
                                    <div>
                                        <div className="font-medium text-sm">{user.full_name}</div>
                                        <div className="text-xs text-gray-500">@{user.username}</div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleSend(user)}
                                    disabled={sentUsers.includes(user._id)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all
                                    ${sentUsers.includes(user._id)
                                            ? "bg-green-100 text-green-700 cursor-default"
                                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                                        }`}
                                >
                                    {sentUsers.includes(user._id) ? 'Sent' : 'Send'}
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            {searchQuery ? "No users found" : "No connections yet. Type to search globally."}
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}

export default ShareModal;