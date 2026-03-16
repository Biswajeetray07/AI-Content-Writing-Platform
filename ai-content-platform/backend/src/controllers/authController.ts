import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../services/supabase";
import { AuthRequest } from "../middlewares/authMiddleware";
import { v4 as uuidv4 } from "uuid";

const SALT_ROUNDS = 12;

/**
 * POST /auth/register
 * Creates a new user with hashed password.
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: "Email and password are required" });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ success: false, error: "Password must be at least 8 characters" });
      return;
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("User")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      res.status(409).json({ success: false, error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const now = new Date().toISOString();

    const { data: user, error: insertError } = await supabase
      .from("User")
      .insert({
        id: uuidv4(),
        email,
        passwordHash,
        name: name || null,
        role: "USER",
        createdAt: now,
        updatedAt: now,
      })
      .select("id, email, name, role, createdAt")
      .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      res.status(500).json({ success: false, error: "Registration failed" });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.status(201).json({ success: true, user, token });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, error: "Registration failed" });
  }
};

/**
 * POST /auth/login
 * Authenticates user and returns JWT.
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: "Email and password are required" });
      return;
    }

    const { data: user, error } = await supabase
      .from("User")
      .select("id, email, passwordHash, name, role")
      .eq("email", email)
      .single();

    if (error || !user) {
      res.status(401).json({ success: false, error: "Invalid credentials" });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      res.status(401).json({ success: false, error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, error: "Login failed" });
  }
};

/**
 * GET /auth/me
 * Returns authenticated user's profile.
 */
export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Not authenticated" });
      return;
    }

    const { data: user, error } = await supabase
      .from("User")
      .select("id, email, name, role, createdAt")
      .eq("id", req.user.id)
      .single();

    if (error || !user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Me error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch profile" });
  }
};
