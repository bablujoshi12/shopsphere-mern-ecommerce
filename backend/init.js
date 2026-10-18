require("dotenv").config();
const mongoose = require("mongoose");

const Product = require("./model/Product");
const Category = require("./model/Category");

const products = [
  // FASHION & CLOTHING
  {
    name: "Classic Cotton T-Shirt",
    description: "Comfortable cotton T-shirt for everyday casual wear.",
    price: 599,
    discountPrice: 449,
    costPrice: 280,
    stock: 50,
    brand: "StyleCraft",
    sku: "FASH-001",
    categorySlug: "fashion-clothing",
    specifications: {
      Material: "Cotton",
      Fit: "Regular Fit",
      Sleeve: "Half Sleeve",
      Neck: "Round Neck",
      Color: "Black",
      Sizes: "S, M, L, XL",
    },
  },
  {
    name: "Slim Fit Jeans",
    description: "Stylish denim jeans suitable for casual outings.",
    price: 1299,
    discountPrice: 999,
    costPrice: 650,
    stock: 35,
    brand: "DenimWorks",
    sku: "FASH-002",
    categorySlug: "fashion-clothing",
    specifications: {
      Material: "Denim",
      Fit: "Slim Fit",
      Closure: "Button and Zipper",
      Rise: "Mid Rise",
      Color: "Blue",
      Sizes: "28, 30, 32, 34",
    },
  },
  {
    name: "Casual Shirt",
    description: "Versatile casual shirt for daily wear and outings.",
    price: 999,
    discountPrice: 749,
    costPrice: 450,
    stock: 30,
    brand: "UrbanWear",
    sku: "FASH-003",
    categorySlug: "fashion-clothing",
    specifications: {
      Material: "Cotton Blend",
      Fit: "Regular Fit",
      Sleeve: "Full Sleeve",
      Collar: "Spread Collar",
      Color: "Light Blue",
      Sizes: "S, M, L, XL",
    },
  },
  {
    name: "Hooded Sweatshirt",
    description: "Warm and comfortable hoodie for everyday styling.",
    price: 1499,
    discountPrice: 1199,
    costPrice: 750,
    stock: 25,
    brand: "CozyFit",
    sku: "FASH-004",
    categorySlug: "fashion-clothing",
    specifications: {
      Material: "Cotton Blend",
      Fit: "Relaxed Fit",
      Sleeve: "Full Sleeve",
      Hood: "Adjustable Drawstring",
      Color: "Grey",
      Sizes: "S, M, L, XL",
    },
  },
  {
    name: "Women's Casual Dress",
    description: "Elegant casual dress for everyday and weekend wear.",
    price: 1299,
    discountPrice: 899,
    costPrice: 550,
    stock: 20,
    brand: "Elegance",
    sku: "FASH-005",
    categorySlug: "fashion-clothing",
    specifications: {
      Material: "Polyester Blend",
      Fit: "Regular Fit",
      Length: "Knee Length",
      Sleeve: "Short Sleeve",
      Color: "Black",
      Sizes: "S, M, L, XL",
    },
  },

  // FOOTWEAR
  {
    name: "Running Shoes",
    description: "Lightweight running shoes for daily workouts.",
    price: 1999,
    discountPrice: 1599,
    costPrice: 1000,
    stock: 30,
    brand: "RunPro",
    sku: "FOOT-001",
    categorySlug: "footwear",
    specifications: {
      Upper: "Mesh",
      Sole: "EVA Rubber",
      Closure: "Lace-Up",
      Usage: "Running and Daily Wear",
      Color: "Black",
      Sizes: "6, 7, 8, 9, 10",
    },
  },
  {
    name: "Classic Sneakers",
    description: "Minimal sneakers for everyday casual outfits.",
    price: 1799,
    discountPrice: 1399,
    costPrice: 850,
    stock: 28,
    brand: "StreetStep",
    sku: "FOOT-002",
    categorySlug: "footwear",
    specifications: {
      Upper: "Synthetic Leather",
      Sole: "Rubber",
      Closure: "Lace-Up",
      Style: "Casual",
      Color: "White",
      Sizes: "6, 7, 8, 9, 10",
    },
  },
  {
    name: "Casual Sandals",
    description: "Comfortable sandals for everyday use.",
    price: 799,
    discountPrice: 599,
    costPrice: 300,
    stock: 40,
    brand: "ComfortWalk",
    sku: "FOOT-003",
    categorySlug: "footwear",
    specifications: {
      Upper: "Synthetic",
      Sole: "Rubber",
      Closure: "Adjustable Strap",
      Usage: "Daily Wear",
      Color: "Brown",
      Sizes: "6, 7, 8, 9, 10",
    },
  },
  {
    name: "Sports Training Shoes",
    description: "Training shoes for gym sessions and active routines.",
    price: 2299,
    discountPrice: 1899,
    costPrice: 1200,
    stock: 22,
    brand: "ActiveStep",
    sku: "FOOT-004",
    categorySlug: "footwear",
    specifications: {
      Upper: "Breathable Mesh",
      Sole: "Rubber",
      Closure: "Lace-Up",
      Cushioning: "Foam",
      Color: "Navy Blue",
      Sizes: "6, 7, 8, 9, 10",
    },
  },
  {
    name: "Everyday Slippers",
    description: "Lightweight slippers for indoor and outdoor use.",
    price: 399,
    discountPrice: 299,
    costPrice: 140,
    stock: 60,
    brand: "EasyWalk",
    sku: "FOOT-005",
    categorySlug: "footwear",
    specifications: {
      Material: "EVA",
      Sole: "EVA",
      Closure: "Slip-On",
      Usage: "Indoor and Outdoor",
      Color: "Black",
      Sizes: "6, 7, 8, 9, 10",
    },
  },

  // BEAUTY & PERSONAL CARE
  {
    name: "Hydrating Face Moisturizer",
    description: "Daily moisturizer for a soft and hydrated skin feel.",
    price: 499,
    discountPrice: 399,
    costPrice: 200,
    stock: 45,
    brand: "GlowCare",
    sku: "BEAU-001",
    categorySlug: "beauty-personal-care",
    specifications: {
      SkinType: "Normal to Dry",
      Form: "Cream",
      Quantity: "50g",
      Usage: "Daily Skincare",
      Packaging: "Jar",
    },
  },
  {
    name: "Gentle Face Cleanser",
    description: "Gentle facial cleanser for an everyday skincare routine.",
    price: 349,
    discountPrice: 279,
    costPrice: 150,
    stock: 50,
    brand: "PureSkin",
    sku: "BEAU-002",
    categorySlug: "beauty-personal-care",
    specifications: {
      SkinType: "All Skin Types",
      Form: "Gel",
      Quantity: "100ml",
      Usage: "Facial Cleansing",
      Packaging: "Bottle",
    },
  },
  {
    name: "Vitamin C Face Serum",
    description: "Vitamin C serum for a simple daily skincare routine.",
    price: 699,
    discountPrice: 549,
    costPrice: 300,
    stock: 32,
    brand: "GlowCare",
    sku: "BEAU-003",
    categorySlug: "beauty-personal-care",
    specifications: {
      Form: "Serum",
      Quantity: "30ml",
      KeyIngredient: "Vitamin C",
      Application: "Face",
      Packaging: "Dropper Bottle",
    },
  },
  {
    name: "Shampoo & Conditioner Set",
    description: "Hair care combo for regular shampooing and conditioning.",
    price: 599,
    discountPrice: 479,
    costPrice: 280,
    stock: 25,
    brand: "SilkRoots",
    sku: "BEAU-004",
    categorySlug: "beauty-personal-care",
    specifications: {
      ProductType: "Shampoo and Conditioner",
      HairType: "Normal Hair",
      Quantity: "2 x 180ml",
      Application: "Hair Care",
      Packaging: "Bottles",
    },
  },
  {
    name: "Personal Grooming Kit",
    description: "Rechargeable grooming kit with multiple attachments.",
    price: 1499,
    discountPrice: 1199,
    costPrice: 750,
    stock: 18,
    brand: "TrimPro",
    sku: "BEAU-005",
    categorySlug: "beauty-personal-care",
    specifications: {
      PowerSource: "Rechargeable",
      Usage: "Personal Grooming",
      Accessories: "Multiple Attachments",
      ChargingPort: "USB",
      Color: "Black",
    },
  },

  // HOME & KITCHEN
  {
    name: "Stainless Steel Water Bottle",
    description: "Reusable bottle for travel, office and daily use.",
    price: 699,
    discountPrice: 499,
    costPrice: 280,
    stock: 40,
    brand: "HomeEssentials",
    sku: "HOME-001",
    categorySlug: "home-kitchen",
    specifications: {
      Material: "Stainless Steel",
      Capacity: "750ml",
      Lid: "Screw Cap",
      Usage: "Travel and Daily Use",
      Color: "Silver",
    },
  },
  {
    name: "Ceramic Coffee Mug Set",
    description: "Set of two ceramic mugs for coffee and tea.",
    price: 599,
    discountPrice: 449,
    costPrice: 230,
    stock: 25,
    brand: "CeramiCasa",
    sku: "HOME-002",
    categorySlug: "home-kitchen",
    specifications: {
      Material: "Ceramic",
      SetContains: "2 Mugs",
      Capacity: "300ml Each",
      MicrowaveSafe: "Yes",
      Color: "White",
    },
  },
  {
    name: "Non-Stick Frying Pan",
    description: "Everyday frying pan for convenient home cooking.",
    price: 999,
    discountPrice: 799,
    costPrice: 480,
    stock: 20,
    brand: "CookSmart",
    sku: "HOME-003",
    categorySlug: "home-kitchen",
    specifications: {
      Material: "Aluminium",
      Coating: "Non-Stick",
      Diameter: "24cm",
      Handle: "Heat-Resistant",
      Compatibility: "Gas Stove",
    },
  },
  {
    name: "LED Table Lamp",
    description: "Compact table lamp for study desks and bedside tables.",
    price: 899,
    discountPrice: 699,
    costPrice: 400,
    stock: 22,
    brand: "BrightNest",
    sku: "HOME-004",
    categorySlug: "home-kitchen",
    specifications: {
      LightSource: "LED",
      Power: "5W",
      PowerSource: "Electric",
      Usage: "Study and Bedside",
      Color: "White",
    },
  },
  {
    name: "Storage Organizer Set",
    description: "Practical containers for organizing household items.",
    price: 499,
    discountPrice: 379,
    costPrice: 190,
    stock: 35,
    brand: "OrganizeIt",
    sku: "HOME-005",
    categorySlug: "home-kitchen",
    specifications: {
      Material: "Plastic",
      SetContains: "3 Pieces",
      Usage: "Household Storage",
      Closure: "Lid",
      Color: "Transparent",
    },
  },

  // COMPUTERS & ACCESSORIES
  {
    name: "Wireless Mouse",
    description: "Compact wireless mouse for work, study and browsing.",
    price: 599,
    discountPrice: 449,
    costPrice: 240,
    stock: 40,
    brand: "ClickTech",
    sku: "COMP-001",
    categorySlug: "computers-accessories",
    specifications: {
      Connectivity: "2.4GHz Wireless",
      Sensor: "Optical",
      DPI: "1600 DPI",
      PowerSource: "AA Battery",
      Color: "Black",
    },
  },
  {
    name: "Mechanical Keyboard",
    description: "Full-size mechanical keyboard for everyday computing.",
    price: 2499,
    discountPrice: 1999,
    costPrice: 1250,
    stock: 15,
    brand: "KeyForge",
    sku: "COMP-002",
    categorySlug: "computers-accessories",
    specifications: {
      Type: "Mechanical",
      Connectivity: "USB",
      Layout: "Full Size",
      Backlight: "RGB",
      Compatibility: "Windows",
    },
  },
  {
    name: "Laptop Stand",
    description: "Foldable laptop stand for a comfortable desk setup.",
    price: 1299,
    discountPrice: 999,
    costPrice: 550,
    stock: 25,
    brand: "DeskMate",
    sku: "COMP-003",
    categorySlug: "computers-accessories",
    specifications: {
      Material: "Aluminium Alloy",
      Compatibility: "10–17 Inch Laptops",
      Adjustability: "Adjustable Height",
      Design: "Foldable",
      Color: "Silver",
    },
  },
  {
    name: "USB-C Hub",
    description: "Compact USB-C hub for connecting compatible accessories.",
    price: 1799,
    discountPrice: 1399,
    costPrice: 850,
    stock: 18,
    brand: "ConnectPro",
    sku: "COMP-004",
    categorySlug: "computers-accessories",
    specifications: {
      Connector: "USB Type-C",
      Ports: "USB-A, HDMI, USB-C",
      Compatibility: "USB-C Devices",
      Design: "Compact",
      Color: "Grey",
    },
  },
  {
    name: "Laptop Backpack",
    description: "Everyday backpack with dedicated laptop storage.",
    price: 1499,
    discountPrice: 1199,
    costPrice: 700,
    stock: 28,
    brand: "CarryTech",
    sku: "COMP-005",
    categorySlug: "computers-accessories",
    specifications: {
      Material: "Polyester",
      LaptopCompatibility: "Up to 15.6 Inches",
      Compartments: "Multiple",
      Closure: "Zipper",
      Color: "Black",
    },
  },

  // WATCHES & ACCESSORIES
  {
    name: "Classic Analog Watch",
    description: "Classic analog watch for everyday styling.",
    price: 1999,
    discountPrice: 1599,
    costPrice: 1000,
    stock: 20,
    brand: "TimeCraft",
    sku: "WAT-001",
    categorySlug: "watches-accessories",
    specifications: {
      Display: "Analog",
      Movement: "Quartz",
      Strap: "Stainless Steel",
      DialShape: "Round",
      Color: "Silver",
    },
  },
  {
    name: "Digital Sports Watch",
    description: "Digital watch with alarm and stopwatch features.",
    price: 1299,
    discountPrice: 999,
    costPrice: 550,
    stock: 25,
    brand: "SportTime",
    sku: "WAT-002",
    categorySlug: "watches-accessories",
    specifications: {
      Display: "Digital",
      Features: "Alarm and Stopwatch",
      Strap: "Silicone",
      WaterResistance: "Basic Splash Resistance",
      Color: "Black",
    },
  },
  {
    name: "Polarized Sunglasses",
    description: "Rectangular sunglasses for everyday outdoor styling.",
    price: 999,
    discountPrice: 749,
    costPrice: 400,
    stock: 30,
    brand: "SunVista",
    sku: "WAT-003",
    categorySlug: "watches-accessories",
    specifications: {
      LensType: "Polarized",
      FrameMaterial: "Plastic",
      FrameShape: "Rectangular",
      UVProtection: "UV Protection",
      Color: "Black",
    },
  },
  {
    name: "Leather Wallet",
    description: "Foldable wallet with multiple card compartments.",
    price: 699,
    discountPrice: 499,
    costPrice: 250,
    stock: 35,
    brand: "UrbanCarry",
    sku: "WAT-004",
    categorySlug: "watches-accessories",
    specifications: {
      Material: "Faux Leather",
      Compartments: "Multiple Card Slots",
      Closure: "Foldable",
      Usage: "Everyday Carry",
      Color: "Brown",
    },
  },
  {
    name: "Classic Belt",
    description: "Versatile belt for casual and formal outfits.",
    price: 599,
    discountPrice: 449,
    costPrice: 220,
    stock: 30,
    brand: "BeltCraft",
    sku: "WAT-005",
    categorySlug: "watches-accessories",
    specifications: {
      Material: "Faux Leather",
      Buckle: "Pin Buckle",
      Width: "35mm",
      Style: "Casual and Formal",
      Color: "Black",
    },
  },

  // BAGS & LUGGAGE
  {
    name: "Everyday Backpack",
    description: "Practical backpack for college, office and daily travel.",
    price: 1299,
    discountPrice: 999,
    costPrice: 600,
    stock: 30,
    brand: "CarryMate",
    sku: "BAG-001",
    categorySlug: "bags-luggage",
    specifications: {
      Material: "Polyester",
      Capacity: "25 Litres",
      Compartments: "Multiple",
      Closure: "Zipper",
      Color: "Black",
    },
  },
  {
    name: "Women's Handbag",
    description: "Stylish handbag for everyday essentials and outings.",
    price: 1599,
    discountPrice: 1199,
    costPrice: 700,
    stock: 18,
    brand: "Elegance",
    sku: "BAG-002",
    categorySlug: "bags-luggage",
    specifications: {
      Material: "Faux Leather",
      Closure: "Zipper",
      Strap: "Shoulder Strap",
      Compartments: "Multiple",
      Color: "Tan",
    },
  },
  {
    name: "Travel Duffel Bag",
    description: "Spacious duffel bag for weekend trips and gym use.",
    price: 1199,
    discountPrice: 899,
    costPrice: 550,
    stock: 22,
    brand: "TripMate",
    sku: "BAG-003",
    categorySlug: "bags-luggage",
    specifications: {
      Material: "Polyester",
      Capacity: "40 Litres",
      CarryType: "Hand and Shoulder",
      Closure: "Zipper",
      Color: "Navy Blue",
    },
  },
  {
    name: "Cabin Trolley Suitcase",
    description: "Compact trolley suitcase for cabin-size travel.",
    price: 3499,
    discountPrice: 2999,
    costPrice: 2000,
    stock: 12,
    brand: "TravelPro",
    sku: "BAG-004",
    categorySlug: "bags-luggage",
    specifications: {
      Material: "ABS",
      Size: "Cabin Size",
      Wheels: "4 Spinner Wheels",
      Handle: "Telescopic Handle",
      Color: "Grey",
    },
  },
  {
    name: "Laptop Messenger Bag",
    description: "Shoulder bag designed for carrying a laptop and accessories.",
    price: 1399,
    discountPrice: 1099,
    costPrice: 650,
    stock: 20,
    brand: "CarryTech",
    sku: "BAG-005",
    categorySlug: "bags-luggage",
    specifications: {
      Material: "Polyester",
      LaptopCompatibility: "Up to 15.6 Inches",
      CarryType: "Shoulder",
      Compartments: "Multiple",
      Color: "Black",
    },
  },

  // TOYS & GAMES
  {
    name: "Building Blocks Set",
    description: "Creative building blocks for imaginative play.",
    price: 799,
    discountPrice: 599,
    costPrice: 320,
    stock: 30,
    brand: "PlayNest",
    sku: "TOY-001",
    categorySlug: "toys-games",
    specifications: {
      Material: "ABS Plastic",
      Pieces: "100 Pieces",
      RecommendedAge: "6+ Years",
      Skill: "Creativity and Building",
      Color: "Multicolor",
    },
  },
  {
    name: "Family Board Game",
    description: "Family-friendly board game for group entertainment.",
    price: 699,
    discountPrice: 499,
    costPrice: 250,
    stock: 24,
    brand: "FunTable",
    sku: "TOY-002",
    categorySlug: "toys-games",
    specifications: {
      GameType: "Family Board Game",
      Players: "2–4 Players",
      RecommendedAge: "8+ Years",
      PlayTime: "30–45 Minutes",
      Language: "English",
    },
  },
  {
    name: "Educational Puzzle Set",
    description: "Puzzle set designed for learning and problem-solving.",
    price: 499,
    discountPrice: 379,
    costPrice: 180,
    stock: 35,
    brand: "BrainBuddy",
    sku: "TOY-003",
    categorySlug: "toys-games",
    specifications: {
      Material: "Cardboard",
      Pieces: "100 Pieces",
      RecommendedAge: "6+ Years",
      Skill: "Problem Solving",
      Theme: "Educational",
    },
  },
  {
    name: "Remote Control Car",
    description: "Rechargeable remote-control car for indoor and outdoor play.",
    price: 1499,
    discountPrice: 1199,
    costPrice: 750,
    stock: 15,
    brand: "SpeedPlay",
    sku: "TOY-004",
    categorySlug: "toys-games",
    specifications: {
      ControlType: "Remote Control",
      PowerSource: "Rechargeable Battery",
      RecommendedAge: "6+ Years",
      Usage: "Indoor and Outdoor",
      Color: "Red",
    },
  },
  {
    name: "Art & Craft Kit",
    description: "Creative art kit with drawing and coloring supplies.",
    price: 599,
    discountPrice: 449,
    costPrice: 230,
    stock: 28,
    brand: "CreateMore",
    sku: "TOY-005",
    categorySlug: "toys-games",
    specifications: {
      KitType: "Art and Craft",
      Contents: "Drawing and Coloring Supplies",
      RecommendedAge: "6+ Years",
      Skill: "Creativity",
      Packaging: "Storage Box",
    },
  },
];

