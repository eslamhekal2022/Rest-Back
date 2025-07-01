import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import http from "http";
import { Server } from "socket.io";
import fetch from "node-fetch"; // لو شغال على replit

import userRouter from "./src/user/user.routes.js";
import ProductRouter from "./src/product/product.routes.js";
import { CartRouter } from "./src/Cart/cart.routes.js";
import WishListRouter from "./src/wishlist/wishlist.routes.js";
import OrderRouter from "./src/order/order.routes.js";
import userReviews from "./src/ReviewUsers/ReviewUsers.routes.js";
import { ContactRouter } from "./src/contact/contact.routes.js";

import { connectDB } from "./dbConnection/dbConnection.js";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// ✅ Socket.IO config
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  },
});

// ✅ Inject io to all requests
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ✅ Socket.IO events
io.on("connection", (socket) => {
  console.log("🟢 A client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 A client disconnected:", socket.id);
  });
});

// ✅ Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
}));
app.use(morgan("dev"));

// ✅ Routes
app.use("/api/users", userRouter);
app.use("/api/products", ProductRouter);
app.use("/api/cart", CartRouter);
app.use("/api/wishlist", WishListRouter);
app.use("/api/orders", OrderRouter);
app.use("/api/reviews", userReviews);
app.use("/api/contacts", ContactRouter);

// ✅ Home route
app.get("/", (req, res) => {
  res.send("API is running with Socket.IO ✅");
});

// ✅ Prevent sleeping on Replit
if (process.env.REPLIT_PING_URL) {
  setInterval(() => {
    fetch(process.env.REPLIT_PING_URL).catch((err) =>
      console.log("Ping failed:", err)
    );
  }, 60 * 1000);
}

const PORT = process.env.PORT || 4000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
