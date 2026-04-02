import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  category: { type: String },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  due: { type: Date },
  done: { type: Boolean, default: false },
}, {
  timestamps: true,
});

export default mongoose.model('Task', TaskSchema);
