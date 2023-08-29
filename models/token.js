import mongoose, { Schema, model } from "mongoose";

const TokenSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    require: [true, 'user is required!'],
  },
  token: {
    type: String,
    require: [true, 'token is required!'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    expires: 3600 // expires in 1 Hour
  }
})

const Token = mongoose.models.Token || model("Token", TokenSchema);

export default Token