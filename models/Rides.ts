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
  direction: DirectionsResponse | null;
}

export interface DirectionsResponse {
  routes: Route[];
}
 
export interface Route {
  legs: Leg[];
}
 
export interface Leg {
  start_address: string;
  end_address: string;
  start_location: Coordinates;
  end_location: Coordinates;
  distance: Distance;
  duration: Duration;
}
 
export interface Coordinates {
  lat: number;
  lng: number;
}
 
export interface Distance {
  text: string;   // e.g., "215 mi"
  value: number;  // in meters
}
 
export interface Duration {
  text: string;   // e.g., "3 hours 45 mins"
  value: number;  // in seconds
}
const RideSchema: Schema<IRide> = new Schema({
  adminId:       { type: Schema.Types.ObjectId, ref: 'AdminUser', required: true },
  driverId:      { type: Schema.Types.ObjectId, ref: 'DriverUser', required: true },
  rideStartAt:   { type: Number, required: true },
  rideEndAt:     { type: Number },
  isRideStarted: { type: Boolean, default: false },
  isRideEnded:   { type: Boolean, default: false },
  date:          { type: Number, required: true },
  distance:      { type: String, required: true },
  direction: {
    type: {
      routes: [
        {
          legs: [
            {
              start_address: String,
              end_address: String,
              start_location: {
                lat: Number,
                lng: Number,
              },
              end_location: {
                lat: Number,
                lng: Number,
              },
              distance: {
                text: String,
                value: Number,
              },
              duration: {
                text: String,
                value: Number,
              },
            },
          ],
        },
      ],
    },
    required: true,
  }
}, { timestamps: true });

export default mongoose.model<IRide>('Ride', RideSchema);
