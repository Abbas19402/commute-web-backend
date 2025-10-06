
import type { Request, Response } from 'express';
import AdminUser from '../models/AdminUser.ts';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import DriverUser, { DriverRideStatus } from '../models/DriverUserAccount.ts';
import Ride from '../models/Rides.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';


// Signup controller
export const signup = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, email, password, phone } = req.body;

        // Check if user already exists
        const existingUser = await AdminUser.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new AdminUser({
            firstName,
            lastName,
            email,
            phone,
            password: hashedPassword,
        });

        await newUser.save();
        
          // Create JWT
        const token = jwt.sign(
            { id: newUser._id, email: newUser.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set cookie (httpOnly for security)
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // true in prod (HTTPS)
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
     
     const userObj = newUser.toObject();

     // Remove password
        const cloneObject = JSON.parse(JSON.stringify(userObj));
        delete cloneObject.password;    
      res.status(201).json({ message: 'User registered successfully', user: cloneObject  });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Login controller
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // 1. Check if user exists
        const user = await AdminUser.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // 2. Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // 3. Generate JWT
        const token = jwt.sign(
            { id: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // 4. Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
            const userObj = user.toObject();

     // Remove password
        const cloneObject = JSON.parse(JSON.stringify(userObj));
        delete cloneObject.password;    
      res.status(201).json({ message: 'Login successful', user: cloneObject, token  });

        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Logout controller
export const logout = (req: Request, res: Response) => {
    console.log('Logout endpoint hit');
  // Clear the cookie
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0 // expire immediately
  });

  res.status(200).json({ message: 'Logged out successfully' });
};


export const assign = async (req: Request, res: Response) => {
  try {
    const {
      adminId,
      rideStartAt,
      rideEndAt,
      isRideStarted,
      isRideEnded,
      date,
      distance,
      leg,
      lastDriverLocation,
      route
    } = req.body;

    
    const availableDriver = await DriverUser.findOneAndUpdate(
      { status: DriverRideStatus.AVAILABLE },
      { status: DriverRideStatus.NOT_AVAILABLE },
      { new: true }
    );

    if (!availableDriver) {
      return res.status(404).json({ message: 'No available drivers found' });
    }

    
    const newRide = new Ride({
      adminId,
      driverId: availableDriver.id, 
      rideStartAt,
      rideEndAt,
      isRideStarted,
      isRideEnded,
      date,
      distance,
      leg,
      lastDriverLocation,
      route
    });

    await newRide.save(); 

    return res.status(200).json({
      ride: newRide,
      message: 'Ride assigned successfully'
    });

  } catch (error) {
    console.error('Error assigning driver:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
