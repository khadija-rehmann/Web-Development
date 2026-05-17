const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const Product = require("../models/Product");

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
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
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

router.get("/", (req, res) => {
  res.redirect("/admin/dashboard");
});

router.get("/dashboard", async (req, res) => {
  try {
    const products = await Product.find().sort({ _id: -1 });
    res.render("admin/dashboard", { products });
  } catch (error) {
    res.status(500).send("Error loading admin dashboard: " + error.message);
  }
});

router.get("/products/new", (req, res) => {
  res.render("admin/new-product", {
    categories,
    error: null,
    product: {},
  });
});

router.post("/products", (req, res) => {
  upload.single("image")(req, res, async (uploadError) => {
    if (uploadError) {
      return renderProductForm(res, "admin/new-product", {
        error: uploadError.message,
        product: req.body,
      });
    }

    try {
      const productData = parseProductFields(req.body);

      if (!productData.name || !productData.category || !req.file) {
        return renderProductForm(res, "admin/new-product", {
          error: "Please fill in all fields and upload a valid image.",
          product: req.body,
        });
      }

      if (Number.isNaN(productData.price) || Number.isNaN(productData.rating) || Number.isNaN(productData.stock)) {
        return renderProductForm(res, "admin/new-product", {
          error: "Price, rating, and stock must be valid numbers.",
          product: req.body,
        });
      }

      const product = new Product({
        ...productData,
        image: `/uploads/${req.file.filename}`,
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
});

router.get("/products/edit/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

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
});

router.post("/products/update/:id", (req, res) => {
  upload.single("image")(req, res, async (uploadError) => {
    if (uploadError) {
      try {
        const existingProduct = await Product.findById(req.params.id);
        return renderProductForm(res, "admin/edit-product", {
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

      const productData = parseProductFields(req.body);

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

      if (req.file) {
        existingProduct.image = `/uploads/${req.file.filename}`;
      }

      await existingProduct.save();
      res.redirect("/admin/dashboard");
    } catch (error) {
      res.status(500).send("Error updating product: " + error.message);
    }
  });
});

router.post("/products/delete/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect("/admin/dashboard");
  } catch (error) {
    res.status(500).send("Error deleting product: " + error.message);
  }
});

module.exports = router;