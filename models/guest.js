import mongoose, { Schema, model, models } from "mongoose";

const GuestSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    require: [true, 'user is required!'],
  },
  category: {
    type: String,
  },
  podcast_link: {
    type: String,
  },
  bio: {
    type: String,
  },
  highlights: {
    type: Array,
  },
  social_media: {
    type: Array,
  },
  transmission_time: {
    type: Array,
  },
  guest_bio: {
    type: Array,
  },
  record_preference: {
    type: Array,
  },
  own_podcast: {
    type: Boolean
  },
  contact_me: {
    type: Boolean
  },
  podcast_alert: {
    type: Boolean
  }
})

const Guest = models.Guest || model("Guest", GuestSchema);

export default Guest