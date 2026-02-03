import mongoose, { Schema, Model } from 'mongoose';

export interface IUser {
  _id: string;
  email: string;
  password: string;
  name: string;
  bio?: string;
  banner?: string;
  avatar?: string;
  apiKey?: string; // Encrypted API key
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  bio: {
    type: String,
    default: '',
  },
  banner: {
    type: String,
    default: '',
  },
  avatar: {
    type: String,
    default: '',
  },
  apiKey: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Force recompilation in dev to ensure new fields (bio, banner) are picked up
// This is necessary because Mongoose caches models and doesn't update them on hot reload
if (process.env.NODE_ENV === 'development' && mongoose.models.User) {
  delete mongoose.models.User;
}

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
