import dotenv from 'dotenv'
dotenv.config();
import express from 'express';
import cors from 'cors';

import { connectToDB } from './connection.js'

import userRoutes from './routes/user.js'

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

connectToDB();

app.use("/user", userRoutes)

app.listen(port, () => console.log(`SERVER RUNNING`))
