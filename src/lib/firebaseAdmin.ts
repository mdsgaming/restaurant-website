// firebase-admin is not Edge Runtime compatible (uses gRPC, jsonwebtoken, jwks-rsa).
// All auth and Firestore operations now use REST APIs directly.
// See: firebaseAuthRest.ts, firestoreRest.ts, googleAuth.ts
export {}
