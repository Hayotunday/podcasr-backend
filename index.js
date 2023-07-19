import dotenv from 'dotenv'
dotenv.config();
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'

import { connectToDB } from './connection.js'

import userRoutes from './routes/user.js'
import authRoutes from './routes/auth.js'

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(cookieParser())
app.use(express.json());
app.use(express.static('public'))

connectToDB();

app.use("/user", userRoutes)
app.use("/auth", authRoutes)

app.listen(port, () => console.log(`SERVER RUNNING`))
