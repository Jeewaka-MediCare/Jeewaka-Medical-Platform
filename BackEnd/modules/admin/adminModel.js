import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },

    email: { type: String, unique: true },
    uuid: { type: String, required: true, unique: true },
});

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;
