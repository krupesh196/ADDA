import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { dummyPostsData, dummyUserData } from '../assets/assets'
import Loading from '../components/Loading'
import UserProfileInfo from '../components/UserProfileInfo'
import PostCard from '../components/PostCard'
import moment from 'moment'
import Profilemodal from '../components/Profilemodal'
import { useAuth } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import api from '../api/axios'

const Profile = () => {

  const currentUser = useSelector((state) => state.user.value)

  const { getToken } = useAuth()
  const { profileId } = useParams()

  const [likedPosts, setLikedPosts] = useState([])
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([null])
  const [activeTab, setActiveTab] = useState('posts')
  const [showEdit, setShowEdit] = useState(false)

  const fetchUser = async (customId) => {
    const token = await getToken()
    try {
      const targetId = customId || profileId || (currentUser && currentUser._id)

      const { data } = await api.post(`/api/user/profiles`, { profileId: targetId }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (data.success) {
        setUser(data.profile)
        setPosts(data.posts)
        setLikedPosts(data.likedPosts || [])
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handlePostDelete = (deletedPostId) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post._id !== deletedPostId));
    if (user) {
      setUser((prev) => ({ ...prev, posts_count: prev.posts_count - 1 }));
    }
  }

  const refreshProfileData = () => {
    fetchUser(profileId || currentUser._id);
  }

  useEffect(() => {
    if (profileId) {
      fetchUser(profileId)
    } else {
      fetchUser(currentUser._id)
    }
  }, [profileId, currentUser])

  return user ? (
    <div className='relative h-full overflow-y-scroll bg-gray-50 p-6'>
      <div className='max-w-3xl mx-auto'>

        {/* Profile Card */}
        <div className='bg-white rounded-2xl shadow overflow-hidden'>

          {/* Cover Photo */}
          <div className='h-40 md:h-56 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200'>
            {
              user.cover_photo &&
              <img
                src={user.cover_photo}
                alt=""
                className='w-full h-full object-cover'
              />
            }
          </div>

          {/* User Info */}
          <UserProfileInfo
            user={user}
            posts={posts}
            profileId={profileId}
            setShowEdit={setShowEdit}
          />

        </div>

        {/* Tabs */}
        <div className='mt-6'>
          <div className='bg-white rounded-xl shadow p-1 flex max-w-md mx-auto'>
            {["posts", "media", "likes"].map((tab) => (
              <button
                onClick={() => setActiveTab(tab)}
                key={tab}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer
                ${activeTab === tab ? "bg-indigo-600 text-white" : "text-gray-600 hover:text-gray-900"}
                `}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Posts */}
          {activeTab === 'posts' && (
            <div className='mt-6 flex flex-col items-center gap-6'>
              {
                posts.map((post) =>
                  <PostCard
                    key={post._id}
                    post={post}
                    onDelete={handlePostDelete}
                  />)}
            </div>
          )}

          {/* Media */}
          {activeTab === 'media' && (
            <div className='grid grid-cols-3 mt-6 max-w-6xl'>
              {
                posts.filter((post) => post.image_urls.length > 0).map((post) => (
                  <React.Fragment key={post._id}>
                    {post.image_urls.map((image, index) => (
                      <div
                        key={index}
                        className='relative group border border-gray-200'
                      >
                        <img
                          src={image}
                          className='w-full h-64 object-contain'
                          alt=""
                        />
                      </div>
                    ))}
                  </React.Fragment>
                ))
              }
            </div>
          )}

          {/* Likes Tab */}
          {activeTab === 'likes' && (
            <div className='mt-6 flex flex-col items-center gap-6 w-full'>
              {likedPosts.length > 0 ? (
                likedPosts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onDelete={refreshProfileData}
                    reloadPosts={refreshProfileData}
                  />
                ))
              ) : (
                <div className='text-center text-gray-500 mt-8 font-medium'>
                  No liked posts yet.
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Edit Profile Modal */}
      {
        showEdit &&
        <Profilemodal setShowEdit={setShowEdit} />
      }

    </div>
  ) : (<Loading />)
}

export default Profile