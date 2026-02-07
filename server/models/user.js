import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  credits: { type: Number, default: 20 },
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  // Check if password already looks like a hash (bcrypt format) to avoid double-hashing
  if (
    (this.password && this.password.startsWith("$2a$")) ||
    this.password.startsWith("$2b$")
  ) {
    return; // Already hashed, skip
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const userModel = mongoose.model("User", userSchema);
export default userModel;
