import mongoose, { Schema, model, models } from "mongoose";

const PodcasterSchema = new Schema({
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
  experience: {
    type: String,
  },
  mission: {
    type: String,
  },
  social_media: {
    type: Array,
  },
  interview_links: {
    type: Array,
  },
  booking_details: {
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

const Podcaster = models.Podcaster || model("Podcaster", PodcasterSchema);

export default Podcaster