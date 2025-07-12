import { CartModel } from "../../Model/Cart.model.js";
import { ProductModel } from "../../Model/Product.model.js";


export const addToCart=  async (req, res) => {
  try {
    const userId = req.userId;
    const { productId, size, quantity } = req.body;

    if (!productId || !size) {
      return res.status(400).json({ message: "Product ID and size are required." });
    }

    const parsedQuantity = Number(quantity) || 1;
    if (parsedQuantity <= 0) {
      return res.status(400).json({ message:"Quantity must be at least 1." });
    }

    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const selectedSize = product.sizes.find((s) => s.size === size);
    if (!selectedSize) {
      return res.status(400).json({ message: "Invalid size for this product." });
    }

    let cart = await CartModel.findOne({userId});

    if (!cart) {
      cart = new CartModel({
        userId,
        products: [{ productId, size, quantity: parsedQuantity }]
      });
    } else {
      // لو المنتج بنفس الحجم موجود، زود الكمية
      const existingProductIndex = cart.products.findIndex(
        (p) => p.productId.toString() === productId && p.size === size
      );

      if (existingProductIndex > -1) {
        cart.products[existingProductIndex].quantity += parsedQuantity;
      } else {
        cart.products.push({ productId, size, quantity: parsedQuantity });
      }
    }

    await cart.save();
    return res.status(200).json({ success: true, message: "Product added to cart.", cart });

  } catch (error) {
    console.error("❌ Error in addToCart:", error);
    return res.status(500).json({ message: "Server error while adding to cart.", error: error.message });
  }
};

export const getCart= async (req, res) => {
  try {
    const userId = req.userId;

    const cart = await CartModel.findOne({ userId }).populate("products.productId").lean();

    if (!cart) {
      return res.json({ data: [], count: 0, success: true });
    }

    const fullProducts = cart.products.map(p => {
      const product = p.productId;
      const sizeData = product.sizes.find(s => s.size === p.size);
      return {
        _id: product._id,
        name: product.name,
        images: product.images,
        description: product.description,
        size: p.size,
        quantity: p.quantity,
        price: sizeData?.price || 0
      };
    });

    res.json({ data: fullProducts, count: fullProducts.length, success: true });

  } catch (error) {
    console.error("Error in getCart:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteProductCart=async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  try {
    const cart = await CartModel.findOneAndUpdate(
      { userId },
      { $pull: { products: { productId: id } } } ,
      { new: true }
    ).populate('products.productId');

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    res.status(200).json({ message: 'Item removed from cart', data: cart, success: true });
  } catch (error) {
    console.error(error);
    
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCartQuantity = async (req, res) => {
  try {
    const userId = req.userId; 
    const { productId, quantity } = req.body;

    if (!productId || quantity == null) {
      return res.status(400).json({ message: 'Product ID and quantity are required.' });
    }

    const cart = await CartModel.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found.' });
    }

    const productIndex = cart.products.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (productIndex > -1) {
      // Update existing product quantity
      cart.products[productIndex].quantity = quantity;
    } else {
      // Add new product
      cart.products.push({ productId, quantity });
    }

    await cart.save();

    return res.status(200).json({ message: 'Quantity updated successfully', success:true,cart });
  } catch (error) {
    console.error('Update quantity error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};