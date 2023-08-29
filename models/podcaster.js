import mongoose, { Schema, model } from "mongoose";

const PodcasterSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    require: [true, 'user is required!'],
  },
  podcast_name: {
    type: String,
  },
  topic_categories: {
    type: Array,
  },
  url: {
    type: String,
  },
  bio: {
    type: String,
  },
  highlights: {
    type: Array,
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
  next_transmission: {
    type: Object,
  },
  headline: {
    type: String,
  },
  interviews: {
    type: Array,
  },
  record_preference: {
    type: Array,
  },
  recording: {
    type: Boolean
  },
  contact_me: {
    type: Boolean
  }
})

const Podcaster = mongoose.models.Podcaster || model("Podcaster", PodcasterSchema);

export default Podcaster