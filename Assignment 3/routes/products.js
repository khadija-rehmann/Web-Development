const express = require("express");
const router = express.Router();

// Lazy-load Product model to avoid mongoose hanging on require
let Product;
function getProduct() {
  if (!Product) {
    Product = require("../models/Product");
  }
  return Product;
}

// GET /products
router.get("/products", async (req, res) => {
  try {
    const Product = getProduct();
    
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || "";
    const category = req.query.category || "";
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : 0;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : Infinity;
    const sort = req.query.sort || "";

    // Build the filter object
    const filter = {};

    // Add search filter (case-insensitive regex on product name)
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    // Add category filter
    if (category) {
      filter.category = category;
    }

    // Add price range filter
    filter.price = { $gte: minPrice };
    if (maxPrice !== Infinity) {
      filter.price.$lte = maxPrice;
    }

    // Determine sort object
    let sortObj = { _id: -1 }; // default: newest first
    if (sort === "price_asc") {
      sortObj = { price: 1 };
    } else if (sort === "price_desc") {
      sortObj = { price: -1 };
    } else if (sort === "rating") {
      sortObj = { rating: -1 };
    } else if (sort === "newest") {
      sortObj = { _id: -1 };
    }

    // Calculate pagination
    const productsPerPage = 8;
    const skip = (page - 1) * productsPerPage;

    // Execute the query
    const products = await Product.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(productsPerPage);

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / productsPerPage);

    // Get list of all categories for the filter dropdown
    const allCategories = await Product.distinct("category");

    // Render the template with all necessary data
    const minPriceValue = minPrice === 0 ? "" : minPrice;
    const maxPriceValue = maxPrice === Infinity ? "" : maxPrice;

    res.render("products", {
      products,
      currentPage: page,
      currentPageValue: page,
      totalPages,
      totalPagesValue: totalPages,
      totalProducts,
      productsPerPage,
      search,
      searchValue: search,
      category,
      categoryValue: category,
      minPrice: minPriceValue,
      minPriceValue,
      maxPrice: maxPriceValue,
      maxPriceValue,
      sort,
      sortValue: sort,
      allCategories: allCategories.sort(),
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).send("Error loading products: " + err.message);
  }
});

module.exports = router;
