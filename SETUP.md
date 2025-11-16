# 🌟 Lumin Fashion Blog Platform

Profesyonel, ölçeklenebilir ve modern bir moda blogu platformu. Next.js 15, Firebase, Cloudflare R2 ve Zustand ile geliştirilmiştir.

## ✨ Özellikler

### 📝 İçerik Yönetimi
- **Rol Tabanlı Yetkilendirme**: Reader, Writer, Editor, Admin rolleri
- **Akıllı Editör Sistemi**: Inline notlar, onay süreci, yayınlama kontrolü
- **Zengin Metin Editörü**: TinyMCE ile görsel, video, kod ekleme
- **Taslak & Önizleme**: Otomatik taslak kaydetme, editöre gönderme
- **Multi-platform Export**: WordPress, Medium, Ghost, RSS, JSON

### 🎨 Medya Yönetimi
- **Cloudflare R2 Entegrasyonu**: Hızlı ve güvenilir object storage
- **CDN Optimizasyonu**: Dünya çapında hızlı görsel dağıtımı
- **Otomatik Görsel İşleme**: Responsive images, lazy loading
- **YouTube Embed**: Doğrudan video entegrasyonu

### 💬 Topluluk Özellikleri
- **Yorum Sistemi**: İç içe yanıtlar, moderasyon
- **Beğeni Sistemi**: Real-time beğeni tracking
- **Sosyal Paylaşım**: Twitter, Facebook, LinkedIn, WhatsApp
- **Embed Kodları**: Blog yazılarını iframe ile paylaşma

### 📊 Analytics & Stats
- **View Tracking**: Benzersiz ve toplam görüntülenme
- **Engagement Metrics**: Beğeni, yorum, paylaşım istatistikleri
- **Referrer Tracking**: Trafik kaynaklarını izleme
- **Session Analytics**: Kullanıcı davranış analizi

### 🚀 SEO & Performance
- **Dynamic Meta Tags**: Otomatik OG tags, Twitter cards
- **Structured Data**: Schema.org JSON-LD
- **Server-Side Rendering**: Blazing fast page loads
- **Static Generation**: Pre-rendered popular pages
- **Image Optimization**: Next.js Image component
- **AI-powered Alt Text**: Otomatik görsel açıklamaları

## 🏗️ Mimari

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  Next.js 15 App Router | React 19 | TailwindCSS             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    State Management Layer                    │
│                  Zustand (Blog, Comment, Stats, Auth)       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      API Service Layer                       │
│          Centralized API Client (api.ts)                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    API Routes (Next.js)                      │
│        /api/blogs | /api/comments | /api/stats             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Manager Layer                           │
│   BlogManager | CommentManager | StatsManager | UserManager │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     Database Layer                           │
│         Firebase Firestore | Cloudflare R2                  │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Proje Yapısı

```
lum-n/
├── src/
│   ├── app/
│   │   ├── api/                    # API Routes
│   │   │   ├── blogs/             # Blog endpoints
│   │   │   ├── comments/          # Yorum endpoints
│   │   │   ├── stats/             # İstatistik endpoints
│   │   │   ├── media/             # Medya upload
│   │   │   └── export/            # Export endpoints
│   │   ├── magazine/[slug]/       # Blog detay (SSR)
│   │   ├── (admin)/               # Admin panel
│   │   └── (auth)/                # Authentication
│   │
│   ├── components/
│   │   ├── BlogEditor.tsx         # Rich text editor
│   │   ├── EditorDashboard.tsx    # Editör onay paneli
│   │   ├── ShareButtons.tsx       # Sosyal paylaşım
│   │   ├── CommentSection.tsx     # Yorum sistemi
│   │   ├── BlogStatsDisplay.tsx   # İstatistikler
│   │   └── ViewTracker.tsx        # View tracking
│   │
│   ├── lib/
│   │   ├── managers/              # Database managers
│   │   │   ├── BlogManager.ts
│   │   │   ├── CommentManager.ts
│   │   │   ├── StatsManager.ts
│   │   │   ├── UserManager.ts
│   │   │   └── MediaManager.ts
│   │   ├── firebase.ts            # Firebase config
│   │   ├── seo.ts                 # SEO utilities
│   │   └── exporters.ts           # Export formatters
│   │
│   ├── stores/                    # Zustand stores
│   │   ├── useBlogStore.ts
│   │   ├── useCommentStore.ts
│   │   ├── useStatsStore.ts
│   │   └── useAuthStore.ts
│   │
│   ├── services/
│   │   └── api.ts                 # Centralized API client
│   │
│   └── types/
│       └── models.ts              # TypeScript types
│
├── .env.example                   # Environment variables
└── README.md
```

## 🚀 Kurulum

### 1. Bağımlılıkları Yükle

```bash
npm install
```

### 2. Environment Variables

`.env.example` dosyasını `.env.local` olarak kopyalayın ve değerleri doldurun:

