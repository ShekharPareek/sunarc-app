// import { LATEST_API_VERSION } from "@shopify/shopify-api";
// import { shopifyApp } from "@shopify/shopify-app-express";
// import { MemorySessionStorage } from "@shopify/shopify-app-session-storage-memory";
// // import { SQLiteSessionStorage } from "@shopify/shopify-app-session-storage-sqlite";  // Import SQLite session storage
// import { restResources } from "@shopify/shopify-api/rest/admin/2024-07";
// import dotenv from 'dotenv';
// // Th

// dotenv.config();  // Load environment variables


// // /// Manually create __dirname for ES module
// // const __filename = fileURLToPath(import.meta.url);
// // const __dirname = path.dirname(__filename);

// // // Use the writable /tmp directory for SQLite storage
// // const dbDirectory = '/tmp';

// // // Ensure the directory exists (although /tmp typically exists on most systems)
// // if (!fs.existsSync(dbDirectory)) {
// //   fs.mkdirSync(dbDirectory);  // Should succeed as /tmp is writable
// // }

// // Define the full path to the SQLite database file in /tmp
// // const dbPath = path.join(dbDirectory, 'sessions.db');
// // const sessionDb = new SQLiteSessionStorage(dbPath);  // Use SQLite session storage in /tmp

// const shopify = shopifyApp({
//   api: {
//     apiVersion: LATEST_API_VERSION,
//     apiKey: process.env.SHOPIFY_API_KEY,
//     apiSecretKey: process.env.SHOPIFY_API_SECRET,
//     scopes: process.env.SHOPIFY_SCOPES,
//     hostName: process.env.SHOPIFY_HOST,
//     restResources,
//   },
//   auth: {
//     path: "/api/auth",
//     callbackPath: "/api/auth/callback",
//   },
//   webhooks: {
//     path: "/api/webhooks",
//   },
//   sessionStorage: new MemorySessionStorage()
//   // sessionStorage: sessionDb,  // Use SQLite for session storage
// });

// async function createWebhook(shop, accessToken) {
//   const client = new shopify.Clients.Rest(shop, accessToken);

//   try {
//     const response = await client.post({
//       path: 'webhooks',
//       data: {
//         webhook: {
//           topic: 'orders/create',
//           address: 'https://yourapp.com/webhooks/orders/create',
//           format: 'json'
//         }
//       },
//       type: shopify.Clients.Rest.DataType.JSON,
//     });
//     console.log('Webhook created:', response.body);
//   } catch (error) {
//     console.error('Failed to create webhook:', error);
//   }
// }

// export default shopify;




import { BillingInterval, LATEST_API_VERSION } from "@shopify/shopify-api";
import { shopifyApp } from "@shopify/shopify-app-express";
import { SQLiteSessionStorage } from "@shopify/shopify-app-session-storage-sqlite";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-10";

const DB_PATH = `${process.cwd()}/database.sqlite`;

// The transactions with Shopify will always be marked as test transactions, unless NODE_ENV is production.
// See the ensureBilling helper to learn more about billing in this template.
const billingConfig = {
  "My Shopify One-Time Charge": {
    // This is an example configuration that would do a one-time charge for $5 (only USD is currently supported)
    amount: 5.0,
    currencyCode: "USD",
    interval: BillingInterval.OneTime,
  },
};

const shopify = shopifyApp({
  api: {
    apiVersion: LATEST_API_VERSION,
    restResources,
    future: {
      customerAddressDefaultFix: true,
      lineItemBilling: true,
      unstable_managedPricingSupport: true,
    },
    billing: undefined, // or replace with billingConfig above to enable example billing
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  // This should be replaced with your preferred storage strategy
  sessionStorage: new SQLiteSessionStorage(DB_PATH),
});

export default shopify;