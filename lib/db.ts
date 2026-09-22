import mongoose from "mongoose";

let MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/Grain";
// On Windows, localhost can sometimes resolve to IPv6 ::1 where MongoDB is bound to IPv4 127.0.0.1
if (MONGODB_URI.includes("localhost")) {
  MONGODB_URI = MONGODB_URI.replace("localhost", "127.0.0.1");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached!.conn && cached!.conn.connection.readyState === 1) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log(`Connected to MongoDB database: ${mongooseInstance.connection.name}`);
      return mongooseInstance;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    console.error("Failed to connect to MongoDB:", e);
    throw e;
  }

  return cached!.conn;
}
