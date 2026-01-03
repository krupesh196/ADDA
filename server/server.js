import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { inngest, functions } from "./inngest/index.js"
import { serve } from "inngest/express";
import { clerkMiddleware } from '@clerk/express'
import userRouter from './routes/userRoutes.js';
import postRouter from './routes/postRoutes.js';
import storyRouter from './routes/storyRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const PORT = process.env.PORT || 4000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

await connectDB();

app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

app.get('/', (req, res) => res.send('Server is running'))
app.use('/api/inngest', serve({ client: inngest, functions }))
app.use('/api/user', userRouter)
app.use('/api/post', postRouter)
app.use('/api/story', storyRouter)
app.use('/api/message', messageRouter)

httpServer.listen(PORT, () => console.log(`Server is running on port ${PORT}`))