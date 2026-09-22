import mongoose from "mongoose";

function getSanitizedMongoUri(): string {
  let raw =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27017/Grain";

  raw = raw.trim();

  // Strip accidental "MONGODB_URI=" or "MONGO_URI=" prefix if pasted into Vercel value field
  if (raw.includes("=")) {
    const idx = raw.indexOf("=");
    const afterEqual = raw.slice(idx + 1).trim();
    if (afterEqual.startsWith("mongodb://") || afterEqual.startsWith("mongodb+srv://")) {
      raw = afterEqual;
    }
  }

  // Strip leading and trailing quotes: "..." or '...'
  raw = raw.replace(/^["']+|["']+$/g, "").trim();

  // Extract mongodb connection string if any stray text exists
  const match = raw.match(/(mongodb(?:\+srv)?:\/\/[^\s"']+)/);
  if (match && match[1]) {
    raw = match[1];
  }

  // On Windows, localhost can sometimes resolve to IPv6 ::1 where MongoDB is bound to IPv4 127.0.0.1
  if (raw.includes("localhost")) {
    raw = raw.replace("localhost", "127.0.0.1");
  }

  return raw;
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

    const uri = getSanitizedMongoUri();
    cached!.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
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
