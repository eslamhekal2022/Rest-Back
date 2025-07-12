import { stateCat,stateRating,stateMonthly,stateSizes,addProduct, addReviewToProduct, changeCat, deleteReview, editReview, getAllProducts, getCategoryProduct, getFilterCat, productDetails, removeProduct, searchProducts } from "./product.controller.js"
import express from "express";
import multer from "multer";
import { authMiddleware } from "../../MiddleWare/MiddleWare.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });


const ProductRouter = express.Router()
ProductRouter.post("/addProduct",upload.array("images", 8),addProduct)
ProductRouter.get("/getAllProducts",getAllProducts)
ProductRouter.get("/productDetails/:id",productDetails)
ProductRouter.delete("/removeProduct/:id",removeProduct)
ProductRouter.get("/searchProducts",searchProducts)
ProductRouter.get("/getCategoryProduct",getCategoryProduct)
ProductRouter.get("/getProductsCat/:category",getFilterCat)
ProductRouter.post("/addProductReview/:productId", authMiddleware, addReviewToProduct);
ProductRouter.put("/editProductReview/:productId/:reviewId", authMiddleware, editReview);
ProductRouter.delete("/deleteProductReview/:productId/:reviewId", authMiddleware, deleteReview);
ProductRouter.put("/changeCat/:id", changeCat);

// Chart_Routes 
ProductRouter.get("/stateCat",stateCat)
ProductRouter.get("/stateRating",stateRating)
ProductRouter.get("/stateMonthly",stateMonthly)
ProductRouter.get("/stateSizes",stateSizes)

export default ProductRouter;