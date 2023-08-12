import mongoose, { Schema, model } from "mongoose";

const ExtraSchema = new Schema({
  email: {
    type: String,
    unique: [true, 'Email already exists!'],
    required: [true, 'Email is required!']
  },
  name: {
    type: String,
    require: [true, 'name is required!'],
    minLength: 3,
    trim: true
  },
  password: {
    type: String,
    require: [true, 'password is required!'],
    trim: true
  },
  info: {
    type: Object,
    default: {
      age: "",
      gender: "",
      country: "",
      city: "",
      language: ""
    }
  },
  email_verified: {
    type: Boolean,
    require: [true, 'Email_verified is required!'],
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  image: {
    type: String,
  },
  profile_type: {
    type: String,
  },
  createdProfile: {
    type: Boolean,
  },
  saved_list: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  recent: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }]
}, {
  timestamps: true
})

const Extra = mongoose.models.Extra || model("Extra", ExtraSchema);

export default Extra