import dotenv from 'dotenv'
dotenv.config();
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import stripe from '../stripe.js'

import User from "../models/user.js";
import Token from '../models/token.js'
import ResetCode from '../models/resetcode.js';

import { mailer } from '../middleware/verifymail.js';
import { truncate } from 'fs';

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

    const accessToken = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET)
    // const refreshToken = jwt.sign({ email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "28h" })

    // await User.updateOne(
    //   { email: email },
    //   { $set: { refresh_token: refreshToken } })

    // res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
    return res.status(200).json({ accessToken, id: result._id, mail: result.email })
  } catch (error) {
    return res.status(500).json({ message: "Server error!" })
  }
});


router.post('/logout', async (req, res) => {
  // const cookies = req.cookies
  // if (!cookies?.jwt) return res.sendStatus(204)
  // // console.log(cookies.jwt)
  // const refreshToken = cookies.jwt

  // const founduser = await User.findOne({ refresh_token: refreshToken })
  // if (!founduser) {
  //   res.clearCookie('jwt', { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
  //   return res.sendStatus(204)
  // }

  // await User.updateOne(
  //   { email: email },
  //   { $set: { refresh_token: "" } }
  // )
  res.clearCookie('jwt', { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
  res.sendStatus(204)
});


router.post('/register', async (req, res) => {
  const { email, name, password } = req.body

  const token = jwt.sign({ email }, "jwtSecret")
  const pass = await bcrypt.hash(password, 10)

  const newUser = await new User({
    email,
    name,
    password: pass,
    token,
    email_verified: false,
    image: "",
    profile_type: "",
    // refresh_token: "",
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
          const url = `${process.env.BASE_URL}/verified?id=${_id}&token=${token}`
          const subject = "Verify email"
          const sender = "fiona@powpr.co.uk"
          const message = `<div style="">
                      <h4>
                      Good day ${name},
                      </h4>
                    
                      <P>
                        We are happy to have you. To be able to connect with podcast and guest please verify your email by clicking on link below 
                      </P>
                    
                      <p>
                      <a href="${url}" target="_blank"><b>Verify email</b></a>
                      </p>

                      <p>Link expires in 1 hour</p>
                    </div>`

          await mailer(email, subject, message, sender)
          return res.sendStatus(201);
        })
        .catch((error) => {
          console.log(error); res.status(400).json({ message: error })
        })
    } else {
      return res.sendStatus(401)
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error });
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
    const url = `${process.env.BASE_URL}/verified?id=${id}&token=${token}`
    const subject = 'Verify email'
    const sender = "fiona@powpr.co.uk"
    const message = `<div style="">
                      <h4>
                      Good day ${name},
                      </h4>
                    
                      <P>
                        We are happy to have you. To be able to connect with podcast and guest please verify your email by clicking on link below 
                      </P>
                    
                      <p>
                      <a href="${url}" target="_blank"><b>Verify email</b></a>
                      </p>
                    
                    <p>Link expires in 1 hour</p>
                    </div>`

    await mailer(email, subject, message, sender)
    return res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ message: 'Server error!' });
  }
});


router.get('/exists/:email', async (req, res) => {
  const { email } = req.params
  try {
    // Check if user exists
    const userExists = await User.findOne({ email })

    if (userExists) return res.status(200).json({ userExists, exists: true })
    return res.status(200).json({ userExists, exists: false })
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
    if (!userFound) return res.status(400).json("Invalid link: Not Found")

    if (userFound.email_verified) return res.status(400).json("Invalid link: Verified")

    const tokenFound = await Token.findOne({ user: req.body.id, token: req.body.token })
    if (!tokenFound) return res.status(400).json("Invalid link: Token")

    await User.findByIdAndUpdate(
      req.body.id,
      { $set: { email_verified: true } }
    )
    await Token.deleteOne({ token: req.body.token })

    const { email } = userFound
    const accessToken = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET)
    // const refreshToken = jwt.sign({ email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "28h" })

    // await User.updateOne(
    //   { email: email },
    //   { $set: { refresh_token: refreshToken } }
    // )

    // res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
    return res.status(200).json({ accessToken })
  } catch (error) {
    return res.sendStatus(500)
  }
});


