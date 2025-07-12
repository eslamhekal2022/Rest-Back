import ReviewUsers from "../../Model/ReviewUsers.js";

// ✅ إضافة مراجعة جديدة
export const AddReview = async (req, res) => {
  try {
    const userId = req.userId;
    const { comment, rating } = req.body;

    if (!userId || !comment || typeof rating !== "number") {
      return res.status(400).json({
        success: false,
        message: "الحقول مطلوبة: التعليق والتقييم.",
      });
    }

    const newReview = await new ReviewUsers({ userId, comment, rating }).save();

    res.status(201).json({
      success: true,
      message: "تم إضافة المراجعة بنجاح.",
      data: newReview,
    });
  } catch (error) {
    console.error("❌ AddReview error:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إضافة المراجعة.",
      error: error.message,
    });
  }
};

// ✅ جلب كل المراجعات
export const getAllReview = async (req, res) => {
  try {
    const allReviews = await ReviewUsers.find()
      .populate("userId", "name email image")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      message: "تم جلب جميع المراجعات.",
      data: allReviews,
      count: allReviews.length,
    });
  } catch (error) {
    console.error("❌ getAllReview error:", error);
    res.status(500).json({
      success: false,
      message: "فشل في جلب المراجعات.",
      error: error.message,
    });
  }
};

// ✅ حذف كل المراجعات
export const deleteAllReview = async (req, res) => {
  try {
    // تحقق من صلاحية الأدمن هنا لو عندك middleware صلاحيات

    const result = await ReviewUsers.deleteMany({});
    res.status(200).json({
      success: true,
      message: "تم حذف كل المراجعات.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("❌ deleteAllReview error:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء حذف المراجعات.",
      error: error.message,
    });
  }
};

// ✅ حذف مراجعة واحدة
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedReview = await ReviewUsers.findByIdAndDelete(id);

    if (!deletedReview) {
      return res.status(404).json({
        success: false,
        message: "المراجعة غير موجودة.",
      });
    }

    res.status(200).json({
      success: true,
      message: "تم حذف المراجعة بنجاح.",
      data: deletedReview,
    });
  } catch (error) {
    console.error("❌ deleteReview error:", error);
    res.status(500).json({
      success: false,
      message: "فشل في حذف المراجعة.",
      error: error.message,
    });
  }
};

// ✅ تحديث مراجعة
export const updateReview = async (req, res) => {
  try {
    const { comment, rating } = req.body;
    const { id } = req.params;

    if (!comment || typeof rating !== "number") {
      return res.status(400).json({
        success: false,
        message: "الرجاء إدخال التعليق والتقييم الصحيح.",
      });
    }

    const review = await ReviewUsers.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "المراجعة غير موجودة.",
      });
    }

    review.comment = comment;
    review.rating = rating;
    await review.save();

    res.status(200).json({
      success: true,
      message: "تم تحديث المراجعة.",
      data: review,
    });
  } catch (error) {
    console.error("❌ updateReview error:", error);
    res.status(500).json({
      success: false,
      message: "فشل في تحديث المراجعة.",
      error: error.message,
    });
  }
};
