import mongoose, { Schema, model } from "mongoose";

const PressSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    require: [true, 'user is required!'],
  },
  short_bio: {
    type: String,
  },
  experience: {
    type: String,
  },
  social_media: {
    type: Object,
  },
  interview_links: {
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

const Press = mongoose.models.Press || model("Press", PressSchema);

export default Press