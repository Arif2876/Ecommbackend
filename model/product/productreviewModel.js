const mongoose = require("mongoose");

const productreviewSchema = new mongoose.Schema(
  {
    userid: {
      type: String,
      required: true,
    },
    productid: {
      type: String,
      require: true,
    },
    username: {
      type: String,
      require: true,
    },
    rating: {
      type: String,
      require: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
// model
const productreviewdb = new mongoose.model(
  "productsreviews",
  productreviewSchema
);
module.exports = productreviewdb;
