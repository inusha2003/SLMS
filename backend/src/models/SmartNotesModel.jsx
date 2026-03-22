const mongoose = require("mongoose");

const { Schema } = mongoose;

const smartNotesSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1 },
    content: { type: String, required: true }, // Markdown text
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isAiGenerated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SmartNotes", smartNotesSchema);

