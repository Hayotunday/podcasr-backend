import express from "express";
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken";

import { confirmJwt } from "../middleware/confirmjwt.js";

import User from "../models/user.js";
import Guest from "../models/guest.js";
import Podcaster from "../models/podcaster.js";
import Featured from "../models/featured.js";

const router = express.Router();


// POST ROUTES
router.post('/', async (req, res) => {
  const { password, email } = req.body

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

    await User.findOneAndUpdate(
      { email: email },
      { $set: { isAdmin: true } }
    )
    await User.findOne({ email: req.user })
      .then(() => { return res.sendStatus(200) })
      .catch((err) => { return res.status(400).json('Error: ' + err) })
  } catch (error) {
    return res.sendStatus(500)
  }
});

router.post('/create', confirmJwt, async (req, res) => {
  const { password, email, profile_type, name, image } = req.body

  const token = jwt.sign({ email }, "jwtSecret")
  const pass = await bcrypt.hash(password, 10)

  try {
    const result = await User.findOne({ email: email })
    if (result) {
      return res.status(200).json({ message: "User already exists!" })
    }

    await new User({
      email,
      name,
      password: pass,
      token,
      email_verified: true,
      image,
      profile_type,
      paid: true,
      createdProfile: true,
      saved_list: [],
      recent: []
    }).save()
      .then(async (user) => {
        if (profile_type === "Guest") {
          await new Guest({
            user: user._id,
            topic_categories: [],
            short_bio: "",
            mission: "",
            headline: "",
            interview_links: [],
            record_preference: [],
            own_podcast: false,
          }).save()
            .then(() => {
              return res.status(201).json('Successfully created user');
            })
            .catch((err) => { console.log(err) })
        } else {
          await new Podcaster({
            user: user._id,
            podcast_name: "",
            topic_categories: [],
            url: "",
            bio: "",
            highlights: [],
            next_transmission: {},
            headline: "",
            interviews: [],
            record_preference: [],
            recording: false,
            contact_me: true
          }).save()
            .then((e) => {
              return res.status(201).json('Successfully created user');
            })
            .catch((err) => { console.log(err) })
        }
      })
      .catch((error) => {
        res.status(400).json({ message: error })
      })
  } catch (error) {
    return res.sendStatus(500)
  }
});

router.post('/copy-db', async (req, res) => {
  try {
    // User.collection.find
    // await User.findOneAndUpdate(
    //   { email: email },
    //   { $set: { isAdmin: true } }
    // )
    // await User.findOne({ email: req.user })
    //   .then(() => { return res.sendStatus(200) })
    //   .catch((err) => { return res.status(400).json('Error: ' + err) })
  } catch (error) {
    return res.sendStatus(500)
  }
});

router.post('/featured', async (req, res) => {
  const { id } = req.body

  try {
    await new Featured({ user: id }).save()
      .then(() => { return res.status(200).json("Successfully added user to Featured!") })
      .catch((err) => { return res.status(400).json('Error: ' + err) })
  } catch (error) {
    return res.sendStatus(500)
  }
});


// PATCH ROUTES
router.patch('/', async (req, res) => {
  const { newPass, password, email, id } = req.body
  const encryptedPass = await bcrypt.hash(newPass, 10)

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

router.patch('/make-admin', async (req, res) => {
  const { password, email, id } = req.body

  try {
    const result = await User.findOne({ email: email })
    if (result === null) return res.status(401).json({ message: "User not found!" })

    // compare password
    const checkPassword = await bcrypt.compare(password, result.password)

    // incorrect password
    if (!checkPassword || result.email !== email) {
      // "User Email or Password doesn't match" 401
      return res.status(401).json({ message: "User Email or Password doesn't match" })
    }

    await User.findByIdAndUpdate(
      id,
      { $set: { isAdmin: true } }
    )
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

router.delete('/featured/:user', async (req, res) => {
  const user = req.params.user

  try {
    await Featured.deleteMany({ user })
      .then(() => { return res.status(200).json('Successfully removed User from Featured!') })
      .catch((err) => { return res.status(400).json('Error: ' + err) })
  } catch (error) {
    return res.sendStatus(500)
  }
});

export default router