const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    default: 0
  },
  stock: {
    type: Number,
    default: 0
  },
  image: {
    type: String,
    required: true
  }
  ,
  isNewArrival: {
    type: Boolean,
    default: false
  },
  isOnSale: {
    type: Boolean,
    default: false
  },
  salePrice: {
    type: Number,
    default: null
  }
});

module.exports = mongoose.model("Product", productSchema);
