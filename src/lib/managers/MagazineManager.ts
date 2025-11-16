import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Magazine, MagazineStatus } from "@/types/models";

export class MagazineManager {
  private static COLLECTION = "magazines";

  /**
   * Create a new magazine
   */
  static async createMagazine(
    magazine: Omit<Magazine, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const magazineRef = doc(collection(db, this.COLLECTION));
    const now = Timestamp.now();

    const magazineData: Magazine = {
      ...magazine,
      id: magazineRef.id,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(magazineRef, magazineData);
    return magazineRef.id;
  }

  /**
   * Get magazine by ID
   */
  static async getMagazineById(id: string): Promise<Magazine | null> {
    const magazineRef = doc(db, this.COLLECTION, id);
    const magazineSnap = await getDoc(magazineRef);

    if (!magazineSnap.exists()) {
      return null;
    }

    return magazineSnap.data() as Magazine;
  }

  /**
   * Get magazine by slug
   */
  static async getMagazineBySlug(slug: string): Promise<Magazine | null> {
    const q = query(
      collection(db, this.COLLECTION),
      where("slug", "==", slug),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data() as Magazine;
  }

  /**
   * Update magazine
   */
  static async updateMagazine(
    id: string,
    updates: Partial<Omit<Magazine, "id" | "createdAt">>
  ): Promise<void> {
    const magazineRef = doc(db, this.COLLECTION, id);
    await updateDoc(magazineRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Delete magazine
   */
  static async deleteMagazine(id: string): Promise<void> {
    const magazineRef = doc(db, this.COLLECTION, id);
    await deleteDoc(magazineRef);
  }

  /**
   * Publish magazine
   */
  static async publishMagazine(id: string): Promise<void> {
    const magazineRef = doc(db, this.COLLECTION, id);
    await updateDoc(magazineRef, {
      status: MagazineStatus.PUBLISHED,
      publishedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Get published magazines
   */
  static async getPublishedMagazines(limitCount = 20): Promise<Magazine[]> {
    const q = query(
      collection(db, this.COLLECTION),
      where("status", "==", MagazineStatus.PUBLISHED),
      orderBy("publishedAt", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as Magazine);
  }

  /**
   * Get draft magazines
   */
  static async getDraftMagazines(): Promise<Magazine[]> {
    const q = query(
      collection(db, this.COLLECTION),
      where("status", "==", MagazineStatus.DRAFT),
      orderBy("updatedAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as Magazine);
  }

  /**
   * Get magazines by author
   */
  static async getMagazinesByAuthor(authorId: string): Promise<Magazine[]> {
    const q = query(
      collection(db, this.COLLECTION),
      where("authorId", "==", authorId),
      orderBy("updatedAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as Magazine);
  }

  /**
   * Generate unique slug
   */
  static async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.getMagazineBySlug(slug);
      if (!existing) {
        return slug;
      }
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
}
