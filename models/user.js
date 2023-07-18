import mongoose, { Schema, model } from "mongoose";

const UserSchema = new Schema({
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
  refresh_token: {
    type: String,
    unique: true
  },
  email_verified: {
    type: Boolean,
    require: [true, 'Email_verified is required!'],
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
  saved_list: {
    type: Array,
  },
  recent: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: [true, 'must be unique']
  }]
}, {
  timestamps: true
})

const User = mongoose.models.User || model("User", UserSchema);

export default User