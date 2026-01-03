import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../api/axios'

const initialState = {
    messages: []
}

export const fetchMessages = createAsyncThunk('messages/fetchMessages', async ({ token, userId }) => {
    const { data } = await api.post('/api/message/get', { to_user_id: userId }, {
        headers: { Authorization: `Bearer ${token}` }
    })
    return data.success ? data : null
})

const messagesSlice = createSlice({
    name: 'messages',
    initialState,
    reducers: {
        setMessages: (state, action) => {
            state.messages = action.payload
        },
        addMessage: (state, action) => {
            state.messages = [...state.messages, action.payload]
        },
        resetMessages: (state) => {
            state.messages = []
        },
        deleteMessagesFromState: (state, action) => {
            const idsToRemove = action.payload;
            state.messages = state.messages.filter(msg => !idsToRemove.includes(msg._id));
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchMessages.fulfilled, (state, action) => {
            if (action.payload) {
                state.messages = action.payload.messages
            }
        })
    }
})

export const { setMessages, addMessage, resetMessages, deleteMessagesFromState } = messagesSlice.actions

export default messagesSlice.reducer