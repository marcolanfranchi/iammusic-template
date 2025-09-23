const admin = require('firebase-admin');
const crypto = require('crypto');

// const PUSH_PAUSE_RATE = 5 * 1000; // 5s between pushes per client
// const rateLimitStore = new Map();

// Init Firebase Admin
function initFirebase() {
  if (!admin.apps.length) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountJson) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT env var not set");
    }
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({ 
      credential: admin.credential.cert(serviceAccount) 
    });
  }
  return admin.firestore();
}

// Validation
function validateEntry(entry) {
  if (!entry.text || entry.text.trim().length === 0) {
    throw new Error("Text cannot be empty");
  }
  if (entry.text.length > 25) {
    throw new Error("Text cannot exceed 25 characters");
  }
  return {
    text: entry.text.trim(),
    ip: entry.ip || null,
    country: entry.country || null,
    region: entry.region || null,
    city: entry.city || null,
    location: entry.location || null,
    os: entry.os || null,
  };
}

// Client identifier (still useful if you later re-enable rate limiting)
function getClientIdentifier(req, entry) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
           req.headers['x-real-ip'] || 
           req.connection?.remoteAddress || 
           'unknown';
  const userAgent = req.headers['user-agent'] || '';
  return crypto.createHash('sha256').update(`${ip}:${userAgent}`).digest('hex');
}

// Duplicate check
async function isDuplicateEntry(db, entry) {
  try {
    const snapshot = await db
      .collection("texts")
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) return false;

    const recent = snapshot.docs[0].data();
    const ts = recent.timestamp?.toDate();
    if (ts) {
      const diffMs = Date.now() - ts.getTime();
      if (
        diffMs < 0.5 * 60 * 1000 &&
        recent.text === entry.text &&
        recent.ip === entry.ip &&
        recent.os === entry.os
      ) {
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error("Duplicate check failed:", err.message);
    return false;
  }
}

// Main handler function
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ message: "Use POST to save text" });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('API: Save request received');

    const db = initFirebase();
    const entry = validateEntry(req.body);
    const identifier = getClientIdentifier(req, entry);

    // --- Rate limit temporarily disabled ---
    // if (!checkRateLimit(identifier)) {
    //   console.log('API: Rate limit exceeded for', identifier);
    //   return res.status(429).json({ error: `Rate limit exceeded. Wait ${PUSH_PAUSE_RATE / 1000}s.` });
    // }

    // Check for duplicates
    const isDuplicate = await isDuplicateEntry(db, entry);
    if (isDuplicate) {
      console.log('API: Duplicate entry detected, not saved');
      return res.status(200).json({ message: "Duplicate entry, not saved", saved: false });
    }

    // rateLimitStore.set(identifier, Date.now()); // disabled

    // Save to database
    await db.collection("texts").add({
      timestamp: new Date(),
      ...entry,
    });

    console.log('API: Successfully saved');

    return res.status(200).json({ 
      message: "Text saved successfully", 
      saved: true 
    });

  } catch (err) {
    console.error('API Error:', err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
