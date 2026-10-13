# core

Platformdan bağımsız iş mantığı: kategoriler, para, zaman, doğrulama şemaları ve hesaplamalar.

Kurallar:
- React, React Native, Expo veya Supabase import edilmez; sadece TypeScript + `zod`.
- Modüller arası importlar göreli yoldur (`@/` alias'ı yok) — klasör web'e olduğu gibi kopyalanabilsin.
- Kullanıcıya gösterilen metin üretilmez; doğrulama hataları ve uyarılar **kod** döner, çeviriyi UI yapar.
- "Bugün" ve "bu ay" her zaman çağıranın verdiği `now` + IANA `timeZone` ile hesaplanır.
