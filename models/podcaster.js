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
    type: Object,
  },
  transmission_date: {
    type: [Date],
  },
  guest_bio: {
    type: String,
  },
  booking_details: {
    type: Array,
  },
  episode_links: {
    type: Array,
  },
  record_preference: {
    type: Array,
  },
  promo_expect: {
    type: Boolean
  },
  need_guest: {
    type: Boolean
  }
})

const Podcaster = mongoose.models.Podcaster || model("Podcaster", PodcasterSchema);

export default Podcaster