```bash
cp .env.example .env.local
```

#### Firebase Setup
1. [Firebase Console](https://console.firebase.google.com/) üzerinden proje oluşturun
2. Firestore Database'i etkinleştirin
3. Web app credentials'ı alın

#### Cloudflare R2 Setup
1. [Cloudflare Dashboard](https://dash.cloudflare.com/) → R2
2. Bucket oluşturun
3. API Token oluşturun
4. Public domain (CDN) ayarlayın

#### TinyMCE Setup
1. [TinyMCE](https://www.tiny.cloud/) ücretsiz hesap oluşturun
2. API key alın

### 3. Firestore Güvenlik Kuralları

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Blogs collection
    match /blogs/{blogId} {
      allow read: if resource.data.status == 'published' || 
                     request.auth != null;
      allow create: if request.auth != null && 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['writer', 'editor', 'admin'];
      allow update: if request.auth != null && 
                       (resource.data.authorId == request.auth.uid || 
                        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['editor', 'admin']);
      allow delete: if request.auth != null && 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Comments
    match /comments/{commentId} {
      allow read: if resource.data.isApproved == true || 
                     request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['editor', 'admin'];
      allow delete: if request.auth != null && 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Stats
    match /blog_stats/{blogId} {
      allow read: if true;
      allow write: if true; // Allow tracking
    }
  }
}
```

### 4. Development Server

```bash
npm run dev
```

Tarayıcınızda `http://localhost:3000` adresini açın.

## 📖 Kullanım

### Blog Yazma İş Akışı

1. **Yazar** (Writer role):
   - Blog yazısı oluşturur
   - Görseller ve videolar ekler
   - Taslak olarak kaydeder
   - Editöre gönderir (PENDING_REVIEW)

2. **Editör** (Editor role):
   - Bekleyen yazıları görür
   - İçeriği inceler
   - Not ekler (inline comments)
   - Yayınlar veya reddeder

3. **Okuyucu**:
   - Yayınlanan blogları görür
   - Beğenir, paylaşır
   - Yorum yapar

### API Kullanımı

```typescript
import { api } from '@/services/api';

// Blog listele
const { data: blogs } = await api.blog.getPublished({ 
  pageSize: 10, 
  category: 'moda' 
});

// Yorum ekle
await api.comment.create({
  blogId: 'blog-id',
  userId: 'user-id',
  userName: 'John Doe',
  content: 'Harika yazı!'
});

// Beğeni ekle
await api.stats.like('blog-id', 'user-id');

// Paylaşım kaydet
await api.stats.share('blog-id', 'twitter', 'user-id');
```

### Zustand Stores

```typescript
import { useBlogStore } from '@/stores/useBlogStore';

function BlogList() {
  const { blogs, fetchBlogs, isLoading } = useBlogStore();
  
  useEffect(() => {
    fetchBlogs({ pageSize: 10 });
  }, []);
  
  if (isLoading) return <div>Yükleniyor...</div>;
  
  return (
    <div>
      {blogs.map(blog => (
        <BlogCard key={blog.id} blog={blog} />
      ))}
    </div>
  );
}
```

## 🔧 Export/Import

### Export

```bash
# WordPress
GET /api/export?format=wordpress&blogIds=id1,id2

# Medium
GET /api/export?format=medium

# Ghost
GET /api/export?format=ghost

# RSS Feed
GET /api/export?format=rss
```

### Tüm Platformlar

Desteklenen formatlar:
- ✅ WordPress XML
- ✅ Medium JSON
- ✅ Ghost JSON
- ✅ RSS Feed
- ✅ Plain JSON

## 🎨 UI Components

Tüm componentler Tailwind CSS ile stillendirilmiştir ve responsive tasarıma sahiptir.

### Temel Renkler
- Primary: Blue (#2563eb)
- Success: Green (#10b981)
- Warning: Yellow (#f59e0b)
- Danger: Red (#ef4444)

### Typography
- Headings: Font weight 700-900
- Body: Inter font family
- Code: Monospace

## 🔐 Güvenlik

- Firebase Authentication
- Role-based access control (RBAC)
- Server-side validation
- Secure file uploads
- XSS protection
- CSRF tokens

## 📈 Performance

- **Lighthouse Score Target**: 90+
- Server-Side Rendering (SSR)
- Static Site Generation (SSG)
- Image optimization (WebP, AVIF)
- CDN caching
- Code splitting
- Lazy loading

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add some amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📝 Lisans

Bu proje özel kullanım içindir.

## 👨‍💻 Geliştirici

**Lumin Fashion Blog Team**

## 🙏 Teşekkürler

- Next.js Team
- Firebase Team
- Cloudflare Team
- TinyMCE Team
- Open Source Community

---

**Not**: Bu README, projenin tam özellik setini kapsamaktadır. Bazı özellikler hala geliştirme aşamasında olabilir.
