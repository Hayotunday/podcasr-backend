import dotenv from 'dotenv'
dotenv.config();
import express from "express";
import multer from 'multer'
import { ObjectId } from 'mongodb'
// import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

import User from "../models/user.js";
import Guest from "../models/guest.js";
import Podcaster from "../models/podcaster.js";
import Press from "../models/press.js";

import { confirmJwt } from "../middleware/confirmjwt.js";
import { mailer } from "../middleware/verifymail.js";

const router = express.Router();

const storage = multer.memoryStorage()

const upload = multer({
  storage: storage
})

// const randomImageName = () => {
//   return crypto.randomBytes(32).toString('hex')
// }

// const bucketName = process.env.BUCKET_NAME
// const bucketRegion = process.env.BUCKET_REGION
// const bucketAccessKey = process.env.BUCKET_ACCESS_KEY
// const bucketSecretKey = process.env.BUCKET_SECRET_ACCESS_KEY

// const s3 = new S3Client({
//   credentials: {
//     accessKeyId: bucketAccessKey,
//     secretAccessKey: bucketSecretKey
//   },
//   region: bucketRegion
// })

// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
// const client = new S3Client(clientParams);
// const command = new GetObjectCommand(getObjectParams);
// const url = await getSignedUrl(client, command, { expiresIn: 3600 });

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

