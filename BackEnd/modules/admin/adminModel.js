import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },

    email: { type: String, unique: true },
    uuid: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;
