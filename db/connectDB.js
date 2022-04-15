import mongoose from "mongoose";

export const connectDB = () => {
  // const URI = "mongodb://localhost:27017/app";
  const URI = process.env.MONGO_URI;
  mongoose
    .connect(URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((error) => console.log(error.message));
};
