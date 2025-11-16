import { NextRequest, NextResponse } from "next/server";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { verifyPassword, isValidEmail } from "@/lib/password";
import { createToken, setAuthCookie } from "@/lib/auth";

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email ve şifre gereklidir" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Geçersiz email adresi" },
        { status: 400 }
      );
    }

    // Find user
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email.toLowerCase()));
    const userSnapshot = await getDocs(q);

    if (userSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: "Email veya şifre hatalı" },
        { status: 401 }
      );
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    // Verify password
    const isValidPassword = await verifyPassword(password, userData.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Email veya şifre hatalı" },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await createToken({
      userId: userData.id,
      email: userData.email,
      role: userData.role,
    });

    // Set cookie
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: userData.id,
          email: userData.email,
          displayName: userData.displayName,
          role: userData.role,
          photoURL: userData.photoURL,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Giriş sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}
