import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, setDoc, query, collection, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { hashPassword, verifyPassword, isValidEmail, isValidPassword } from "@/lib/password";
import { createToken, setAuthCookie } from "@/lib/auth";
import { UserRole } from "@/types/models";

// POST /api/auth/register
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, displayName } = body;

    // Validation
    if (!email || !password || !displayName) {
      return NextResponse.json(
        { success: false, error: "Tüm alanlar zorunludur" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Geçersiz email adresi" },
        { status: 400 }
      );
    }

    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.errors[0] },
        { status: 400 }
      );
    }

    // Check if user already exists
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email.toLowerCase()));
    const existingUsers = await getDocs(q);

    if (!existingUsers.empty) {
      return NextResponse.json(
        { success: false, error: "Bu email adresi zaten kullanımda" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const userId = crypto.randomUUID();
    const userRef = doc(db, "users", userId);

    const userData = {
      id: userId,
      email: email.toLowerCase(),
      displayName,
      role: UserRole.READER, // Default role
      passwordHash: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(userRef, userData);

    // Create JWT token
    const token = await createToken({
      userId,
      email: email.toLowerCase(),
      role: UserRole.READER,
    });

    // Set cookie
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: userId,
          email: email.toLowerCase(),
          displayName,
          role: UserRole.READER,
        },
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, error: "Kayıt sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}
