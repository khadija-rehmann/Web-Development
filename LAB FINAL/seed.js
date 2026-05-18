const mongoose = require("mongoose");
const Product = require("./models/Product");

// Allow force re-seed by running: node seed.js --force
const shouldForceReseed = process.argv.includes("--force");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/limelight", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("Connected to MongoDB");
  seedDatabase();
})
.catch((err) => {
  console.error("MongoDB connection error:", err);
  process.exit(1);
});

async function seedDatabase() {
  try {
    // Check if products already exist
    const existingCount = await Product.countDocuments();
    if (existingCount > 0 && !shouldForceReseed) {
      console.log(`Database already has ${existingCount} products. Skipping seed.`);
      console.log("To force re-seed and delete all products, run: node seed.js --force");
      mongoose.connection.close();
      return;
    }

    // If --force is used, clear old products first
    if (existingCount > 0 && shouldForceReseed) {
      await Product.deleteMany({});
      console.log(`Deleted ${existingCount} existing products before re-seed.`);
    }

    console.log("Database is empty. Seeding with sample products...");

    let products = [
      // Unstitched (3 products)
      {
        name: "Summer Lawn Unstitched",
        price: 2500,
        category: "Unstitched",
        rating: 4.5,
        stock: 45,
        isOnSale: true,
        salePrice: 1999,
        image: "https://placehold.co/300x400?text=Summer+Lawn",
      },
      {
        name: "Embroidered Chiffon Suit",
        price: 3500,
        category: "Unstitched",
        rating: 4.8,
        stock: 32,
        image: "https://placehold.co/300x400?text=Embroidered+Chiffon",
      },
      {
        name: "Printed Cotton Unstitched",
        price: 1800,
        category: "Unstitched",
        rating: 4.2,
        stock: 60,
        isOnSale: true,
        salePrice: 1499,
        image: "https://placehold.co/300x400?text=Printed+Cotton",
      },

      // Ready to Wear (3 products)
      {
        name: "Silk Embroidered Shirt",
        price: 5500,
        category: "Ready to Wear",
        rating: 4.6,
        stock: 28,
        image: "https://placehold.co/300x400?text=Silk+Shirt",
      },
      {
        name: "Printed Ready Pret",
        price: 4200,
        category: "Ready to Wear",
        rating: 4.4,
        stock: 35,
        isOnSale: true,
        salePrice: 3499,
        image: "https://placehold.co/300x400?text=Printed+Pret",
      },
      {
        name: "Solid Color Kurta",
        price: 3800,
        category: "Ready to Wear",
        rating: 4.3,
        stock: 42,
        image: "https://placehold.co/300x400?text=Solid+Kurta",
      },

      // Formals (3 products)
      {
        name: "Formal Wedding Pret",
        price: 12500,
        category: "Formals",
        rating: 4.9,
        stock: 15,
        image: "https://placehold.co/300x400?text=Wedding+Pret",
      },
      {
        name: "Elegant Black Suit",
        price: 15000,
        category: "Formals",
        rating: 4.7,
        stock: 18,
        image: "https://placehold.co/300x400?text=Black+Suit",
      },
      {
        name: "Gold Embroidered Pret",
        price: 18500,
        category: "Formals",
        rating: 4.8,
        stock: 12,
        image: "https://placehold.co/300x400?text=Gold+Formal",
      },

      // Co-ords (2 products)
      {
        name: "Silk Co-ord Set",
        price: 8500,
        category: "Co-ords",
        rating: 4.6,
        stock: 22,
        image: "https://placehold.co/300x400?text=Silk+CoOrds",
      },
      {
        name: "Summer Co-ord Set",
        price: 6500,
        category: "Co-ords",
        rating: 4.4,
        stock: 30,
        isOnSale: true,
        salePrice: 5499,
        image: "https://placehold.co/300x400?text=Summer+CoOrds",
      },

      // Kurtis (3 products)
      {
        name: "Casual Cotton Kurti",
        price: 2200,
        category: "Kurtis",
        rating: 4.1,
        stock: 55,
        image: "https://placehold.co/300x400?text=Cotton+Kurti",
      },
      {
        name: "Embroidered Kurti",
        price: 3500,
        category: "Kurtis",
        rating: 4.5,
        stock: 40,
        image: "https://placehold.co/300x400?text=Embroidered+Kurti",
      },
      {
        name: "Premium Silk Kurti",
        price: 5200,
        category: "Kurtis",
        rating: 4.7,
        stock: 25,
        image: "https://placehold.co/300x400?text=Silk+Kurti",
      },

      // Men (3 products)
      {
        name: "Men's Formal Shirt",
        price: 4500,
        category: "Men",
        rating: 4.3,
        stock: 38,
        image: "https://placehold.co/300x400?text=Mens+Shirt",
      },
      {
        name: "Men's Casual Kurta",
        price: 3200,
        category: "Men",
        rating: 4.2,
        stock: 45,
        isOnSale: true,
        salePrice: 2699,
        image: "https://placehold.co/300x400?text=Mens+Kurta",
      },
      {
        name: "Men's Premium Pret",
        price: 7500,
        category: "Men",
        rating: 4.6,
        stock: 20,
        image: "https://placehold.co/300x400?text=Mens+Premium",
      },

      // Girls (2 products)
      {
        name: "Girls Casual Dress",
        price: 2800,
        category: "Girls",
        rating: 4.4,
        stock: 35,
        isOnSale: true,
        salePrice: 2299,
        image: "https://placehold.co/300x400?text=Girls+Dress",
      },
      {
        name: "Girls Formal Wear",
        price: 4500,
        category: "Girls",
        rating: 4.5,
        stock: 28,
        image: "https://placehold.co/300x400?text=Girls+Formal",
      },

      // Bags (2 products)
      {
        name: "Embroidered Handbag",
        price: 4200,
        category: "Bags",
        rating: 4.3,
        stock: 30,
        image: "https://placehold.co/300x400?text=Embroidered+Bag",
      },
      {
        name: "Luxury Clutch Bag",
        price: 6800,
        category: "Bags",
        rating: 4.6,
        stock: 18,
        image: "https://placehold.co/300x400?text=Luxury+Clutch",
      },

      // Footwear (2 products)
      {
        name: "Embroidered Khussa",
        price: 2500,
        category: "Footwear",
        rating: 4.2,
        stock: 50,
        image: "https://placehold.co/300x400?text=Embroidered+Khussa",
      },
      {
        name: "Formal High Heels",
        price: 4500,
        category: "Footwear",
        rating: 4.4,
        stock: 25,
        image: "https://placehold.co/300x400?text=High+Heels",
      },

      // Fragrances (2 products)
      {
        name: "Limelight Perfume 100ml",
        price: 3500,
        category: "Fragrances",
        rating: 4.7,
        stock: 80,
        image: "https://placehold.co/300x400?text=Perfume",
      },
      {
        name: "Premium Oud Fragrance",
        price: 5200,
        category: "Fragrances",
        rating: 4.8,
        stock: 40,
        image: "https://placehold.co/300x400?text=Oud+Fragrance",
      },
    ];

    // Use local project images so product pictures always load offline.
    const imageByCategory = {
      Unstitched: "/images/Summer.jpg",
      "Ready to Wear": "/images/printed.jpg",
      Formals: "/images/formals.jpg",
      "Co-ords": "/images/co-ords.jpg",
      Kurtis: "/images/kurtis.jpg",
      Men: "/images/men.jpg",
      Girls: "/images/girls.jpg",
      Bags: "/images/bags.jpg",
      Footwear: "/images/footwear.jpg",
      Fragrances: "/images/fragrances.jpg",
    };

    products = products.map((product) => ({
      ...product,
      image: imageByCategory[product.category] || "/images/banner image.png",
    }));

    // Insert products into database
    const result = await Product.insertMany(products);
    console.log(`Successfully inserted ${result.length} products`);
    mongoose.connection.close();
  } catch (err) {
    console.error("Error seeding database:", err);
    mongoose.connection.close();
    process.exit(1);
  }
}
