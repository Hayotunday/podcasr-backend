import dotenv from 'dotenv'
dotenv.config();
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'

import { connectToDB } from './connection.js'

import userRoutes from './routes/user.js'
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'

const app = express();
const port = process.env.PORT || 5000;

// // Define a list of origins that you want to allow, in this case, just 'https://podcast-expert.vercel.app'
const allowedOrigins = ['https://podcast-expert.vercel.app', 'http://localhost:3000'];

const corsOptions = {
  origin: '*',
  // origin: function (origin, callback) {
  //   // Check if the request's origin is in the allowed list
  //   if (allowedOrigins.includes(origin) || !origin) {
  //     callback(null, true);
  //   } else {
  //     callback(new Error('Not allowed by CORS'));
  //   }
  // },
  credentials: true, // This enables sending cookies in cross-origin requests
};

app.use(cors(corsOptions));
// app.use(cors({ credentials: true, origin: '*' }));
app.use(cookieParser())
app.use(express.json());

connectToDB();

app.use("/user", userRoutes)
app.use("/auth", authRoutes)
app.use("/admin", adminRoutes)

app.listen(port, () => console.log(`SERVER RUNNING`))
