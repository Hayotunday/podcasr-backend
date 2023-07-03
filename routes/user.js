import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt'
import User from "../models/user";

const router = express.Router();

// all routes in here are starting with /users

// User
router.get('/', async (req, res) => {
  await User.find()
    .then((users) => { res.json(users) })
    .catch((err) => { res.status(400).json('Error: ' + err) })
});

router.get('/:id', async (req, res) => {
  await User.findById(req.params.id)
    .then((users) => { res.json(users) })
    .catch((err) => { res.status(400).json('Error: ' + err) })
});

router.post('/', async (req, res) => {
  const { email, name, password, email_verified } = req.body

  const token = jwt.sign({ email }, "jwtSecret", { expiresIn: "30d" })
  const pass = await bcrypt.hash(password, 10)

  const newUser = new User({
    email,
    name,
    password: pass,
    token,
    email_verified,
    image: "",
    profile_type: ""
  });

  try {
    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // User already exists, send user data
      res.status(200).json(user);
    } else {
      // User doesn't exist, create a new user and add to the database
      await newUser.save()
        .then((user) => { res.status(201).json(user) })
        .catch((err) => { res.status(400).json('Error: ' + err) })
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error!' });
  }
});

router.delete('/:id', async (req, res) => {
  await User.findByIdAndDelete(req.params.id)
    .then(() => { res.json('User deleted!') })
    .catch((err) => { res.status(400).json('Error: ' + err) })
});

router.patch('/:id', async (req, res) => {
  const userExist = await User.findOne({ username: req.body.username });

  if (!userExist) {
    await User.updateOne(
      { email: req.body.email },
      { $set: { username: req.body.username } }
    )
    await User.findOne({ email: req.body.email })
      .then((user) => { res.json(user) })
      .catch((err) => {
        res.status(400).json('Error: ' + err);
      })
  } else {
    await User.findOne({ email: req.body.email })
      .then(() => { res.send('<script>alert("Username already exist!. Enter another username that is unique")</script>'); })
      .catch((err) => {
        res.status(400).json('Error: ' + err);
      })
  }
});

router.patch('/resetpassword', async (req, res) => {
  await User.updateOne(
    { email: req.body.email },
    { $set: { password: req.body.password } }
  )
  await User.findOne({ email: req.body.email })
    .then((user) => { res.json(user) })
    .catch((err) => { res.status(400).json('Error: ' + err) })
});


// Bookmarks
router.get('/getbookmark/:id', async (req, res) => {
  await User.findById(req.params.id)
    .then((user) => { res.json(user.bookmarks) })
    .catch((err) => { res.status(400).json('Error: ' + err) })
});

router.patch('/bookmark', async (req, res) => {
  await User.updateOne(
    { email: req.body.email },
    { $addToSet: { bookmarks: req.body.bookmark } }
  )
    .then((user) => { res.json(user) })
    .catch((err) => { res.status(400).json('Error: ' + err) })
});

router.delete('/bookmark/:id', async (req, res) => {
  await User.updateOne(
    { id: req.params.id },
    { $pull: { bookmarks: req.body.bookmark } }
  )
    .then((user) => { res.json(user) })
    .catch((err) => { res.status(400).json('Error: ' + err) })
});


// Hearts
router.get('/getheart/:id', async (req, res) => {
  await User.findById(req.params.id)
    .then((user) => { res.json({ heart: user.heart, totalheart: user.totalheart }) })
    .catch((err) => { res.status(400).json('Error: ' + err) })
});

router.patch('/heart', async (req, res) => {
  await User.updateOne(
    { email: req.body.email },
    { $set: { heart: req.body.heart, totalheart: req.body.totalheart } }
  )
  await User.findOne({ email: req.body.email })
    .then((user) => { res.json(user) })
    .catch((err) => { res.status(400).json('Error: ' + err) })
});

router.patch('/donate/:id', async (req, res) => {
  await User.updateOne(
    { email: req.body.email },
    { $dec: { heart: req.body.heart } }
  )
  await Charity.updateOne(
    { id: req.params.id },
    { $inc: { heart: req.body.heart } }
  )
  await User.findOne({ email: req.body.email })
    .then((user) => { res.json(user) })
    .catch((err) => { res.status(400).json('Error: ' + err) })
});

router.patch('/referral', async (req, res) => {
  const isReferred = await User.findOne({ username: req.body.username });

  if (!isReferred.referral) {
    await User.updateOne(
      { username: req.body.username },
      { $inc: { heart: 350, totalheart: 350, numberOfReferred: 1 } }
    )
    await User.updateOne(
      { email: req.body.email },
      { $set: { referral: true } }
    )
    await User.findOne({ email: req.body.email })
      .then((user) => { res.json(user) })
      .catch((err) => { res.status(400).json('Error: ' + err) })
  } else {
    await User.findOne({ email: req.body.email })
      .then((user) => { res.json(user) })
      .catch(() => { res.status(400).json('Error: ' + err) })
  }
});

export default router