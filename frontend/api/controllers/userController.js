import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { mockUsers } from '../utils/mockStore.js';

const isConnected = () => mongoose.connection.readyState === 1;

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!isConnected()) {
    // In-memory register fallback
    const userExists = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = {
      _id: `mock-user-${Date.now()}`,
      name,
      email,
      passwordHash: bcrypt.hashSync(password, 10)
    };

    mockUsers.push(newUser);

    return res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      token: generateToken(newUser._id)
    });
  }

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
  const { email, password } = req.body;

  if (!isConnected()) {
    // In-memory auth fallback
    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user && bcrypt.compareSync(password, user.passwordHash)) {
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
      });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  }

  try {
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  if (!isConnected()) {
    // In-memory profile lookup
    const user = mockUsers.find(u => u._id === req.user._id);
    if (user) {
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email
      });
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  }

  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { registerUser, authUser, getUserProfile };
