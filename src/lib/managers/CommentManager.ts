import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { Comment } from "@/types/models";

export class CommentManager {
  private collectionName = "comments";

  // Create comment
  async createComment(
    commentData: Omit<Comment, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const docRef = await addDoc(collection(db, this.collectionName), {
      ...commentData,
      isApproved: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  // Get comment by ID
  async getCommentById(id: string): Promise<Comment | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Comment;
    }
    return null;
  }

  // Get comments by blog ID
  async getCommentsByBlog(blogId: string, approvedOnly = true): Promise<Comment[]> {
    let q = query(
      collection(db, this.collectionName),
      where("blogId", "==", blogId),
      orderBy("createdAt", "desc")
    );

    if (approvedOnly) {
      q = query(q, where("isApproved", "==", true));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Comment);
  }

  // Get pending comments (for moderation)
  async getPendingComments(): Promise<Comment[]> {
    const q = query(
      collection(db, this.collectionName),
      where("isApproved", "==", false),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Comment);
  }

  // Approve comment
  async approveComment(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      isApproved: true,
      updatedAt: serverTimestamp(),
    });
  }

  // Update comment
  async updateComment(id: string, updates: Partial<Comment>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  // Delete comment
  async deleteComment(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }

  // Get replies to a comment
  async getReplies(parentId: string): Promise<Comment[]> {
    const q = query(
      collection(db, this.collectionName),
      where("parentId", "==", parentId),
      where("isApproved", "==", true),
      orderBy("createdAt", "asc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Comment);
  }
}

export const commentManager = new CommentManager();
