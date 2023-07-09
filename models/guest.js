import mongoose, { Schema, model } from "mongoose";

const GuestSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    require: [true, 'user is required!'],
  },
  category: {
    type: Array,
  },
  short_bio: {
    type: String,
  },
  mission: {
    type: String,
  },
  experience_bio: {
    type: String,
  },
  social_media: {
    type: Object,
  },
  interview_link: {
    type: String,
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

const Guest = mongoose.models.Guest || model("Guest", GuestSchema);

export default Guest