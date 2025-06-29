import { ProductModel } from "../../Model/Product.model.js";
import mongoose from "mongoose";
import { userModel } from "../../Model/user.model.js";

export const addProduct = async (req, res) => {
  try {
    const { name, description, category, sizes } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "الرجاء تحميل صورة واحدة على الأقل" });
    }

    if (!name || !category || !sizes) {
      return res.status(400).json({ message: "يرجى ملء جميع الحقول المطلوبة" });
    }

    let parsedSizes;
    try {
      parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
    } catch (e) {
      return res.status(400).json({ message: "تنسيق الأحجام غير صالح" });
    }

    const validSizes = ["s", "m", "l"];
    const isValid = Array.isArray(parsedSizes) && parsedSizes.every(
      (item) =>
        validSizes.includes(item.size) &&
        typeof item.price === "number" &&
        item.price > 0
    );

    if (!isValid) {
      return res.status(400).json({ message: "الرجاء إدخال أحجام وأسعار صحيحة" });
    }

    const imagePaths = req.files.map((file) => `/uploads/${file.filename}`);

    const newItem = new ProductModel({
      name,
      description,
      category,
      sizes: parsedSizes,
      images: imagePaths,
    });

    await newItem.save();

    res.status(201).json({ success: true, message: "تمت إضافة العنصر بنجاح", newItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ أثناء الإضافة", error });
  }
};


export const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const [allProducts, total] = await Promise.all([
      ProductModel.find()
        .populate("reviews.userId", "name")
        .skip(skip)
        .limit(limit).sort({createdAt:-1}),
      ProductModel.countDocuments()
    ]);

    res.status(200).json({
      message: "All products",
      success: true,
      data: allProducts,
      count: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching products" });
  }
};

export const removeProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await ProductModel.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found", success: false });
    }

    res.status(200).json({ message: "Product removed successfully", success: true });

  }
  catch (error) {
    res.status(500).json({ message: "Server error", success: false, error: error.message });
  }
};

export const productDetails= async (req, res) => {


  try {
    const { id } = req.params;
    const product = await ProductModel.findById(id).populate({
      path: 'reviews.userId',
      select: 'name ' // حدد اللي تحب ترجع من بيانات اليوزر
    });
    if (product) {
      res.status(200).json({message:"product found successfully",success:true,data:product});
    } else {
      res.status(404).json({ message: 'Product Not Found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
}

export const searchProducts =  async (req, res) => {
  try {
    const { query } = req.query;
    const products = await ProductModel.find({
      name: { $regex: query, $options: 'i' },
      category: { $regex: query, $options: 'i' },
    });
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ message: "Error searching for products", error });
  }
};

export const getCategoryProduct= async (req, res) => {
  try {
    const products = await ProductModel.aggregate([
      {
        $group: {
          _id: '$category', 
          product: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$product' } 
      }
    ]);

    // إرجاع البيانات للـ Frontend
    res.status(200).json({data:products,success:true});
  } catch (err) {
    // التعامل مع الخطأ
    res.status(500).json({ message: err.message });
  }
}

export const getFilterCat= async (req, res) => {
  const category = req.params.category;

  try {
    const products = await ProductModel.find({ category: category });
    res.status(200).json({data:products,success:true});
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب المنتجات', error });
  }
}

export const getTrending=async (req, res) => {
  try {
    const trendingProducts = await ProductModel.find({ isTrending: true })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json(trendingProducts);
  } catch (error) {
    res.status(500).json({ message: "حدث خطأ في جلب البيانات", error });
  }
}


// controllers/reviewController.js


// إضافة مراجعة
export const addReviewToProduct = async (req, res) => {
  const { rating, comment } = req.body;
  const { productId } = req.params;
  const userId = req.userId;

  try {
    const product = await ProductModel.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const alreadyReviewed = product.reviews.find(
      (r) => r.userId.toString() === userId.toString()
    );
    if (alreadyReviewed) {
      return res.status(400).json({ message: "You already reviewed this product" });
    }

    const newReview = {
      userId: user._id,
      name: user.name,
      rating,
      comment,
    };

    product.reviews.push(newReview);

    product.averageRating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    await product.save();

    const populatedProduct = await ProductModel.findById(productId).populate({
      path: 'reviews.userId',
      select: 'name'
    });

    res.status(201).json({ message: "Review added", product: populatedProduct, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


export const editReview = async (req, res) => {
  const { productId, reviewId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.userId;

  try {
    const product = await ProductModel.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const review = product.reviews.find(
      (r) => r._id.toString() === reviewId&& r.userId.toString() === userId.toString()
    );


    if (!review) return res.status(404).json({ message: "Review not found for this user" });
    if (rating) review.rating = rating;
    if (comment) review.comment = comment;


      product.averageRating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;
      await product.save();
 const populatedProduct = await ProductModel.findById(productId).populate({
      path: 'reviews.userId',
      select: 'name'
    });
    res.status(200).json({ message: "Review updated", product:populatedProduct, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const deleteReview = async (req, res) => {
  const { productId, reviewId } = req.params;
  const userId = req.userId;

  try {
    const product = await ProductModel.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const review = product.reviews.find(
      (r) => r._id.toString() === reviewId && r.userId.toString() === userId.toString()
    );
    if (!review) return res.status(404).json({ message: "Review not found for this user" });

    product.reviews = product.reviews.filter((r) => r._id.toString() !== reviewId);

    if (product.reviews.length > 0) {
      product.averageRating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;
    } else {
      product.averageRating = 0;
    }

    await product.save();

    res.status(200).json({ message: "Review deleted", product, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


export const changeCat=async (req, res) => {
  try {
    const updatedProduct = await ProductModel.findByIdAndUpdate(
      req.params.id,
      { category: req.body.category },
      { new: true } // يرجعلك النسخة بعد التحديث
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ success: true, data: updatedProduct });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}