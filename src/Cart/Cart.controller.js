import { CartModel } from "../../Model/Cart.model.js";
import { ProductModel } from "../../Model/Product.model.js";


export const addToCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId, size, quantity = 1 } = req.body;

    if (!productId || !size) {
      return res.status(400).json({ message: "Product ID and size are required." });
    }

    const parsedQuantity = Number(quantity);
    if (parsedQuantity <= 0) {
      return res.status(400).json({ message: "Quantity must be at least 1." });
    }

    const product = await ProductModel.findById(productId).select('sizes name'); // Performance: select only needed fields
    if (!product) return res.status(404).json({ message: "Product not found." });

    const validSize = product.sizes.find(s => s.size === size);
    if (!validSize) return res.status(400).json({ message: "Invalid size for this product." });

    const cart = await CartModel.findOne({ userId });

    if (!cart) {
      const newCart = new CartModel({
        userId,
        products: [{ productId, size, quantity: parsedQuantity }],
      });
      await newCart.save();
      return res.status(200).json({ success: true, message: "Cart created and product added.", cart: newCart });
    }

    const item = cart.products.find(p => p.productId.toString() === productId && p.size === size);
    if (item) {
      item.quantity += parsedQuantity;
    } else {
      cart.products.push({ productId, size, quantity: parsedQuantity });
    }

    await cart.save();
    return res.status(200).json({ success: true, message: "Product added to cart.", cart });
  } catch (error) {
    console.error("❌ Error in addToCart:", error);
    return res.status(500).json({ message: "Server error while adding to cart.", error: error.message });
  }
};

export const getCart = async (req, res) => {
  try {
    const userId = req.userId;

    const cart = await CartModel.findOne({ userId }).populate("products.productId").lean();
    if (!cart) return res.json({ data: [], count: 0, success: true });

    const fullProducts = cart.products.map(p => {
      const product = p.productId;
      const sizeInfo = product.sizes.find(s => s.size === p.size);
      return {
        _id: product._id,
        name: product.name,
        images: product.images,
        description: product.description,
        size: p.size,
        quantity: p.quantity,
        price: sizeInfo?.price || 0
      };
    });

    res.json({ data: fullProducts, count: fullProducts.length, success: true });
  } catch (error) {
    console.error("❌ Error in getCart:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteProductCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId, size } = req.body;

    if (!productId || !size) {
      return res.status(400).json({ message: 'Product ID and size are required.' });
    }

    const cart = await CartModel.findOneAndUpdate(
      { userId },
      { $pull: { products: { productId, size } } },
      { new: true }
    ).populate("products.productId");

    if (!cart) return res.status(404).json({ message: 'Cart not found.' });

    res.status(200).json({ message: 'Item removed from cart', data: cart, success: true });
  } catch (error) {
    console.error('❌ Error in deleteProductCart:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCartQuantity = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId, size, quantity } = req.body;

    if (!productId || !size || quantity == null) {
      return res.status(400).json({ message: 'Product ID, size, and quantity are required.' });
    }

    const parsedQuantity = Number(quantity);
    if (parsedQuantity <= 0) {
      return res.status(400).json({ message: "Quantity must be at least 1." });
    }

    const cart = await CartModel.findOne({ userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found.' });

    const index = cart.products.findIndex(p => p.productId.toString() === productId && p.size === size);
    if (index === -1) return res.status(404).json({ message: 'Product not found in cart.' });

    cart.products[index].quantity = parsedQuantity;

    await cart.save();
    res.status(200).json({ message: 'Quantity updated successfully', success: true, cart });
  } catch (error) {
    console.error('❌ Update quantity error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
