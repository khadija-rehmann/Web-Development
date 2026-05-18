const multer = require("multer");
const path = require("path");//It helps create safe folder paths
const Product = require("../models/Product");
const Order = require('../models/Order');


//This is a fixed list of product categories. It is sent to forms so admin can select category from dropdown.
const categories = [
  "Unstitched",
  "Ready to Wear",
  "Formals",
  "Co-ords",
  "Kurtis",
  "Men",
  "Girls",
  "Bags",
  "Footwear",
  "Fragrances",
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "public", "uploads"));
  },
  filename: (req, file, cb) => {
  cb(null, Date.now() + path.extname(file.originalname));
},
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error("Only jpg, jpeg, png, and webp image files are allowed."));
  },
});

//This helper is used when form has an error.
function renderProductForm(res, view, options) {
  return res.status(options.status || 400).render(view, {
    categories,
    error: options.error || null,
    product: options.product || {},
  });
}

function parseProductFields(body) {
  return {
    name: (body.name || "").trim(),
    price: Number(body.price),
    category: (body.category || "").trim(),
    rating: Number(body.rating),
    stock: Number(body.stock),
  };
}





exports.redirectToDashboard = (req, res) => {
  res.redirect("/admin/dashboard");
};


exports.dashboard = async (req, res) => {
  try {
    // Load products for the existing dashboard table
    const products = await Product.find().sort({ _id: -1 });// new products at top

    // Count all orders for summary box
    const totalOrders = await Order.countDocuments();

    // Count only pending orders for quick admin tracking
    const pendingOrders = await Order.countDocuments({ status: 'Pending' });

    res.render("admin/dashboard", {
      products,
      totalOrders,
      pendingOrders
    });
  } catch (error) {
    res.status(500).send("Error loading admin dashboard: " + error.message);
  }
};

//It opens an empty add product form
exports.newProductPage = (req, res) => {
  res.render("admin/new-product", { //show ejs file for add product form
    categories,
    error: null,
    product: {},
  });
};

//post data from add product form, validate and save to database, then redirect to dashboard
exports.createProduct = (req, res) => {
  console.log("=== NEW PRODUCT POST REQUEST ===");
  console.log("req.body:", req.body);

  upload.single("image")(req, res, async (uploadError) => {

    if (uploadError) {
      return renderProductForm(res, "admin/new-product", {
        error: uploadError.message 
      });
    }

    try {
      const productData = parseProductFields(req.body);// converts form values to correct types

      if (!productData.name || !productData.category || !req.file) {
        return renderProductForm(res, "admin/new-product", {
          error: "Please fill in all fields and upload a valid image.",
          product: req.body,//Keeps old entered values.
        });
      }

      if (Number.isNaN(productData.price) || Number.isNaN(productData.rating) || Number.isNaN(productData.stock)) { //no are valid?
        return renderProductForm(res, "admin/new-product", {
          error: "Price, rating, and stock must be valid numbers.",
          product: req.body,
        });
      }

      const product = new Product({
        ...productData, //It copies all properties from productData
        image: `/uploads/${req.file.filename}`,//uploaded file info
      });

 
      await product.save();

      res.redirect("/admin/dashboard");
    } catch (error) {
      renderProductForm(res, "admin/new-product", {
        error: error.message,
        product: req.body,
      });
    }
  });
};


exports.editProductPage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);//Gets ID from URL and finds product in database

    if (!product) {
      return res.status(404).send("Product not found");
    }

    res.render("admin/edit-product", {
      categories,
      error: null,
      product,
    });
  } catch (error) {
    res.status(500).send("Error loading product: " + error.message);
  }
};

exports.updateProduct = (req, res) => {
  upload.single("image")(req, res, async (uploadError) => {
    if (uploadError) {
      try {
        const existingProduct = await Product.findById(req.params.id);
        return renderProductForm(res, "admin/edit-product", { //Shows edit form again
          error: uploadError.message,
          product: existingProduct || req.body,
        });
      } catch (error) {
        return res.status(500).send("Error updating product: " + error.message);
      }
    }

    try {
      const existingProduct = await Product.findById(req.params.id);

      if (!existingProduct) {
        return res.status(404).send("Product not found");
      }

      const productData = parseProductFields(req.body);//proper values

      if (!productData.name || !productData.category) {
        return renderProductForm(res, "admin/edit-product", {
          error: "Please fill in all required fields.",
          product: existingProduct,
        });
      }

      if (Number.isNaN(productData.price) || Number.isNaN(productData.rating) || Number.isNaN(productData.stock)) {
        return renderProductForm(res, "admin/edit-product", {
          error: "Price, rating, and stock must be valid numbers.",
          product: existingProduct,
        });
      }

      existingProduct.name = productData.name;
      existingProduct.price = productData.price;
      existingProduct.category = productData.category;
      existingProduct.rating = productData.rating;
      existingProduct.stock = productData.stock;

      if (req.file) { //contains the uploaded file information
        existingProduct.image = `/uploads/${req.file.filename}`;
      }

      await existingProduct.save();
      res.redirect("/admin/dashboard");
    } catch (error) {
      res.status(500).send("Error updating product: " + error.message);
    }
  });
};

exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect("/admin/dashboard");
  } catch (error) {
    res.status(500).send("Error deleting product: " + error.message);
  }
};

exports.ordersPage = async (req, res) => {
  try {
    // Get all orders, newest first
    const orders = await Order.find().sort({ createdAt: -1 });
    res.render('admin/orders', { orders });
  } catch (error) {
    res.status(500).send('Error loading orders: ' + error.message);
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    // Get the new status selected in form
    const newStatus = req.body.status;//Contains submitted form data.
    // Update order status by order id
    await Order.findByIdAndUpdate(req.params.id, { status: newStatus });

    // Return to orders page
    res.redirect('/admin/orders');
  } catch (error) {
    res.status(500).send('Error updating order: ' + error.message);
  }
};