async function init() {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error("MONGO_URL .env file mein nahi mila.");
    }

    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB connected.");

    let inserted = 0;
    let updated = 0;

    for (const item of products) {
      const category = await Category.findOne({
        slug: item.categorySlug,
        isActive: true,
      });

      if (!category) {
        throw new Error(`Category not found: ${item.categorySlug}`);
      }

      const { categorySlug, ...productData } = item;

      // Validate price before saving
      if (
        productData.discountPrice != null &&
        productData.discountPrice > productData.price
      ) {
        throw new Error(`Invalid discount price for SKU: ${productData.sku}`);
      }

      const existingProduct = await Product.findOne({
        sku: productData.sku,
      });

      if (existingProduct) {
        // Update document fields
        existingProduct.set({
          ...productData,
          category: category._id,
          isActive: true,
        });

        // Existing images preserve rahengi
        await existingProduct.save();

        updated++;
        console.log(`Updated: ${productData.sku}`);
      } else {
        // Create a new Mongoose document
        const newProduct = new Product({
          ...productData,
          category: category._id,
          images: [],
          isActive: true,
        });

        await newProduct.save();

        inserted++;
        console.log(`Inserted: ${productData.sku}`);
      }
    }

    console.log("\nProduct seeding completed successfully!");
    console.log(`New products added: ${inserted}`);
    console.log(`Existing products updated: ${updated}`);
    console.log(`Total products processed: ${products.length}`);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

init();