router.post('/password/forgot', async (req, res) => {
  try {
    const userFound = await User.findOne({ email: req.body.email })
    if (!userFound) return res.status(400).json("No user found with this email. Please sign up!")

    const { _id, name, email } = userFound
    await ResetCode.deleteMany({ user: _id })

    const code = crypto.randomInt(0, 99999).toString().padStart(5, "0")
    const subject = 'Your password reset code'
    const sender = "fiona@powpr.co.uk"
    const message = `<div style="">
                      <h4>
                      Good day ${name},
                      </h4>
                    
                      <P>
                        Forgot your password, use the code below to create a new one. 
                      </P>
                    
                      <h1><b>${code}</b></h1>
                    
                    <p>code expires in 1 hour</p>
                    </div>`

    await mailer(email, subject, message, sender)

    const newResetCode = await ResetCode({
      user: _id,
      reset_code: code
    })
    await newResetCode.save()
      .then(() => { return res.status(200).json({ message: "email sent", email }) })
      .catch(() => { return res.sendStatus(500) })
  } catch (error) {
    return res.sendStatus(500)
  }
});


router.post('/password/reset', async (req, res) => {
  try {
    const userFound = await User.findOne({ email: req.body.email })
    if (!userFound) return res.status(400).json("No user found with this email. Please sign up!")

    const { _id } = userFound

    const codeFound = await ResetCode.findOne({ user: _id, reset_code: req.body.code })
    if (codeFound.reset_code === req.body.code) await ResetCode.deleteOne({ user: _id })
    return res.status(200).json({ message: "successful" })
  } catch (error) {
    return res.sendStatus(500)
  }
});


// router.patch('/password/resend-code', async (req, res) => {
//   try {
//     const userFound = await User.findById(req.body.id)
//     if (!userFound) return res.status(400).json("Invalid link")

//     if (userFound.email_verified) return res.status(400).json("Invalid link")

//     const tokenFound = await Token.findOne({ user: req.body.id, token: req.body.token })
//     if (!tokenFound) return res.status(400).json("Invalid link")

//     await User.findByIdAndUpdate(
//       req.body.id,
//       { $set: { email_verified: true } }
//     )
//     await Token.deleteOne({ token: req.body.token })

//     const { email } = userFound
//     const accessToken = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "24h" })
//     const refreshToken = jwt.sign({ email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "28h" })

//     await User.updateOne(
//       { email: email },
//       { $set: { refresh_token: refreshToken } }
//     )

//     res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
//     return res.status(200).json({ accessToken })
//   } catch (error) {
//     return res.sendStatus(500)
//   }
// });


router.post('/payment', async (req, res) => {
  const { id, verified } = req.body
  try {
    const router = async () => {
      await User.findByIdAndUpdate(id, { $set: { paid: true } })
      if (verified) {
        return `${process.env.BASE_URL}/profile`
      } else {
        return `${process.env.BASE_URL}/create-profile`
      }
    }
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
          price: process.env.PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: verified ? `${process.env.BASE_URL}/profile` : `${process.env.BASE_URL}/create-profile`,
      cancel_url: verified ? `${process.env.BASE_URL}/profile` : `${process.env.BASE_URL}/login`,
      automatic_tax: { enabled: true },
    }).then(async (response) => {
      console.log(response)
      if (response.payment_status === 'paid') await User.findByIdAndUpdate(id, { $set: { paid: true } })
    }).catch(err => {
      console.log(err.message)
    });

    return res.json(session.url);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post('/password/create', async (req, res) => {
  try {
    const pass = await bcrypt.hash(req.body.password, 10)
    await User.findByIdAndUpdate({ _id: req.body.id }, { $set: { password: pass } })
      .then(() => { return res.status(200).json({ message: "successful" }) })
      .catch(() => { return res.sendStatus(500) })
  } catch (error) {
    return res.sendStatus(500)
  }
});

export default router