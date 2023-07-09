import dotenv from 'dotenv'
dotenv.config()
import jwt from 'jsonwebtoken'

import User from '../models/user.js'

export const refreshJwt = (req, res) => {
  // console.log(req)
  const cookies = req.cookies
  if (!cookies?.jwt) return res.status(401).json({ message: "No access token" })
  console.log(cookies.jwt)
  const refreshToken = cookies.jwt

  const founduser = User.findOne({ refresh_token: refreshToken })
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
      return res.status(200).json({ accessToken })
    }
  )
}