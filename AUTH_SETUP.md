# Lum-n Kurulum Rehberi

Bu dokümana ek olarak, yeni eklenen JWT tabanlı kimlik doğrulama sistemi için aşağıdaki adımları takip edin.

## Kimlik Doğrulama Kurulumu

### 1. JWT Secret Key Ekleyin

`.env.local` dosyanıza aşağıdaki satırı ekleyin:

```env
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
```

**Önemli:** Production ortamında güvenli, uzun ve rastgele bir anahtar kullanın. Aşağıdaki komut ile güvenli bir key oluşturabilirsiniz:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. İlk Admin Kullanıcısını Oluşturun

Uygulama çalıştıktan sonra `/register` sayfasına giderek ilk kullanıcınızı oluşturun. İlk kullanıcı otomatik olarak "READER" rolü ile oluşturulur.

Admin yetkisi vermek için Firebase Console'dan ilgili kullanıcının `role` alanını `ADMIN` olarak güncelleyin:

1. Firebase Console'a gidin
2. Firestore Database'i açın
3. `users` koleksiyonunu bulun
4. İlgili kullanıcı dokümanını açın
5. `role` alanını `ADMIN` olarak değiştirin

### 3. Kullanıcı Rolleri

Sistem 4 farklı rol destekler:
- **READER**: Makaleleri okuyabilir, yorum yapabilir
- **WRITER**: Makale yazabilir, taslak oluşturabilir
- **EDITOR**: Makaleleri onaylayabilir, editör notu ekleyebilir
- **ADMIN**: Tüm yetkilere sahip, kullanıcı yönetimi yapabilir

### 4. Korumalı Rotalar

Aşağıdaki rotalar kimlik doğrulama gerektirir:
- `/admin` - Admin paneli (sadece giriş yapmış kullanıcılar)
- `/admin/new` - Yeni makale oluşturma (sadece giriş yapmış kullanıcılar)

Giriş yapmamış kullanıcılar bu sayfalara erişmeye çalıştığında otomatik olarak `/login` sayfasına yönlendirilir.

### 5. Token Yönetimi

- JWT token'ları HttpOnly cookie olarak saklanır (XSS saldırılarına karşı güvenli)
- Token süresi: 7 gün
- Otomatik logout: Token süresi dolduğunda kullanıcı otomatik olarak çıkış yapar
- Her sayfa yüklemesinde token geçerliliği kontrol edilir

### 6. Şifre Gereksinimleri

Güvenli şifreler için aşağıdaki kurallar uygulanır:
- Minimum 8 karakter
- En az 1 büyük harf
- En az 1 küçük harf
- En az 1 rakam

## Geliştirme Notları

### Auth Store Kullanımı

```typescript
import { useAuthStore } from "@/stores/useAuthStore";

function MyComponent() {
  const { user, login, logout, isLoading } = useAuthStore();

  // Kullanıcı giriş yaptı mı?
  if (user) {
    console.log("Kullanıcı:", user.displayName);
    console.log("Rol:", user.role);
  }

  // Giriş yap
  const handleLogin = async () => {
    const success = await login("email@example.com", "password");
    if (success) {
      // Başarılı giriş
    }
  };

  // Çıkış yap
  const handleLogout = async () => {
    await logout();
  };
}
```

### Rol Kontrolü

```typescript
import { hasRole } from "@/lib/auth";
import { UserRole } from "@/types/models";

// Sunucu tarafında (API Route)
export async function POST(request: Request) {
  const user = await getCurrentUser(request);
  
  if (!user || !hasRole(user, UserRole.ADMIN)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }
  
  // Admin işlemleri...
}

// İstemci tarafında
function AdminPanel() {
  const { user } = useAuthStore();
  
  if (!user || user.role !== UserRole.ADMIN) {
    return <div>Bu sayfayı görüntülemek için yetkiniz yok.</div>;
  }
  
  return <div>Admin Paneli</div>;
}
```

## Güvenlik Önerileri

1. **JWT_SECRET**: Production'da mutlaka güvenli, uzun ve rastgele bir key kullanın
2. **HTTPS**: Production'da sadece HTTPS kullanın (HttpOnly cookie'ler için önemli)
3. **Şifre Politikası**: Gerekirse minimum şifre uzunluğunu artırın
4. **Token Süresi**: İhtiyaca göre token süresini ayarlayın (varsayılan 7 gün)
5. **Rate Limiting**: Login endpoint'ine rate limiting ekleyin (brute force saldırılarına karşı)

## Sorun Giderme

### "Invalid JWT Secret" Hatası
`.env.local` dosyasında `JWT_SECRET` tanımlı olduğundan emin olun.

### Token Geçersiz Hatası
Tarayıcı cookie'lerini temizleyin ve tekrar giriş yapın.

### Şifre Gereksinimleri Hatası
Şifrenizin tüm gereksinimleri karşıladığından emin olun (8+ karakter, büyük harf, küçük harf, rakam).
