import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { User, UserRole } from "@/types/models";

export class UserManager {
  private collectionName = "users";

  // Get user by ID
  async getUserById(id: string): Promise<User | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as User;
    }
    return null;
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    const q = query(
      collection(db, this.collectionName),
      where("email", "==", email)
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as User;
    }
    return null;
  }

  // Update user
  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  // Update user role
  async updateUserRole(id: string, role: UserRole): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      role,
      updatedAt: serverTimestamp(),
    });
  }

  // Get all users by role
  async getUsersByRole(role: UserRole): Promise<User[]> {
    const q = query(
      collection(db, this.collectionName),
      where("role", "==", role)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as User);
  }

  // Check if user has permission
  canWrite(user: User): boolean {
    return [UserRole.WRITER, UserRole.EDITOR, UserRole.ADMIN].includes(user.role);
  }

  canEdit(user: User): boolean {
    return [UserRole.EDITOR, UserRole.ADMIN].includes(user.role);
  }

  canAdmin(user: User): boolean {
    return user.role === UserRole.ADMIN;
  }
}

export const userManager = new UserManager();
