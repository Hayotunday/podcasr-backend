import express from "express";

import User from "../models/user.js";
import Guest from "../models/guest.js";
import Podcaster from "../models/podcaster.js";
import Press from "../models/press.js";

import { verifyJwt } from "../middleware/verifyjwt.js";
import { mailer } from "../middleware/verifymail.js";

const router = express.Router();

// all routes in here are starting with /users

// User
router.get('/', async (req, res) => {
  await User.find()
    .then((users) => {
      return res.status(200).json({ users })
    })
    .catch((err) => { res.status(400).json('Error: ' + err) })
});

router.get('/profile', verifyJwt, async (req, res) => {
  await User.findOne({ email: req.user })
    .then((users) => {
      return res.status(200).json({ user: users })
    })
    .catch((err) => { res.status(400).json('Error: ' + err) })
});

router.get('/:id', async (req, res) => {
  await User.findById(req.params.id)
    .then((users) => {
      const new_user = { ...users, refresh_token: "" }
      res.json(new_user)
    })
    .catch((err) => { res.status(400).json('Error: ' + err) })
});

router.delete('/:id', verifyJwt, async (req, res) => {
  await User.findByIdAndDelete(req.params.id)
    .then(() => { res.json('User deleted!') })
    .catch((err) => { res.status(400).json('Error: ' + err) })
});


// PROFILE TYPE ROUTES
router.get('/profile-type', async (req, res) => {
  await User.find()
    .then((users) => {
      const new_user = { ...users, user: { ...users.user, refresh_token: "" } }
      res.json(new_user)
    })
    .catch((err) => { res.status(400).json('Error: ' + err) })
});

router.get('/profile-type/my-profile', verifyJwt, async (req, res) => {

  try {
    const userFound = await User.findOne({ email: req.user })
    if (userFound.profile_type === "Podcaster") {
      await Podcaster.findOne({ user: userFound._id })
        .then((users) => {
          users.user = userFound
          return res.status(200).json(users)
        })
        .catch((err) => { res.status(400).json('Error: ' + err) })
    } else if (userFound.profile_type === "Guest") {
      await Guest.findOne({ user: userFound._id })
        .then((users) => {
          users.user = userFound
          return res.status(200).json(users)
        })
        .catch((err) => { res.status(400).json('Error: ' + err) })
    } else if (userFound.profile_type === "Press") {
      await Press.findOne({ user: userFound._id })
        .then((users) => {
          users.user = userFound
          return res.status(200).json(users)
        })
        .catch((err) => { res.status(400).json('Error: ' + err) })
    }
  } catch (error) {
    return res.sendStatus(500)
  }

});

router.get('/profile-type/:id', async (req, res) => {
  await User.findOne({ email: req.body.email })
    .then((users) => {
      const new_user = { ...users, user: { ...users.user, refresh_token: "" } }
      res.json(new_user)
    })
    .catch((err) => { res.status(400).json('Error: ' + err) })
});

router.patch('/profile-type', verifyJwt, async (req, res) => {
  const { profile_type } = req.body

  await User.updateOne(
    { email: req.user },
    { $set: { profile_type: profile_type } }
  )
  await User.findOne({ email: req.user })
    .then((user) => { res.status(200).json({ profile_type: user.profile_type }) })
    .catch((err) => { res.status(400).json('Error: ' + err) })
});

router.post('/profile-type/add', verifyJwt, async (req, res) => {
  const { profile_type } = req.body

  try {
    const userFound = await User.findOne({ email: req.user })

    if (!userFound) return res.status(403).json({ message: "User not found. Please sign up!" })
    if (userFound.createdProfile === true) return res.status(401).json({ message: "Profile already exists" })

    if (profile_type === "Podcaster") {
      const newProfile = new Podcaster({
        podcast_name: req.body.podcast_name,
        user: req.body.user,
        topic_categories: req.body.topic_categories,
        podcast_link: req.body.podcast_link,
        bio: req.body.bio,
        highlights: req.body.highlights,
        social_media: req.body.social_media,
        transmission_date: req.body.transmission_date,
        guest_bio: req.body.guest_bio,
        booking_details: req.body.booking_details,
        episode_links: req.body.episode_links,
        record_preference: req.body.record_preference,
        promo_expect: req.body.promo_expect,
        need_guest: req.body.need_guest
      });

      await newProfile.save()
        .then(async (profile) => { await User.findByIdAndUpdate({ _id: req.body.user }, { $set: { createdProfile: true } }); return res.status(201).json(profile) })
        .catch((err) => { return res.status(400).json('Error: ' + err) })
    } else if (profile_type === "Guest") {
      const newProfile = new Guest({
        user: req.body.user,
        category: req.body.category,
        short_bio: req.body.short_bio,
        mission: req.body.mission,
        experience_bio: req.body.experience_bio,
        social_media: req.body.social_media,
        interview_link: req.body.interview_link,
        record_preference: req.body.record_preference,
        own_podcast: req.body.own_podcast,
        promo_expect: false,
      });

      await newProfile.save()
        .then(async (profile) => { await User.findByIdAndUpdate({ _id: req.body.user }, { $set: { createdProfile: true } }); return res.status(201).json(profile) })
        .catch((err) => { return res.status(400).json('Error: ' + err) })
    } else if (profile_type === "Press") {
      const newProfile = new Press({
        user: req.body.user,
        short_bio: req.body.short_bio,
        experience: req.body.experience,
        social_media: req.body.social_media,
        interview_links: req.body.interview_links,
        own_podcast: req.body.own_podcast,
        contact_me: req.body.contact_me,
        podcast_alert: req.body.podcast_alert
      });

      await newProfile.save()
        .then(async (profile) => { await User.findByIdAndUpdate({ _id: req.body.user }, { $set: { createdProfile: true } }); return res.status(201).json(profile) })
        .catch((err) => { return res.status(400).json('Error: ' + err) })
    }
  } catch (error) {
    return res.sendStatus(500)
  }
});


// PASSWORD
router.patch('/password', verifyJwt, async (req, res) => {
  await User.updateOne(
    { email: req.user },
    { $set: { password: req.body.password } }
  )
  await User.findOne({ email: req.body.email })
    .then((user) => { res.json(user) })
    .catch((err) => { res.status(400).json('Error: ' + err) })
});

export default router