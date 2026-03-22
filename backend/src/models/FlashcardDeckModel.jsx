const mongoose = require("mongoose");

const { Schema } = mongoose;

const flashcardSchema = new Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const flashcardDeckSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    cards: {
      type: [flashcardSchema],
      default: [],
    },
    isAiGenerated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FlashcardDeck", flashcardDeckSchema);

