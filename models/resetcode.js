import mongoose, { Schema, model } from "mongoose";

const ResetCodeSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    require: [true, 'user is required!'],
  },
  reset_code: {
    type: String,
    require: [true, 'ResetCode is required!'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    expires: 3600 // expires in 1 hour
  }
})

const ResetCode = mongoose.models.ResetCode || model("ResetCode", ResetCodeSchema);

export default ResetCode