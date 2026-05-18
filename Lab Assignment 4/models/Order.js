const mongoose = require('mongoose');

function generateOrderId() {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// Schema for each product item inside an order
const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String },
  price: { type: Number },
  image: { type: String },
  quantity: { type: Number }
}, { _id: false });

// Schema for customer orders
const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true, default: generateOrderId },

  // Which customer placed this order
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },

  deliveryAddress: {
    name: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    phone: { type: String, required: true },
    country: { type: String, required: true }
  },

  // List of ordered items
  items: [orderItemSchema],

  // Final total amount for this order
  totalPrice: { type: Number, required: true },

  // Current progress of this order
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },

  // Date when order was placed
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
