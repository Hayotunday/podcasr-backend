import mongoose, { Schema, model } from "mongoose";

const GuestSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    require: [true, 'user is required!'],
  },
  topic_categories: {
    type: Array,
  },
  short_bio: {
    type: String,
  },
  mission: {
    type: String,
  },
  headline: {
    type: String,
  },
  social_media: {
    type: Object,
    default: {
      facebook: "",
      instagram: "",
      linkedin: "",
      twitter: "",
      youtube: ""
    }
  },
  interview_links: {
    type: Array,
  },
  record_preference: {
    type: Array,
  },
  own_podcast: {
    type: Boolean
  }
})

const Guest = mongoose.models.Guest || model("Guest", GuestSchema);

export default Guest