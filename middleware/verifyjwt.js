import dotenv from 'dotenv'
dotenv.config()
import jwt from 'jsonwebtoken'

export const verifyJwt = (req, res, next) => {
  const authHeader = req.headers['authorization']

  if (!authHeader) return res.status(401).json({ message: "No access token" })
  // console.log(authHeader)

  const token = authHeader.split(' ')[1]

  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET,
    (err, decoded) => {
      if (err) return res.status(403).json({ message: "Invalid access token" })
      req.user = decoded.email;
      next()
    }
  )
}