router.get('/location', async (req, res) => {
  try {
    await User.find()
      .then((users) => {
        const loc = [{ option: "" }]
        for (let i = 0; i < users.length; i++) {
          if (users[i].info.city !== "") {
            loc.push({ option: users[i].info.city })
          }
        }
        let compare = (a, b) => {
          if (a.option < b.option) {
            return -1;
          }
          if (a.option > b.option) {
            return 1;
          }
          return 0;
        };
        function removeDuplicates(arr) {
          // Declare a new array
          let newArray = [];
          // Declare an empty object
          let uniqueObject = {};
          let objOption = "";

          // Loop for the array elements
          for (let i in arr) {
            // Extract the title
            objOption = arr[i]['option'];
            // Use the Option as the index
            uniqueObject[objOption] = arr[i];
          }

          // Loop to push unique object into array
          for (let i in uniqueObject) {
            newArray.push(uniqueObject[i]);
          }

          return newArray;
        }

        const locat = loc.sort(compare)
        const locations = removeDuplicates(locat)

        return res.status(200).json({ locations })
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
    return res.status(500).json("server error")
  }
});

router.get('/profile/recents', confirmJwt, async (req, res) => {
  try {
    await User.findOne({ email: req.user }).populate({
      path: 'recent',
      select:
        'email name email_verified image profile_type',
    })
      .then((result) => { res.status(200).json(result.recent) })
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
  const { category, location, topic } = req.query
  const { id } = req.body

  try {
    let profiles = []
    let prof = []
    if (category === "all") {

      if (topic === "") {
        const guests = await Guest.find({ user: { $ne: id } }).populate('user')
        const podcasters = await Podcaster.find({ user: { $ne: id } }).populate('user')
        // presses = await Press.find().populate('user')

        prof = [...guests, ...podcasters]
        // profiles = [...prof]
      } else {
        const guests = await Guest.find({ user: { $ne: id }, topic_categories: topic }).populate('user')
        const podcasters = await Podcaster.find({ user: { $ne: id }, topic_categories: topic }).populate('user')
        // presses = await Press.find().populate('user')

        prof = [...guests, ...podcasters]
        // profiles = [...prof]
      }

      profiles = location === "" ? [...prof] : prof.filter((i) => {
        const locate = location.toLowerCase()
        const userLocation = i.user.info.city.toLowerCase()
        return userLocation === locate
      })
      // console.log(profiles)
    } else if (category === 'podcaster') {
      let podcasters
      if (topic === "") {
        podcasters = await Podcaster.find({ user: { $ne: id } }).populate('user')
      } else {
        podcasters = await Podcaster.find({ user: { $ne: id }, topic_categories: topic }).populate('user')
      }

      profiles = location === "" ? [...podcasters] : podcasters.filter((i) => {
        const str = i.user.info.city.toLowerCase()
        return str === location.toLowerCase()
      })
    } else if (category === 'guest') {
      let guests
      if (topic === "") {
        guests = await Guest.find({ user: { $ne: id } }).populate('user')
      } else {
        guests = await Guest.find({ user: { $ne: id }, topic_categories: topic }).populate('user')
      }

      profiles = location === "" ? [...guests] : guests.filter((i) => {
        return i.user.info.city.toLowerCase() === location.toLowerCase()
      })
    }

    // console.log(profiles)
    return res.status(200).json(profiles)
  } catch (error) {
    return res.status(500).json(error)
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
router.post('/send-mail', confirmJwt, async (req, res) => {
  const { email, text, sender } = req.body

  const response = await User.findOne({ email: email })

  try {
    const subject = `Mail from ${response.name} from Podcast-Expert`
    const message = `<div style="">
                      <P>
                        ${text} 
                      </P>
                    </div>`
    mailer(email, subject, message, sender)
    return res.sendStatus(200)
  } catch (error) {
    return res.sendStatus(500)
  }
});

router.post('/profile-type/add', confirmJwt, async (req, res) => {
  const { profile_type } = req.body

  try {
    const userFound = await User.findOne({ email: req.user })

    if (!userFound) return res.status(403).json({ message: "User not found. Please sign up!" })
    if (userFound.createdProfile === true) return res.status(401).json({ message: "Profile already exists" })

    if (profile_type === "Podcaster") {
      const newProfile = new Podcaster({
        user: req.body.user,
        podcast_name: req.body.podcast_name,
        topic_categories: req.body.topic_categories,
        url: req.body.url,
        bio: req.body.bio,
        highlights: req.body.highlights,
        social_media: req.body.social_media,
        next_transmission: req.body.next_transmission,
        headline: req.body.headline,
        interviews: req.body.interview,
        record_preference: req.body.record_preference,
        recording: req.body.recording,
        contact_me: req.body.contact_me,
      });

      await newProfile.save()
        .then(async (profile) => {
          await User.findByIdAndUpdate(
            { _id: req.body.user },
            { $set: { createdProfile: true, info: req.body.info } }
          );
          return res.status(201).json(profile)
        })
        .catch((err) => { return res.status(400).json('Error: ' + err) })
    } else if (profile_type === "Guest") {
      const newProfile = new Guest({
        user: req.body.user,
        topic_categories: req.body.topic_categories,
        short_bio: req.body.short_bio,
        mission: req.body.mission,
        headline: req.body.headline,
        social_media: req.body.social_media,
        interview_links: req.body.interview_links,
        record_preference: req.body.record_preference,
        own_podcast: req.body.own_podcast,
      });
      await newProfile.save()
        .then(async (profile) => {
          await User.findByIdAndUpdate(
            { _id: req.body.user },
            { $set: { createdProfile: true, info: req.body.info } }
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
            { $set: { createdProfile: true, info: req.body.info } }
          );
          return res.status(201).json(profile)
        })
        .catch((err) => { return res.status(400).json(err) })
    }
  } catch (error) {
    return res.sendStatus(500)
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
          podcast_name: req.body.name,
          topic_categories: req.body.topic_categories,
          url: req.body.url,
          bio: req.body.bio,
          highlights: req.body.highlights,
          social_media: req.body.social_media,
          next_transmission: req.body.next_transmission,
          headline: req.body.headline,
          interviews: req.body.interview,
          record_preference: req.body.record_preference,
          recording: req.body.recording,
          contact_me: req.body.contact_me,
        }
      })
        .then(async (profile) => {
          await User.findByIdAndUpdate(
            { _id: req.body.user },
            { $set: { info: req.body.info } }
          );
          return res.status(201).json(profile)
        })
        .catch((err) => { return res.status(400).json('Error: ' + err) })
    } else if (profile_type === "Guest") {
      Guest.updateOne({ user: userFound._id }, {
        $set: {
          topic_categories: req.body.topic_categories,
          short_bio: req.body.short_bio,
          mission: req.body.mission,
          headline: req.body.headline,
          social_media: req.body.social_media,
          interview_links: req.body.interview_links,
          record_preference: req.body.record_preference,
          own_podcast: req.body.own_podcast,
        }
      })
        .then(async (profile) => {
          await User.findByIdAndUpdate(
            { _id: req.body.user },
            { $set: { info: req.body.info } }
          );
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

router.patch('/profile-type/image', confirmJwt, async (req, res) => {
  try {
    const userFound = await User.findOne({ email: req.user })

    if (!userFound) return res.status(403).json({ message: "User not found. Please register!" })

    const imageName = req.body.image;

    await User.updateOne(
      { email: req.user },
      { image: imageName }
    )
      .then((resp) => {
        return res.status(200).json({ "image": imageName })
      })
      .catch((err) => { return res.status(400).json('Error: ' + err) })
  } catch (error) {
    return res.status(500).json(error)
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
      { $push: { saved_list: req.body.data } }
    )
      .then(() => {
        return res.status(200)
      })
      .catch((err) => { return res.status(400).json('Error: ' + err) })
  } catch (error) {
    return res.sendStatus(500)
  }
});

router.patch('/profile-type/unfavorites', confirmJwt, async (req, res) => {
  try {
    const userFound = await User.findOne({ email: req.user })

    if (!userFound) return res.status(403).json({ message: "User not found. Please register!" })

    // const id = ObjectId(req.body.data)
    await User.updateOne(
      { email: req.user },
      { $pull: { saved_list: req.body.data } }
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
    const userFound = await User.findById(req.params.id)

    if (userFound.profile_type === "Podcaster") {
      await User.findByIdAndDelete(req.params.id)
      await Podcaster.deleteOne({ user: userFound._id })
        .then(() => { return res.status(200).json('User deleted!') })
        .catch((err) => { return res.status(400).json('Error: ' + err) })
    } else if (userFound.profile_type === "Guest") {
      await User.findByIdAndDelete(req.params.id)
      await Guest.deleteOne({ user: userFound._id })
        .then(() => { return res.status(200).json('User deleted!') })
        .catch((err) => { return res.status(400).json('Error: ' + err) })
    } else if (userFound.profile_type === "Press") {
      await User.findByIdAndDelete(req.params.id)
      await Press.deleteOne({ user: userFound._id })
        .then(() => { return res.status(200).json('User deleted!') })
        .catch((err) => { return res.status(400).json('Error: ' + err) })
    }
  } catch (error) {
    return res.sendStatus(500)
  }
});

export default router