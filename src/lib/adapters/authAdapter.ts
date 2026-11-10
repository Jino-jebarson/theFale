// src/lib/adapters/authAdapter.ts
// Authentication adapter bridging UI views to Spring Boot /api/v1/auth endpoints

import { apiFetch, getAccessToken, setAccessToken, isApiEnabled } from "@/lib/api";

export interface UserSummary {
  id: string;
  phone: string;
  email?: string;
  username?: string;
  role: "ROLE_CANDIDATE" | "ROLE_FACILITY" | "ROLE_ADMIN";
  candidateLevel?: "STUDENT" | "FRESHER" | "PROFESSIONAL";
  onboarded: boolean;
  onboardingComplete?: boolean;
  active: boolean;
}

export interface AuthResponse {
  accessToken: string;
  tokenType?: string;
  role?: "ROLE_CANDIDATE" | "ROLE_FACILITY" | "ROLE_ADMIN";
  candidateLevel?: "STUDENT" | "FRESHER" | "PROFESSIONAL";
  onboarded: boolean;
  expiresIn?: number;
  user: UserSummary;
}

export interface OtpResponse {
  message: string;
  expiresInSeconds: number;
}

/**
 * Request a 6-digit OTP for the given phone number.
 * @param phone Formatted phone with country code (e.g. +91 9876543210 or 9876543210)
 * @param role "ROLE_CANDIDATE" or "ROLE_FACILITY"
 */
export async function sendOtp(phone: string, role?: string): Promise<OtpResponse> {
  const cleanPhone = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`;
  return apiFetch<OtpResponse>("/auth/otp/send", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ phone: cleanPhone, role }),
  });
}

/**
 * Verify 6-digit OTP, store access token in memory, and set refresh cookie.
 */
export async function verifyOtp(phone: string, otp: string, role?: string): Promise<AuthResponse> {
  const cleanPhone = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`;
  const response = await apiFetch<AuthResponse>("/auth/otp/verify", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ phone: cleanPhone, otp: otp.trim(), role }),
  });

  if (response?.accessToken) {
    setAccessToken(response.accessToken);
  }
  return response;
}

/**
 * Fetch authenticated user profile summary.
 */
export async function getCurrentUser(): Promise<UserSummary> {
  return apiFetch<UserSummary>("/auth/me");
}

/**
 * Attempt session refresh using HttpOnly cookie.
 */
export async function refreshSession(): Promise<AuthResponse | null> {
  try {
    const response = await apiFetch<AuthResponse>("/auth/refresh", {
      method: "POST",
      skipAuth: true,
      skipRefresh: true,
    });
    if (response?.accessToken) {
      setAccessToken(response.accessToken);
    }
    return response;
  } catch {
    setAccessToken(null);
    return null;
  }
}

/**
 * Log out current session, revoke refresh token on backend, and clear in-memory state.
 */
export async function logout(): Promise<void> {
  try {
    if (getAccessToken()) {
      await apiFetch("/auth/logout", {
        method: "POST",
        skipRefresh: true,
      });
    }
  } catch {
    // Ignore network error on logout
  } finally {
    setAccessToken(null);
  }
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

/**
 * Authenticate administrator with email and password against backend /api/v1/auth/admin/login.
 */
export async function adminLogin(email: string, password: string): Promise<AuthResponse> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const response = await apiFetch<AuthResponse>("/auth/admin/login", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ email: cleanEmail, password }),
    });

    if (response?.accessToken) {
      setAccessToken(response.accessToken);
    }
    return response;
  } catch (err: any) {
    if (!isApiEnabled || err?.message?.includes("Failed to fetch") || err?.status === 0) {
      // Offline / dev fallback for local frontend testing
      const mockAdmin: AuthResponse = {
        accessToken: "mock-admin-token-" + Date.now(),
        role: "ROLE_ADMIN",
        onboarded: true,
        user: {
          id: "adm-001",
          phone: "+919876543210",
          role: "ROLE_ADMIN",
          onboarded: true,
          active: true,
        },
      };
      setAccessToken(mockAdmin.accessToken);
      return mockAdmin;
    }
    throw err;
  }
}

export interface AdminSignupData {
  username: string;
  workingmailid: string;
  password: string;
  passcode: string;
}

export interface AdminForgotPasswordData {
  workingmailid: string;
  passcode: string;
  newPassword: string;
}

export const ADMIN_STATIC_PASSCODE = "FALE907010";

/**
 * Register a new administrator with secured passcode against backend /api/v1/auth/admin/signup.
 */
export async function adminSignup(data: AdminSignupData): Promise<AuthResponse> {
  const cleanEmail = data.workingmailid.trim().toLowerCase();
  const cleanUsername = data.username.trim();
  const cleanPasscode = data.passcode.trim();

  try {
    const response = await apiFetch<AuthResponse>("/auth/admin/signup", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({
        username: cleanUsername,
        workingmailid: cleanEmail,
        password: data.password,
        passcode: cleanPasscode,
      }),
    });

    if (response?.accessToken) {
      setAccessToken(response.accessToken);
    }
    return response;
  } catch (err: any) {
    if (!isApiEnabled || err?.message?.includes("Failed to fetch") || err?.status === 0) {
      if (cleanPasscode !== ADMIN_STATIC_PASSCODE) {
        throw new Error("Invalid administrator authorization passcode.");
      }
      const mockAdmin: AuthResponse = {
        accessToken: "mock-admin-token-" + Date.now(),
        role: "ROLE_ADMIN",
        onboarded: true,
        user: {
          id: "adm-" + Date.now(),
          phone: "+919876543210",
          email: cleanEmail,
          username: cleanUsername,
          role: "ROLE_ADMIN",
          onboarded: true,
          active: true,
        },
      };
      setAccessToken(mockAdmin.accessToken);
      return mockAdmin;
    }
    throw err;
  }
}

/**
 * Reset administrator password with secured passcode against backend /api/v1/auth/admin/forgot-password.
 */
export async function adminForgotPassword(data: AdminForgotPasswordData): Promise<{ message: string }> {
  const cleanEmail = data.workingmailid.trim().toLowerCase();
  const cleanPasscode = data.passcode.trim();

  try {
    const response = await apiFetch<{ message: string }>("/auth/admin/forgot-password", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({
        workingmailid: cleanEmail,
        passcode: cleanPasscode,
        newPassword: data.newPassword,
      }),
    });
    return response;
  } catch (err: any) {
    if (!isApiEnabled || err?.message?.includes("Failed to fetch") || err?.status === 0) {
      if (cleanPasscode !== ADMIN_STATIC_PASSCODE) {
        throw new Error("Invalid administrator authorization passcode.");
      }
      return { message: "Password reset successfully. You can now sign in with your new credentials." };
    }
    throw err;
  }
}
