import { Cookie, APIError, Gateway, api } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { getAuthData } from "~encore/auth";
import * as crypto from "crypto";
import db from "../db/index";

interface AuthParams {
  session?: Cookie<"session">;
}

export interface AuthData {
  userID: string;
  email: string;
}

interface SessionRow {
  user_id: bigint;
  email: string;
}

export const auth = authHandler<AuthParams, AuthData>(async (data) => {
  const token = data.session?.value;
  if (!token) {
    throw APIError.unauthenticated("missing session");
  }

  const result = await db.queryRow<SessionRow>`
    SELECT u.id as user_id, u.email
    FROM users u
    WHERE u.id = (
      SELECT user_id FROM sessions WHERE token = ${token} AND expires_at > NOW()
    )
  `;

  if (!result) {
    throw APIError.unauthenticated("invalid or expired session");
  }

  return {
    userID: result.user_id.toString(),
    email: result.email,
  };
});

export const gw = new Gateway({ authHandler: auth });

export interface SignupRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  session: Cookie<"session">;
  user: {
    id: string;
    email: string;
  };
}

export interface UserInfo {
  id: string;
  email: string;
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export const signup = api<SignupRequest, AuthResponse>(
  { expose: true, method: "POST", path: "/auth/signup" },
  async (req) => {
    const passwordHash = hashPassword(req.password);

    const existingUser = await db.queryRow`
      SELECT id FROM users WHERE email = ${req.email}
    `;

    if (existingUser) {
      throw APIError.alreadyExists("user with this email already exists");
    }

    const result = await db.queryRow<{ id: bigint }>`
      INSERT INTO users (email, password_hash)
      VALUES (${req.email}, ${passwordHash})
      RETURNING id
    `;

    if (!result) {
      throw APIError.internal("failed to create user");
    }

    const userId = result.id;
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.exec`
      INSERT INTO sessions (user_id, token, expires_at)
      VALUES (${userId}, ${token}, ${expiresAt})
    `;

    return {
      session: {
        value: token,
        expires: expiresAt,
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
      },
      user: {
        id: userId.toString(),
        email: req.email,
      },
    };
  }
);

export const login = api<LoginRequest, AuthResponse>(
  { expose: true, method: "POST", path: "/auth/login" },
  async (req) => {
    const passwordHash = hashPassword(req.password);

    const result = await db.queryRow<{ id: bigint; email: string }>`
      SELECT id, email FROM users
      WHERE email = ${req.email} AND password_hash = ${passwordHash}
    `;

    if (!result) {
      throw APIError.unauthenticated("invalid email or password");
    }

    const userId = result.id;
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.exec`
      INSERT INTO sessions (user_id, token, expires_at)
      VALUES (${userId}, ${token}, ${expiresAt})
    `;

    return {
      session: {
        value: token,
        expires: expiresAt,
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
      },
      user: {
        id: userId.toString(),
        email: result.email,
      },
    };
  }
);

export const logout = api<void, { session: Cookie<"session"> }>(
  { auth: true, expose: true, method: "POST", path: "/auth/logout" },
  async () => {
    return {
      session: {
        value: "",
        expires: new Date(0),
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
      },
    };
  }
);

export const getCurrentUser = api<void, UserInfo>(
  { auth: true, expose: true, method: "GET", path: "/auth/me" },
  async () => {
    const authData = getAuthData()!;
    return {
      id: authData.userID,
      email: authData.email,
    };
  }
);
