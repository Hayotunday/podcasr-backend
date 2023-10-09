import mongoose, { Schema, model } from "mongoose";

const FeaturedSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, {
  timestamps: true
})

const Featured = mongoose.models.Featured || model("Featured", FeaturedSchema);

export default Featured