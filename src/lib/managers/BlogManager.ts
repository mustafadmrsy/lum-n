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
  limit,
  startAfter,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "../firebase";
import { BlogPost, BlogStatus, EditorNote } from "@/types/models";
import { nanoid } from "nanoid";

export class BlogManager {
  private collectionName = "blogs";

  // Create a new blog post
  async createBlog(
    blogData: Omit<BlogPost, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    // Filter out undefined values
    const cleanData = Object.entries(blogData).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    const docRef = await addDoc(collection(db, this.collectionName), {
      ...cleanData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  // Get blog by ID
  async getBlogById(id: string): Promise<BlogPost | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as BlogPost;
    }
    return null;
  }

  // Get blog by slug
  async getBlogBySlug(slug: string): Promise<BlogPost | null> {
    const q = query(
      collection(db, this.collectionName),
      where("slug", "==", slug),
      limit(1)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as BlogPost;
    }
    return null;
  }

  // Get all published blogs with pagination
  async getPublishedBlogs(
    pageSize = 10,
    lastDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<{ blogs: BlogPost[]; lastDoc: QueryDocumentSnapshot | null }> {
    let q = query(
      collection(db, this.collectionName),
      where("status", "==", BlogStatus.PUBLISHED),
      orderBy("publishedAt", "desc"),
      limit(pageSize)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const blogs = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as BlogPost
    );

    return {
      blogs,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    };
  }

  // Get all blogs (including drafts) - for admin panel
  async getAllBlogs(pageSize = 50): Promise<BlogPost[]> {
    const q = query(
      collection(db, this.collectionName),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as BlogPost
    );
  }

  // Get blogs by author
  async getBlogsByAuthor(authorId: string): Promise<BlogPost[]> {
    const q = query(
      collection(db, this.collectionName),
      where("authorId", "==", authorId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as BlogPost
    );
  }

  // Get blogs by status
  async getBlogsByStatus(status: BlogStatus): Promise<BlogPost[]> {
    const q = query(
      collection(db, this.collectionName),
      where("status", "==", status),
      orderBy("updatedAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as BlogPost
    );
  }

  // Update blog
  async updateBlog(
    id: string,
    updates: Partial<BlogPost>
  ): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  // Update blog status
  async updateBlogStatus(
    id: string,
    status: BlogStatus,
    publishedBy?: string
  ): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    const updates: Record<string, unknown> = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (status === BlogStatus.PUBLISHED) {
      updates.publishedAt = serverTimestamp();
      if (publishedBy) updates.publishedBy = publishedBy;
    }

    await updateDoc(docRef, updates);
  }

  // Add editor note
  async addEditorNote(
    blogId: string,
    note: Omit<EditorNote, "id" | "createdAt">
  ): Promise<void> {
    const blog = await this.getBlogById(blogId);
    if (!blog) throw new Error("Blog not found");

    const newNote: EditorNote = {
      ...note,
      id: nanoid(),
      createdAt: Timestamp.now(),
    };

    const updatedNotes = [...(blog.editorNotes || []), newNote];

    await this.updateBlog(blogId, { editorNotes: updatedNotes });
  }

  // Resolve editor note
  async resolveEditorNote(blogId: string, noteId: string): Promise<void> {
    const blog = await this.getBlogById(blogId);
    if (!blog) throw new Error("Blog not found");

    const updatedNotes = blog.editorNotes.map((note) =>
      note.id === noteId ? { ...note, resolved: true } : note
    );

    await this.updateBlog(blogId, { editorNotes: updatedNotes });
  }

  // Delete blog
  async deleteBlog(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }

  // Search blogs
  async searchBlogs(searchTerm: string): Promise<BlogPost[]> {
    // Note: For production, consider using Algolia or Elasticsearch
    // Firestore doesn't support full-text search natively
    const q = query(
      collection(db, this.collectionName),
      where("status", "==", BlogStatus.PUBLISHED),
      orderBy("title")
    );

    const snapshot = await getDocs(q);
    const blogs = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as BlogPost
    );

    // Client-side filtering (temporary solution)
    return blogs.filter(
      (blog) =>
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );
  }

  // Get blogs by category
  async getBlogsByCategory(category: string): Promise<BlogPost[]> {
    const q = query(
      collection(db, this.collectionName),
      where("status", "==", BlogStatus.PUBLISHED),
      where("categories", "array-contains", category),
      orderBy("publishedAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as BlogPost
    );
  }

  // Get blogs by tag
  async getBlogsByTag(tag: string): Promise<BlogPost[]> {
    const q = query(
      collection(db, this.collectionName),
      where("status", "==", BlogStatus.PUBLISHED),
      where("tags", "array-contains", tag),
      orderBy("publishedAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as BlogPost
    );
  }

  // Generate unique slug
  async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    let slug = baseSlug;
    let counter = 1;

    while (await this.getBlogBySlug(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }
}

export const blogManager = new BlogManager();
