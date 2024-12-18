// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import dotenv from 'dotenv';
import shopify from "./shopify.js";
import PrivacyWebhookHandlers from "./privacy.js"

// Load environment variables from .env file
dotenv.config();

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());

app.get("/api/products/all", async (_req, res) => {
  const session = res.locals.shopify.session ;
  const products = await shopify.api.rest.Product.all({
    session: session,
  });
  res.status(200).send(products);
});



app.put("/api/products/update", async (req, res) => {
  try {
    // Extract product ID and updated title from request body
    const { productId, productTitle } = req.body;

    if (!productId || !productTitle) {
      return res.status(400).json({ error: "Product ID and title are required." });
    }

    // Access the current session (created via OAuth)
    const session = res.locals.shopify.session;

    // Create a product instance
    const product = new shopify.api.rest.Product({ session });
    product.id = productId;        // Dynamically set the product ID
    product.title = productTitle;  // Dynamically set the new product title

    // Save changes to Shopify
    await product.save({
      update: true,
    });

    res.status(200).json({ message: "Product updated successfully." });
  } catch (error) {
    console.error("Error updating product:", error.message);
    res.status(500).json({ error: "Failed to update product." });
  }
});



  app.put("/api/product/imageupdate", async (_req,res) => {
    try {
      console.log("Request body:", _req.body); // Log request body
      const { images } = _req.body;
  
      if (!images || !Array.isArray(images)) {
        return res.status(400).json({ error: "Invalid 'images' payload." });
      }
      const updatedImages = [];
      
      for (const image of images) {
        if (!image.product_id || !image.id || !image.position) {
          console.error("Invalid image object:", image);
          continue; // Skip invalid image objects
        }
  
        const productImage = new shopify.api.rest.Image({
          session: res.locals.shopify.session,
        });
  
        productImage.product_id = image.product_id; // Product ID
        productImage.id = image.id; // Image ID
        productImage.position = image.position; // Image position
        productImage.alt = "new alt tag content"; // Alt text
  
        try {
          await productImage.save({
            update: true,
          });
          console.log(`Image with ID ${image.id} updated successfully`,req.body);
          console.log("Hear the images",productImage);
        } catch (error) {
          console.error(`Error updating image with ID ${image.id}:`, error);
        }
      }
  
      res.status(200).json({
        message: "Product images updated successfully.",
        response: images // or any relevant data you want to send back
      });
      
    } catch (error) {
      console.error("Error updating product images:", error);
      res.status(500).json({ error: "Failed to update product images from backend." });
    }
  });
  
 

  app.get("/api/shop/all", async (_req,res)=>{
    // Session is built by the OAuth process
    const session = res.locals.shopify.session ;
        const shopData =  await shopify.api.rest.Shop.all({
            session: session,
          });
          res.status(200).send(shopData);
    });
  
  
  
  
    app.use(shopify.cspHeaders());
    app.use(serveStatic(STATIC_PATH, { index: false }));
    
    // ensure install
    
    app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
      return res
        .status(200)
        .set("Content-Type", "text/html")
        .send(readFileSync(join(STATIC_PATH, "index.html")));
    });
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    
    
    





