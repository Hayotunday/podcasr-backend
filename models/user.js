import { Schema, model, models } from "mongoose";

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
  token: {
    type: String,
    require: [true, 'password is required!'],
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
  }
}, {
  timestamps: true
})

const User = models.User || model("User", UserSchema);

export default User