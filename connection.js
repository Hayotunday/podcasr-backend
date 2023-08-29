import mongoose from "mongoose";

let isConnected = false; // track the connection

export const connectToDB = async () => {
  mongoose.set('strictQuery', true);

  if (isConnected) {
    console.log('MONGODB IS ALREADY CONNECTED!');
    return true;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "podcastexpert",
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    isConnected = true;

    console.log("MONGODB CONNECTED")
    return true;
  } catch (error) {
    console.log(error)
    return false;
  }
}