import mongoose, { Schema, model, models } from "mongoose";

const FeedbackSchema = new Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required!'],
  },
  to: {
    type: String,
    required: [true, 'receiver is required!'],
  },
  content: {
    type: String,
    require: [true, 'feedback content is required!'],
  }
}, {
  timestamps: true
})

const Feedback = models.Feedback || model("Feedback", FeedbackSchema);

export default Feedback