import express from "express";
import multer from 'multer'
import path from "path";

import User from "../models/user.js";
import Guest from "../models/guest.js";
import Podcaster from "../models/podcaster.js";
import Press from "../models/press.js";

import { confirmJwt } from "../middleware/confirmjwt.js";
import { mailer } from "../middleware/verifymail.js";

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "public/Images")
  },
  filename: (req, file, callback) => {
    callback(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage
})

const router = express.Router();

// all routes in here are starting with /users

// User
router.get('/', async (req, res) => {
  try {
    await User.find()
      .then((users) => {
        return res.status(200).json({ users })
      })
      .catch((err) => { return res.status(400).json('Error: ' + err) })
  } catch (error) {
    return res.sendStatus(500)
  }
});

router.get('/profile', confirmJwt, async (req, res) => {
  try {
    await User.findOne({ email: req.user })
      .then((users) => {
        return res.status(200).json({ user: users })
      })
      .catch((err) => { return res.status(400).json('Error: ' + err) })
  } catch (error) {
    return res.sendStatus(500)
  }
});

router.get('/profile/recents', confirmJwt, async (req, res) => {
  try {
    await User.findOne({ email: req.user }).populate({
      path: 'recent',
      select:
        'email name email_verified image profile_type',
    })
      .then((rec) => { res.status(200).json(rec.recent) })
      .catch((err) => { console.log(err); res.status(400).json(err) })
  } catch (error) {
    return res.sendStatus(500)
  }
});

router.get('/profile/favorites', confirmJwt, async (req, res) => {
  try {
    await User.findOne({ email: req.user }).populate({
      path: 'saved_list',
      select:
        'email name email_verified image profile_type',
    })
      .then((rec) => { res.status(200).json(rec.saved_list) })
      .catch((err) => { console.log(err); res.status(400).json(err) })
  } catch (error) {
    return res.sendStatus(500)
  }
});

router.get('/profiles', async (req, res) => {
  try {

    const guests = await Guest.find().populate('user')
    const podcasters = await Podcaster.find().populate('user')
    const presses = await Press.find().populate('user')

    const profiles = [...guests, ...podcasters, ...presses]

    return res.status(200).json(profiles)
  } catch (error) {
    return res.sendStatus(500)
  }
});


router.get('/profile-type/my-profile', confirmJwt, async (req, res) => {
  try {
    const userFound = await User.findOne({ email: req.user })

    if (userFound.profile_type === "Podcaster") {
      await Podcaster.findOne({ user: userFound._id }).populate('user')
        .then((users) => {
          return res.status(200).json(users)
        })
        .catch((err) => { return res.status(400).json('Error: ' + err) })
    } else if (userFound.profile_type === "Guest") {
      await Guest.findOne({ user: userFound._id }).populate('user')
        .then((users) => {
          return res.status(200).json(users)
        })
        .catch((err) => { return res.status(400).json('Error: ' + err) })
    } else if (userFound.profile_type === "Press") {
      await Press.findOne({ user: userFound._id }).populate('user')
        .then((users) => {
          return res.status(200).json(users)
        })
        .catch((err) => { return res.status(400).json('Error: ' + err) })
    }
  } catch (error) {
    return res.sendStatus(500)
  }
});

router.get('/profile-type/:id', async (req, res) => {
  try {
    const userFound = await User.findById(req.params.id)

    if (userFound.profile_type === "Podcaster") {
      await Podcaster.findOne({ user: userFound._id }).populate('user')
        .then((users) => {
          return res.status(200).json(users)
        })
        .catch((err) => { return res.status(400).json('Error: ' + err) })
    } else if (userFound.profile_type === "Guest") {
      await Guest.findOne({ user: userFound._id }).populate('user')
        .then((users) => {
          return res.status(200).json(users)
        })
        .catch((err) => { return res.status(400).json('Error: ' + err) })
    } else if (userFound.profile_type === "Press") {
      await Press.findOne({ user: userFound._id }).populate('user')
        .then((users) => {
          return res.status(200).json(users)
        })
        .catch((err) => { return res.status(400).json('Error: ' + err) })
    }
  } catch (error) {
    return res.sendStatus(500)
  }
});

router.get('/:id', async (req, res) => {
  try {
    await User.findById(req.params.id)
      .then((users) => {
        const new_user = { ...users, refresh_token: "" }
        return res.json(new_user)
      })
      .catch((err) => { return res.status(400).json('Error: ' + err) })
  } catch (error) {
    return res.sendStatus(500)
  }
});



// POST ROUTES
router.post('/profile-type/add', confirmJwt, async (req, res) => {
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
        .then(async (profile) => {
          await User.findByIdAndUpdate(
            { _id: req.body.user },
            { $set: { createdProfile: true } }
          );
          return res.status(201).json(profile)
        })
        .catch((err) => { return res.status(400).json('Error: ' + err) })
    } else if (profile_type === "Guest") {
      const newProfile = new Guest({
        user: req.body.user,
        topic_categories: req.body.category,
        short_bio: req.body.short_bio,
        mission: req.body.mission,
        experience_bio: req.body.experience_bio,
        social_media: req.body.social_media,
        interview_links: req.body.interview_link,
        record_preference: req.body.record_preference,
        own_podcast: req.body.own_podcast,
        promo_expect: false,
      });
      rs
      await newProfile.save()
        .then(async (profile) => {
          await User.findByIdAndUpdate(
            { _id: req.body.user },
            { $set: { createdProfile: true } }
          );
          return res.status(201).json(profile)
        })
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
        .then(async (profile) => {
          await User.findByIdAndUpdate(
            { _id: req.body.user },
            { $set: { createdProfile: true } }
          );
          return res.status(201).json(profile)
        })
        .catch((err) => { return res.status(400).json(err) })
    }
  } catch (error) {
    return res.status(500).json("error: ", error)
  }
});

