import { userModel } from "../../Model/user.model.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
import upload from "../../MiddleWare/uploadImages.js";
import webpush from 'web-push';



export const signUp = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const image = req.file
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      : ``; 

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already registered', success: false });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'admin',
      image,
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully', success: true, newUser });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT Token
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Login successful",
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image||``
,
      },
    });
  } catch (error) {
    console.error("Server Error:", error); // طباعة الخطأ في الـ terminal
    res.status(500).json({ message: "Server error", error: error.message });}
  }


  export const getUsers = async (req, res) => {
    try {
      const allUsers = await userModel.find().select("-password");

      const keys = webpush.generateVAPIDKeys();
      console.log("KeyGenerate",keys);
      const countUsers=allUsers.length
      res.status(200).json({
        message: "All users retrieved successfully",
        success: true,
        data: allUsers,
        count:countUsers
      });
    } catch (error) {
      res.status(500).json({
        message: "Something went wrong",
        success: false,
        error: error.message
      });
    }
  };

  
  export const deleteUser = async (req, res) => {
    try {
      const { id } = req.params;
      const userDel = await userModel.findByIdAndDelete(id);
  
      if (!userDel) {
        return res.status(404).json({
          message: "User not found",
          success: false
        });
      }
  
      res.status(200).json({
        message: "User deleted successfully",
        success: true,
        data: userDel
      });
    } catch (error) {
      res.status(500).json({
        message: "Something went wrong",
        success: false,
        error: error.message
      });
    }
  };

  export const updateUserRole = async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
  
      if (!['user', 'admin',"moderator"].includes(role)) {
        return res.status(400).json({ success: false, message: "Invalid role provided" });
      }
  
      const updatedUser = await userModel.findByIdAndUpdate(
        userId,
        { role },
        { new: true }
      );
  
      if (!updatedUser) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
  
      res.status(200).json({
        success: true,
        message: "User role updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Something went wrong", error });
    }
  };
  

export const getUser = async (req, res) => {
 try {
  const { id } = req.params;
const user=await userModel.findById(id)

res.status(200).json({message:"userAho",success:true,data:user})
 } catch (error) {
  console.log(error)
 }
}

export const updateUserImage = async (req, res) => {
  try {
    const userId=req.userId
    const { id } = req.params;

    if(userId!==id){
      return res.status(400).json({message:"You do not user"})
    }
    // تحقق من وجود صورة مرفوعة
    if (!req.file) {
      return res.status(400).json({ message: 'No image provided' });
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      id,
      { image: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` }, 
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({data:updatedUser,success:true});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const ForgetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    
    const user = await userModel.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: "User not found", success: false });
    }

    if (!newPassword) {
      return res.status(400).json({ message: "Please enter your new password", success: false });
    }

    const hashNewPass = await bcrypt.hash(newPassword, 10);
    
    user.password = hashNewPass;

    await user.save();

    return res.status(200).json({ message: "Your password has been updated successfully", success: true });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};
