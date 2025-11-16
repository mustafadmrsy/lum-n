import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// GET /api/auth/me
export async function GET() {
  try {
    const tokenUser = await getCurrentUser();

    if (!tokenUser) {
      return NextResponse.json(
        { success: false, error: "Oturum bulunamadı" },
        { status: 401 }
      );
    }

    // Get fresh user data from database
    const userRef = doc(db, "users", tokenUser.userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı bulunamadı" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: userData.id,
          email: userData.email,
          displayName: userData.displayName,
          role: userData.role,
          photoURL: userData.photoURL,
          bio: userData.bio,
        },
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { success: false, error: "Kullanıcı bilgileri alınamadı" },
      { status: 500 }
    );
  }
}
