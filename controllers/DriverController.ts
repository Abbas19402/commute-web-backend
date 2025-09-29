
import type { Request, Response } from 'express';
import DriverUserAccount from '../models/DriverUserAccount.ts';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';


// Signup controller
export const signup = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, email, password, phone } = req.body;

        // Check if user already exists
        const existingDriver = await DriverUserAccount.findOne({ email });
        if (existingDriver) {
            return res.status(400).json({ message: 'Driver already exists' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newDriver = new DriverUserAccount({
            firstName,
            lastName,
            email,
            phone,
            password: hashedPassword,
        });

        await newDriver.save();
          // Create JWT
        const driverToken = jwt.sign(
            { id: newDriver._id, email: newDriver.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set cookie (httpOnly for security)
        res.cookie('driverToken', driverToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // true in prod (HTTPS)
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
           
await newDriver.save();  

// Fetch the full document including defaults
const savedDriver = await DriverUserAccount.findById(newDriver._id); 
if (!savedDriver) throw new Error("Driver not found after save");

         const driverObj = savedDriver.toObject();

     // Remove password
        const cloneObject = JSON.parse(JSON.stringify(driverObj));
        delete cloneObject.password;    
      res.status(201).json({ message: 'Driver registered successfully', driver: cloneObject  });

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
        const driver = await DriverUserAccount.findOne({ email });
        if (!driver) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // 2. Compare password
        const isMatch = await bcrypt.compare(password, driver.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // 3. Generate JWT
        const driverToken = jwt.sign(
            { id: driver._id, email: driver.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // 4. Set cookie
        res.cookie('driverToken', driverToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

          const driverObj = driver.toObject();

     // Remove password
        const cloneObject = JSON.parse(JSON.stringify(driverObj));
        delete cloneObject.password;    
      res.status(201).json({ message: 'Login successful', driver: cloneObject  });


       
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Logout controller
export const logout = (req: Request, res: Response) => {
  // Clear the cookie
  res.cookie('driverToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0 // expire immediately
  });

  res.status(200).json({ message: 'Logged out successfully' });
};