

// models/Ride.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IRide extends Document {
  adminId: mongoose.Types.ObjectId;
  driverId: mongoose.Types.ObjectId;
  rideStartAt: number;
  rideEndAt: number;
  isRideStarted: boolean;
  isRideEnded: boolean;
  date: number;
  distance: string;
}

const RideSchema: Schema<IRide> = new Schema({
  adminId:       { type: Schema.Types.ObjectId, ref: 'AdminUser', required: true },
  driverId:      { type: Schema.Types.ObjectId, ref: 'DriverUser', required: true },
  rideStartAt:   { type: Number, required: true },
  rideEndAt:     { type: Number },
  isRideStarted: { type: Boolean, default: false },
  isRideEnded:   { type: Boolean, default: false },
  date:          { type: Number, required: true },
  distance:      { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<IRide>('Ride', RideSchema);
