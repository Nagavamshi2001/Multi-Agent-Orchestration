import { ObjectId } from 'mongodb';
import { getCollection, nowMs } from './client.js';

export const upsertUserByGoogleSub = async ({ googleSub, email, name, picture, linkUserId }) => {
  const users = getCollection('users');
  const ts = nowMs();

  // If a specific userId is provided (user is already logged in with local auth)
  if (linkUserId) {
    await users.updateOne(
      { _id: new ObjectId(linkUserId) },
      { $set: { google_sub: googleSub, name: name || undefined, picture: picture || undefined, updated_at: ts } }
    );
    return linkUserId;
  }

  // Otherwise, find existing user by google_sub or email
  const existing = await users.findOne({ $or: [{ google_sub: googleSub }, { email }] });
  
  if (existing) {
    await users.updateOne(
      { _id: existing._id },
      { $set: { google_sub: googleSub, email, name: name || existing.name || null, picture: picture || existing.picture || null, updated_at: ts } }
    );
    return existing._id.toString();
  }
  const result = await users.insertOne({
    google_sub: googleSub,
    email,
    name: name || null,
    picture: picture || null,
    created_at: ts,
    updated_at: ts,
  });
  return result.insertedId.toString();
};

export const createUserWithPassword = async ({ email, passwordHash, name }) => {
  const users = getCollection('users');
  const ts = nowMs();
  const result = await users.insertOne({
    email,
    password_hash: passwordHash,
    name: name || null,
    created_at: ts,
    updated_at: ts,
  });
  return result.insertedId.toString();
};

export const getUserByEmail = async (email) => {
  const users = getCollection('users');
  const row = await users.findOne({ email });
  if (!row) return null;
  return {
    id: row._id.toString(),
    email: row.email,
    name: row.name,
    picture: row.picture,
    password_hash: row.password_hash,
    google_sub: row.google_sub
  };
};

export const getUserById = async (userId) => {
  const users = getCollection('users');
  const row = await users.findOne(
    { _id: new ObjectId(userId) },
    { projection: { google_sub: 1, email: 1, name: 1, picture: 1, password_hash: 1 } }
  );
  if (!row) return null;
  return {
    id: row._id.toString(),
    google_sub: row.google_sub,
    email: row.email,
    name: row.name,
    picture: row.picture,
    has_password: !!row.password_hash,
  };
};

export const updateUserPassword = async (userId, passwordHash) => {
  const users = getCollection('users');
  const ts = nowMs();
  await users.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { password_hash: passwordHash, updated_at: ts } }
  );
};

export const upsertGoogleTokens = async ({
  userId,
  refreshTokenEnc,
  scope,
  tokenType,
  accessTokenEnc,
  expiryDate,
}) => {
  const tokens = getCollection('google_tokens');
  const existing = await tokens.findOne({ user_id: userId });
  const ts = nowMs();
  const doc = {
    user_id: userId,
    refresh_token_enc: refreshTokenEnc ?? existing?.refresh_token_enc ?? null,
    scope: scope ?? existing?.scope ?? null,
    token_type: tokenType ?? existing?.token_type ?? null,
    access_token_enc: accessTokenEnc ?? existing?.access_token_enc ?? null,
    expiry_date: expiryDate ?? existing?.expiry_date ?? null,
    updated_at: ts,
  };
  if (existing) {
    await tokens.updateOne({ user_id: userId }, { $set: doc });
  } else {
    await tokens.insertOne({
      ...doc,
      created_at: ts,
    });
  }
};

export const getGoogleTokensByUserId = async (userId) => {
  const tokens = getCollection('google_tokens');
  const row = await tokens.findOne(
    { user_id: userId },
    { projection: { user_id: 1, refresh_token_enc: 1, scope: 1, token_type: 1, access_token_enc: 1, expiry_date: 1 } }
  );
  if (!row) return null;
  return {
    user_id: typeof row.user_id === 'string' ? row.user_id : row.user_id?.toString?.() ?? row.user_id,
    refresh_token_enc: row.refresh_token_enc,
    scope: row.scope,
    token_type: row.token_type,
    access_token_enc: row.access_token_enc,
    expiry_date: row.expiry_date,
  };
};

export const unlinkGoogleFromUser = async (userId) => {
  const users = getCollection('users');
  const tokens = getCollection('google_tokens');
  const ts = nowMs();
  
  await users.updateOne(
    { _id: new ObjectId(userId) },
    { 
      $unset: { google_sub: "" }, 
      $set: { updated_at: ts } 
    }
  );
  
  await tokens.deleteMany({ user_id: userId });
};
