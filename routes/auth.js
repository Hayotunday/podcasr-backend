import dotenv from 'dotenv'
dotenv.config();
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt'
import crypto from 'crypto'

import User from "../models/user.js";
import Token from '../models/token.js'

import { mailer } from '../middleware/verifymail.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  try {
    // check user existence
    const result = await User.findOne({ email: email })
    if (result === null) {
      return res.status(401).json({ message: "User not found!" })
    }

    // compare password
    const checkPassword = await bcrypt.compare(password, result.password)

    // incorrect password
    if (!checkPassword || result.email !== email) {
      // "User Email or Password doesn't match" 401
      return res.status(401).json({ message: "User Email or Password doesn't match" })
    }

    const accessToken = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "24h" })
    const refreshToken = jwt.sign({ email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "28h" })

    await User.updateOne(
      { email: email },
      { $set: { refresh_token: refreshToken } })

    res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
    return res.status(200).json({ accessToken })
  } catch (error) {
    return res.status(500).json({ message: "Server error!" })
  }
});


router.post('/logout', async (req, res) => {
  const cookies = req.cookies
  if (!cookies?.jwt) return res.sendStatus(204)
  // console.log(cookies.jwt)
  const refreshToken = cookies.jwt

  const founduser = await User.findOne({ refresh_token: refreshToken })
  if (!founduser) {
    res.clearCookie('jwt', { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
    return res.sendStatus(204)
  }

  await User.updateOne(
    { email: email },
    { $set: { refresh_token: "" } }
  )
  res.clearCookie('jwt', { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
  res.sendStatus(204)
});


router.post('/register', async (req, res) => {
  const { email, name, password } = req.body

  const token = jwt.sign({ email }, "jwtSecret", { expiresIn: "30d" })
  const pass = await bcrypt.hash(password, 10)

  const newUser = await new User({
    email,
    name,
    password: pass,
    token,
    email_verified: false,
    image: "",
    profile_type: "",
    refresh_token: "",
    createdProfile: false,
    saved_list: [],
    recent: []
  });

  try {
    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      await newUser.save()
        .then(async (users) => {
          const { email, _id, name } = users
          const token = crypto.randomBytes(28).toString('hex')
          const newToken = new Token({
            user: _id,
            token: token
          })
          await newToken.save()
          const url = `http://localhost:3000/verified?id=${_id}&token=${token}`

          await mailer(email, name, url)
          return res.sendStatus(201);
        })
        .catch((err) => { res.status(400).json('Error: ' + err) })
    } else {
      return res.sendStatus(401)
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error!' });
  }
});


router.post('/resend-mail', async (req, res) => {
  try {
    // Check if user exists
    const userFound = await User.findOne({ email: req.body.email })

    if (!userFound) return res.sendStatus(401)

    if (userFound.email_verified) return res.sendStatus(401)

    const { email, _id, name } = userFound
    let id = _id.toString()
    const tokenFound = await Token.findOne({ user: id })

    if (tokenFound) await Token.deleteOne({ user: id })

    const token = crypto.randomBytes(28).toString('hex')
    const newToken = new Token({
      user: id.toString(),
      token: token
    })
    await newToken.save()
    const url = `http://localhost:3000/verified?id=${id}&token=${token}`
    const message = `<div style="">
                      <h4>
                      Good day ${name},
                      </h4>
                    
                      <P>
                        We are happy to have you. To be able to connect with podcast and guest please verify your email by clicking on link below 
                      </P>
                    
                      <p>
                      <a href="${url}" target="_blank">Verify email</a>
                      </p>
                    </div>`

    await mailer(email, message)
    return res.sendStatus(200);

  } catch (error) {
    res.status(500).json({ message: 'Server error!' });
  }
});


router.get('/refresh', async (req, res) => {
  const cookies = req.cookies
  if (!cookies?.jwt) return res.status(401).json({ message: "No access token" })
  // console.log(cookies.jwt)
  const refreshToken = cookies.jwt

  const founduser = await User.findOne({ refresh_token: refreshToken })
  if (!founduser) return res.sendStatus(403)

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    (err, decoded) => {
      if (err || founduser.email !== decoded.email) return res.status(403)
      const accessToken = jwt.sign(
        { email: decoded.email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '24h' }
      )
      return res.json({ accessToken })
    }
  )
});


router.patch('/verify-mail', async (req, res) => {
  try {
    const userFound = await User.findById(req.body.id)
    if (!userFound) return res.status(400).json("Invalid link")

    if (userFound.email_verified) return res.status(400).json("Invalid link")

    const tokenFound = await Token.findOne({ user: req.body.id, token: req.body.token })
    if (!tokenFound) return res.status(400).json("Invalid link")

    await User.findByIdAndUpdate(
      req.body.id,
      { $set: { email_verified: true } }
    )
    await Token.deleteOne({ token: req.body.token })

    const { email } = userFound
    const accessToken = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "24h" })
    const refreshToken = jwt.sign({ email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "28h" })

    await User.updateOne(
      { email: email },
      { $set: { refresh_token: refreshToken } }
    )

    res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
    return res.status(200).json({ accessToken })
  } catch (error) {
    return res.sendStatus(500)
  }
});

export default router