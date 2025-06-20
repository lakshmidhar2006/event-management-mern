import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const otpStore = new Map();

const generateToken = (id, role, name, email) => {
  return jwt.sign({ id, role, name, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const sendOTP = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.ADMIN_EMAIL, 
      pass: process.env.ADMIN_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `Eventhon <${process.env.ADMIN_EMAIL}>`,
    to: email,
    subject: 'Verify your email for Eventhon Signup',
    text: `Your OTP is: ${otp}. It is valid for 3 minutes.`,
  });
};

export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      isActivated: false
    });

    await user.save();

   const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 3 * 60 * 1000
    });

    await sendOTP(email, otp);

    // Auto-cleanup after 3 min if not verified
    setTimeout(async () => {
      const entry = otpStore.get(email);
      if (entry && Date.now() > entry.expiresAt) {
        await User.deleteOne({ email });
        otpStore.delete(email);
        console.log(`Deleted unverified user: ${email}`);
      }
    }, 3 * 60 * 1000);

    res.status(200).json({ message: 'OTP sent to email. Please verify.' });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Error registering user', error: err.message });
  }
};

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  const data = otpStore.get(email);
  if (!data) {
    return res.status(400).json({ message: 'OTP expired or not requested' });
  }

  if (Date.now() > data.expiresAt) {
    otpStore.delete(email);
    await User.deleteOne({ email });
    return res.status(400).json({ message: 'OTP expired' });
  }

  if (data.otp !== otp) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  otpStore.delete(email);
  await User.findOneAndUpdate({ email }, { isActivated: true });

  res.status(200).json({ message: 'Account verified successfully' });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.isActivated) {
      return res.status(403).json({ message: 'Please verify your email to activate your account' });
    }

    const token = generateToken(user._id, user.role, user.name, user.email);

    res.cookie('accesstoken', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      user: { name: user.name, email: user.email, role: user.role },
      token
    });

  } catch (err) {
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
};
