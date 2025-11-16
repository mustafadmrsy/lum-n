import { Timestamp } from "firebase/firestore";

// User Model
export enum UserRole {
  READER = "reader",
  WRITER = "writer",
  EDITOR = "editor",
  ADMIN = "admin",
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  bio?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Blog Post Model
export enum BlogStatus {
  DRAFT = "draft",
  PENDING_REVIEW = "pending_review",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

export interface BlogMedia {
  type: "image" | "video";
  url: string;
  cdnUrl: string;
  altText?: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface EditorNote {
  id: string;
  editorId: string;
  editorName: string;
  content: string;
  position: {
    start: number;
    end: number;
  };
  resolved: boolean;
  createdAt: Timestamp;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage?: BlogMedia;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  status: BlogStatus;
  tags: string[];
  categories: string[];
  media: BlogMedia[];
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  
  // Editor workflow
  editorNotes: EditorNote[];
  publishedBy?: string;
  publishedAt?: Timestamp;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  scheduledAt?: Timestamp;
}

// Comment Model
export interface Comment {
  id: string;
  blogId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  parentId?: string; // For nested replies
  isApproved: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Blog Statistics Model
export interface BlogStats {
  blogId: string;
  views: number;
  uniqueViews: number;
  likes: number;
  shares: {
    total: number;
    twitter: number;
    facebook: number;
    linkedin: number;
    whatsapp: number;
    embed: number;
  };
  comments: number;
  lastViewedAt?: Timestamp;
  updatedAt: Timestamp;
}

// Like Model
export interface Like {
  id: string;
  blogId: string;
  userId: string;
  createdAt: Timestamp;
}

// Share Model
export interface Share {
  id: string;
  blogId: string;
  platform: "twitter" | "facebook" | "linkedin" | "whatsapp" | "embed" | "other";
  userId?: string;
  referrer?: string;
  createdAt: Timestamp;
}

// View Model
export interface View {
  id: string;
  blogId: string;
  userId?: string;
  sessionId: string;
  userAgent?: string;
  referrer?: string;
  createdAt: Timestamp;
}

// Export Options
export interface ExportOptions {
  format: "wordpress" | "medium" | "ghost" | "rss" | "json";
  includeMedia: boolean;
  includeComments: boolean;
}

export interface ExportResult {
  success: boolean;
  data?: unknown;
  downloadUrl?: string;
  error?: string;
}

// Magazine Model - Dergi sistemi için
export enum MagazineStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
}

export interface TextLayer {
  id: number;
  x: number;
  y: number;
  text: string;
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  color: string;
  align: "left" | "center" | "right";
}

export interface ImageLayer {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  url: string;
  rotation?: number;
}

export interface MagazinePage {
  id: number;
  backgroundColor?: string;
  backgroundImage?: string;
  textLayers: TextLayer[];
  imageLayers: ImageLayer[];
}

export interface Magazine {
  id: string;
  title: string;
  slug: string;
  coverImage?: string;
  authorId: string;
  authorName: string;
  status: MagazineStatus;
  pages: MagazinePage[];
  tags: string[];
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
}
