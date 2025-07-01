import { CartModel } from "../../Model/Cart.model.js";
import { OrderModel } from "../../Model/Order.model.js";


export const checkOut = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const cart = await CartModel.findOne({ userId }).populate("products.productId").lean();
    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let totalPrice = 0;
    const orderProducts = [];

    for (const item of cart.products) {
      const product = item.productId;
      if (!product) continue;

      const sizeData = product.sizes.find(s => s.size === item.size);
      const unitPrice = sizeData?.price ?? 0;
      const quantity = item.quantity || 1;

      totalPrice += unitPrice * quantity;

      orderProducts.push({
        productId: product._id,
        name: product.name,
        image: product.images?.[0] || "",
        size: item.size,
        price: unitPrice,
        quantity
      });
    }

    if (orderProducts.length === 0) {
      return res.status(400).json({ message: "No valid products in cart" });
    }

    const newOrder = await OrderModel.create({
      userId,
      products: orderProducts,
      totalPrice,
      status: "pending"
    });

    await CartModel.updateOne({ userId }, { $set: { products: [] } });

    res.status(201).json({ success: true, message: "Order placed successfully", order: newOrder });

  } catch (err) {
    console.error("❌ Checkout error:", err);
    res.status(500).json({ success: false, message: "Checkout failed", error: err.message });
  }
};


export const getAllOrders = async (req, res) => {
  try {
    const orders = await OrderModel.find()
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      message: "All orders retrieved successfully.",
      data: orders,
      count: orders.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve orders.",
      error: error.message
    });
  }
};


export const getUserOrders = async (req, res) => {
  const userId = req.userId;

  try {
    const orders = await OrderModel.find({ userId })
      .populate('userId', 'name email phone');  // ما تعطلش populate للمنتجات عشان السعر والحجم موجودين في الأوردر

    if (!orders || orders.length === 0) {
      return res.status(200).json({
        data: [],
        count: 0,
        success: true,
        message: 'No orders found for this user.',
      });
    }

    const formattedOrders = orders.map(order => {
      const formattedProducts = order.products.map(item => ({
        _id: item.productId,
        name: item.name,
        price: item.price,     // السعر المحفوظ في الأوردر
        size: item.size,       // الحجم المحفوظ في الأوردر
        images: item.image ? [item.image] : [],  // صورة المنتج من الأوردر
        quantity: item.quantity || 1,
      }));

      return {
        products: formattedProducts,
        totalPrice: order.totalPrice,
        status: order.status,
        userInfo: order.userId,
        createdAt: order.createdAt,
      };
    });

    return res.status(200).json({
      data: formattedOrders,
      count: formattedOrders.length,
      success: true,
    });

  } catch (error) {
    console.error("❌ Error in getUserOrders:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};



export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required", success: false });
    }

    const updatedOrder = await OrderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found", success: false });
    }

    res.status(200).json({ success: true, message: "Order status updated", data: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
  }
};

export const deleteAllOrders = async (req, res) => {
  try {
    if (req.userRole !== "admin") {
      return res.status(403).json({ message: "Unauthorized", success: false });
    }

    await OrderModel.deleteMany();
    res.status(200).json({ success: true, message: "All orders have been deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete orders", error: error.message });
  }
};



export const deleteorder = async (req, res) => {
  const {id}=req.params
try {
  const product=await OrderModel.findByIdAndDelete(id)
res.status(200).json({message:"sex delete",product,success:true})
} catch (error) {
  console.log(error)
}  
}

export const OrderDet = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await OrderModel.findById(id).populate('userId', 'name email');

    if (!order) {
      return res.status(404).json({ message: "Order not found", success: false });
    }

    res.status(200).json({ message: "Order details retrieved", success: true, data: order });
  } catch (error) {
    console.error("❌ OrderDet error:", error);
    res.status(500).json({ message: "Failed to retrieve order", success: false });
  }
};
