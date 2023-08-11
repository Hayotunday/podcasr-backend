import express from "express";
import bcrypt from 'bcrypt'

import User from "../models/user.js";
import Guest from "../models/guest.js";
import Podcaster from "../models/podcaster.js";

const router = express.Router();


// PATCH ROUTES
router.patch('/', async (req, res) => {
  const { newPass, password, email, id } = req.body
  const encryptedPass = await bcrypt.hash(newPass, 10)

  console.log(req.body)

  try {
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

    await User.findByIdAndUpdate(
      id,
      { $set: { password: encryptedPass } }
    )
    await User.findOne({ email: req.user })
      .then(() => { return res.sendStatus(200) })
      .catch((err) => { return res.status(400).json('Error: ' + err) })
  } catch (error) {
    return res.sendStatus(500)
  }
});


// DELETE ROUTES
router.delete('/', async (req, res) => {
  const { password, email, id } = req.body

  try {
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

    const userFound = await User.findById(id)

    if (userFound.profile_type === "Podcaster") {
      await User.findByIdAndDelete(id)
      await Podcaster.deleteOne({ user: userFound._id })
        .then(() => { return res.status(200).json('User deleted!') })
        .catch((err) => { return res.status(400).json('Error: ' + err) })
    } else if (userFound.profile_type === "Guest") {
      await User.findByIdAndDelete(id)
      await Guest.deleteOne({ user: userFound._id })
        .then(() => { return res.status(200).json('User deleted!') })
        .catch((err) => { return res.status(400).json('Error: ' + err) })
    }
  } catch (error) {
    return res.sendStatus(500)
  }
});

export default router