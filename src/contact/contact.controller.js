import Contact from "../../Model/contact.model.js";


export const addContact = async (req, res) => {
  try {
    const userId = req.userId;
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ success: false, message: "الرسالة مطلوبة." });
    }

    const contact = await new Contact({ userId, message }).save();

    req.io.emit("new-contact", {
      message: "📩 رسالة جديدة من مستخدم",
      userId,
      contactId: contact._id,
    });

    res.status(201).json({ success: true, message: "تم إرسال الرسالة بنجاح." });
  } catch (error) {
    console.error("❌ Error in addContact:", error);
    res.status(500).json({ success: false, message: "حدث خطأ أثناء إرسال الرسالة." });
  }
};

  
  

export const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find()
      .populate("userId", "-password -__v")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      message: "تم جلب جميع الرسائل.",
      data: contacts,
    });
  } catch (error) {
    console.error("❌ Error in getContacts:", error);
    res.status(500).json({ success: false, message: "فشل في جلب الرسائل." });
  }
};


export const deleteAllContacts = async (req, res) => {
  try {
    // تأكد إن المستخدم Admin - نفترض إنك بتستخدم req.role أو req.user.isAdmin
    // if (req.role !== "admin") return res.status(403).json({ message: "غير مصرح." });

    await Contact.deleteMany();
    res.status(200).json({ success: true, message: "تم حذف جميع الرسائل." });
  } catch (error) {
    console.error("❌ Error in deleteAllContacts:", error);
    res.status(500).json({ success: false, message: "فشل في حذف الرسائل." });
  }
};

export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Contact.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "الرسالة غير موجودة." });
    }

    res.status(200).json({ success: true, message: "تم حذف الرسالة." });
  } catch (error) {
    console.error("❌ Error in deleteContact:", error);
    res.status(500).json({ success: false, message: "حدث خطأ أثناء الحذف." });
  }
};
