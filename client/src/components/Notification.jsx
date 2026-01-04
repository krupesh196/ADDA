import React from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const Notification = ({ t, message }) => {
    const navigate = useNavigate()

    const handleNavigate = () => {
        navigate(`/messages/${message.from_user_id._id}`)
        toast.dismiss(t.id)
    }

    return (
        <div 
            onClick={handleNavigate}
            className="max-w-md w-full bg-white shadow-lg rounded-lg flex border border-gray-300 hover:scale-105 transition cursor-pointer pointer-events-auto"
        >
            <div className='flex-1 p-4'>
                <div className='flex items-center'>
                    <img
                        src={message.from_user_id.profile_picture}
                        alt=""
                        className='h-10 w-10 rounded-full flex-shrink-0 object-cover'
                    />
                    <div className='ml-3 flex-1'>
                        <p className='text-sm font-bold text-gray-900'>
                            {message.from_user_id.full_name}
                        </p>
                        <p className='text-sm text-gray-500 truncate w-40'>
                            {message.message_type === 'image' ? 'Sent an image' : message.text}
                        </p>
                    </div>
                </div>
            </div>
            <div className='flex border-l border-gray-200'>
                <button className='w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500'>
                    Reply
                </button>
            </div>
        </div>
    )
}

export default Notification
