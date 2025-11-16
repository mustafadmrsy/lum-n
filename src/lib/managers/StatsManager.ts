import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  Timestamp,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { BlogStats, Share, Like, View } from "@/types/models";

export class StatsManager {
  private statsCollection = "blog_stats";
  private sharesCollection = "shares";
  private likesCollection = "likes";
  private viewsCollection = "views";

  // Get or create stats for a blog
  async getStats(blogId: string): Promise<BlogStats> {
    const docRef = doc(db, this.statsCollection, blogId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { blogId, ...docSnap.data() } as BlogStats;
    }

    // Create initial stats
    const initialStats: BlogStats = {
      blogId,
      views: 0,
      uniqueViews: 0,
      likes: 0,
      shares: {
        total: 0,
        twitter: 0,
        facebook: 0,
        linkedin: 0,
        whatsapp: 0,
        embed: 0,
      },
      comments: 0,
      updatedAt: Timestamp.now(),
    };

    await setDoc(docRef, initialStats);
    return initialStats;
  }

  // Increment view count
  async incrementViews(blogId: string, isUnique: boolean): Promise<void> {
    const docRef = doc(db, this.statsCollection, blogId);
    const updates: Record<string, unknown> = {
      views: increment(1),
      lastViewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (isUnique) {
      updates.uniqueViews = increment(1);
    }

    await updateDoc(docRef, updates);
  }

  // Record a view
  async recordView(
    blogId: string,
    sessionId: string,
    userId?: string,
    userAgent?: string,
    referrer?: string
  ): Promise<void> {
    await addDoc(collection(db, this.viewsCollection), {
      blogId,
      sessionId,
      userId,
      userAgent,
      referrer,
      createdAt: serverTimestamp(),
    });

    // Check if it's a unique view for this session
    await this.incrementViews(blogId, !userId);
  }

  // Increment like count
  async incrementLikes(blogId: string): Promise<void> {
    const docRef = doc(db, this.statsCollection, blogId);
    await updateDoc(docRef, {
      likes: increment(1),
      updatedAt: serverTimestamp(),
    });
  }

  // Decrement like count
  async decrementLikes(blogId: string): Promise<void> {
    const docRef = doc(db, this.statsCollection, blogId);
    await updateDoc(docRef, {
      likes: increment(-1),
      updatedAt: serverTimestamp(),
    });
  }

  // Record a like
  async recordLike(blogId: string, userId: string): Promise<string> {
    const docRef = await addDoc(collection(db, this.likesCollection), {
      blogId,
      userId,
      createdAt: serverTimestamp(),
    });

    await this.incrementLikes(blogId);
    return docRef.id;
  }

  // Remove a like
  async removeLike(likeId: string, blogId: string): Promise<void> {
    const docRef = doc(db, this.likesCollection, likeId);
    await updateDoc(docRef, { deleted: true });
    await this.decrementLikes(blogId);
  }

  // Record a share
  async recordShare(
    blogId: string,
    platform: Share["platform"],
    userId?: string,
    referrer?: string
  ): Promise<void> {
    await addDoc(collection(db, this.sharesCollection), {
      blogId,
      platform,
      userId,
      referrer,
      createdAt: serverTimestamp(),
    });

    // Update stats
    const docRef = doc(db, this.statsCollection, blogId);
    await updateDoc(docRef, {
      "shares.total": increment(1),
      [`shares.${platform}`]: increment(1),
      updatedAt: serverTimestamp(),
    });
  }

  // Increment comment count
  async incrementComments(blogId: string): Promise<void> {
    const docRef = doc(db, this.statsCollection, blogId);
    await updateDoc(docRef, {
      comments: increment(1),
      updatedAt: serverTimestamp(),
    });
  }

  // Decrement comment count
  async decrementComments(blogId: string): Promise<void> {
    const docRef = doc(db, this.statsCollection, blogId);
    await updateDoc(docRef, {
      comments: increment(-1),
      updatedAt: serverTimestamp(),
    });
  }
}

export const statsManager = new StatsManager();