// PATCH ROUTES
router.patch('/profile-type', confirmJwt, async (req, res) => {
  const { profile_type } = req.body

  try {
    await User.updateOne(
      { email: req.user },
      { $set: { profile_type: profile_type } }
    )
    await User.findOne({ email: req.user })
      .then((user) => { return res.status(200).json({ profile_type: user.profile_type }) })
      .catch((err) => { return res.status(400).json('Error: ' + err) })
  } catch (error) {
    return res.sendStatus(500)
  }
});

router.patch('/profile-type/edit', confirmJwt, async (req, res) => {
  const { profile_type } = req.body

  try {
    const userFound = await User.findOne({ email: req.user })

    if (!userFound) return res.status(403).json({ message: "User not found. Please sign up!" })
    // if (userFound.createdProfile === false) return res.status(401).json({ message: "Profile already exists" })

    if (profile_type === "Podcaster") {
      Podcaster.updateOne({ user: userFound._id }, {
        $set: {
          podcast_name: req.body.podcast_name,
          user: req.body.user,
          podcast_link: req.body.podcast_link,
          bio: req.body.bio,
          highlights: req.body.highlights,
          social_media: req.body.social_media,
          guest_bio: req.body.guest_bio,
          booking_details: req.body.booking_details,
          episode_links: req.body.episode_links,
          record_preference: req.body.record_preference,
          promo_expect: req.body.promo_expect,
          need_guest: req.body.need_guest
        }
      })
        .then((profile) => {
          return res.status(201).json(profile)
        })
        .catch((err) => { return res.status(400).json('Error: ' + err) })
    } else if (profile_type === "Guest") {
      Guest.updateOne({ user: userFound._id }, {
        $set: {
          user: req.body.user,
          short_bio: req.body.short_bio,
          mission: req.body.mission,
          experience_bio: req.body.experience_bio,
          social_media: req.body.social_media,
          interview_links: req.body.interview_link,
          record_preference: req.body.record_preference,
          own_podcast: req.body.own_podcast,
          promo_expect: false,
        }
      })
        .then((profile) => {
          return res.status(201).json(profile)
        })
        .catch((err) => { return res.status(400).json('Error: ' + err) })
    } else if (profile_type === "Press") {
      Press.updateOne({ user: userFound._id }, {
        $set: {
          user: req.body.user,
          short_bio: req.body.short_bio,
          experience: req.body.experience,
          social_media: req.body.social_media,
          interview_links: req.body.interview_links,
          own_podcast: req.body.own_podcast,
          contact_me: req.body.contact_me,
          podcast_alert: req.body.podcast_alert
        }
      })
        .then((profile) => {
          return res.status(201).json(profile)
        })
        .catch((err) => { return res.status(400).json('Error: ' + err) })
    }
  } catch (error) {
    return res.sendStatus(500)
  }
});

router.patch('/profile-type/image', confirmJwt, upload.single('image'), async (req, res) => {
  try {
    const userFound = await User.findOne({ email: req.user })

    if (!userFound) return res.status(403).json({ message: "User not found. Please register!" })

    await User.updateOne(
      { email: req.user },
      { image: req.file.filename }
    )
      .then(() => {
        return res.status(200).json(res)
      })
      .catch((err) => { return res.status(400).json('Error: ' + err) })
  } catch (error) {
    return res.sendStatus(500)
  }
});

router.patch('/profile-type/recents', confirmJwt, async (req, res) => {
  try {
    const userFound = await User.findOne({ email: req.user })

    if (!userFound) return res.status(403).json({ message: "User not found. Please register!" })

    await User.updateOne(
      { email: req.user },
      { $set: { recent: req.body.data } }
    )
      .then(() => {
        return res.status(200)
      })
      .catch((err) => { return res.status(400).json('Error: ' + err) })
  } catch (error) {
    return res.sendStatus(500)
  }
});

router.patch('/profile-type/favorites', confirmJwt, async (req, res) => {
  try {
    const userFound = await User.findOne({ email: req.user })

    if (!userFound) return res.status(403).json({ message: "User not found. Please register!" })

    await User.updateOne(
      { email: req.user },
      { $set: { saved_list: req.body.data } }
    )
      .then(() => {
        return res.status(200)
      })
      .catch((err) => { return res.status(400).json('Error: ' + err) })
  } catch (error) {
    return res.sendStatus(500)
  }
});

router.patch('/profile-type/category', confirmJwt, async (req, res) => {
  try {
    const userFound = await User.findOne({ email: req.user })

    if (!userFound) return res.status(403).json({ message: "User not found. Please register!" })

    if (userFound.profile_type === "Podcaster") {
      await Podcaster.updateOne(
        { user: userFound._id },
        { $set: { topic_categories: req.body.category } }
      )
        .then((users) => {
          return res.status(200)
        })
        .catch((err) => { return res.status(400).json('Error: ' + err) })
    } else if (userFound.profile_type === "Guest") {
      await Guest.updateOne(
        { user: userFound._id },
        { topic_categories: req.body.category }
      )
        .then((users) => {
          return res.status(200)
        })
        .catch((err) => { return res.status(400).json('Error: ' + err) })
    }
  } catch (error) {
    return res.sendStatus(500)
  }
});


// DELETE ROUTES
router.delete('/:id', confirmJwt, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id)
      .then(() => { return res.json('User deleted!') })
      .catch((err) => { return res.status(400).json('Error: ' + err) })
  } catch (error) {
    return res.sendStatus(500)
  }
});

export default router