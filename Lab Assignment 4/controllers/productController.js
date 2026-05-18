let Product;

function getProduct() {
  if (!Product) {
    Product = require("../models/Product");
  }
  return Product;
}

exports.homepage = async (req, res) => {
  try {
    const Product = getProduct();

    // Get products marked as new arrivals by admin (limit 8)
    const newArrivals = await Product.find({ isNewArrival: true }).limit(8);

    res.render("homepage", { newArrivals });
  } catch (err) {
    console.error("Error fetching homepage data:", err);
    res.render("homepage", { newArrivals: [] });
  }
};

exports.women = async (req, res) => {
  try {
    const Product = getProduct();
    const womenCategories = ["Unstitched", "Ready to Wear", "Formals", "Co-ords", "Kurtis"];
    const products = await Product.find({ category: { $in: womenCategories } });
    res.render("women", { products, title: "WOMEN'S COLLECTION", bannerImage: "/images/banner image.png" });
  } catch (err) {
    console.error("Error fetching women's products:", err);
    res.render("women", { products: [], title: "WOMEN'S COLLECTION", bannerImage: "/images/banner image.png" });
  }
};

exports.men = async (req, res) => {
  try {
    const Product = getProduct();
    const products = await Product.find({ category: "Men" });
    res.render("men", { products, title: "MEN'S COLLECTION", bannerImage: "/images/men.jpg" });
  } catch (err) {
    console.error("Error fetching men's products:", err);
    res.render("men", { products: [], title: "MEN'S COLLECTION", bannerImage: "/images/men.jpg" });
  }
};

exports.girls = async (req, res) => {
  try {
    const Product = getProduct();
    const products = await Product.find({ category: "Girls" });
    res.render("girls", { products, title: "GIRLS' COLLECTION", bannerImage: "/images/girls.jpg" });
  } catch (err) {
    console.error("Error fetching girls' products:", err);
    res.render("girls", { products: [], title: "GIRLS' COLLECTION", bannerImage: "/images/girls.jpg" });
  }
};

exports.unstitched = async (req, res) => {
  try {
    const Product = getProduct();
    const products = await Product.find({ category: 'Unstitched' });
    res.render('category-page', { products, title: 'UNSTITCHED COLLECTION', bannerImage: '/images/Summer.jpg' });
  } catch (err) {
    console.error('Error fetching unstitched category:', err);
    res.render('category-page', { products: [], title: 'UNSTITCHED COLLECTION', bannerImage: '/images/Summer.jpg' });
  }
};

exports.readyToWear = async (req, res) => {
  try {
    const Product = getProduct();
    const products = await Product.find({ category: 'Ready to Wear' });
    res.render('category-page', { products, title: 'READY TO WEAR', bannerImage: '/images/printed.jpg' });
  } catch (err) {
    console.error('Error fetching ready-to-wear category:', err);
    res.render('category-page', { products: [], title: 'READY TO WEAR', bannerImage: '/images/printed.jpg' });
  }
};

exports.fragrances = async (req, res) => {
  try {
    const Product = getProduct();
    const products = await Product.find({ category: 'Fragrances' });
    res.render('category-page', { products, title: 'FRAGRANCES', bannerImage: '/images/fragrances.jpg' });
  } catch (err) {
    console.error('Error fetching fragrances category:', err);
    res.render('category-page', { products: [], title: 'FRAGRANCES', bannerImage: '/images/fragrances.jpg' });
  }
};

exports.bags = async (req, res) => {
  try {
    const Product = getProduct();
    const products = await Product.find({ category: 'Bags' });
    res.render('category-page', { products, title: 'BAGS', bannerImage: '/images/bags.jpg' });
  } catch (err) {
    console.error('Error fetching bags category:', err);
    res.render('category-page', { products: [], title: 'BAGS', bannerImage: '/images/bags.jpg' });
  }
};

exports.footwear = async (req, res) => {
  try {
    const Product = getProduct();
    const products = await Product.find({ category: 'Footwear' });
    res.render('category-page', { products, title: 'FOOTWEAR', bannerImage: '/images/footwear.jpg' });
  } catch (err) {
    console.error('Error fetching footwear category:', err);
    res.render('category-page', { products: [], title: 'FOOTWEAR', bannerImage: '/images/footwear.jpg' });
  }
};

exports.redirectMen = (req, res) => res.redirect('/men');
exports.redirectGirls = (req, res) => res.redirect('/girls');

exports.contactUs = (req, res) => {
  res.render("contact-us");
};

exports.products = async (req, res) => {
  try {
    const Product = getProduct();

    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || "";//Gets search input. If not provided, defaults to empty string (matches all products).
    const category = req.query.category || "";
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : 0;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : Infinity;
    const sort = req.query.sort || "";

    // Build the filter object
    const filter = {};//Will be populated based on user's filters

    // Add search filter (case-insensitive regex on product name)
    if (search) {
      filter.name = { $regex: search, $options: "i" };//Search "laptop" finds "Laptop", "LAPTOP", "Gaming Laptop"
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
};