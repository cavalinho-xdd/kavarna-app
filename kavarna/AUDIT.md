# Technický Audit Projektu: Kavárna Doma

Datum: 27. ledna 2026
Autor: Gemini CLI

## 📋 Přehled (Kontext)
Projekt je digitální věrnostní aplikace postavená na **React Native (Expo)** s backendem **Firebase**. 

- **Cíl:** Nahrazení papírových věrnostních kartiček.
- **Role:**
  - **Zákazník:** Sbírá body, vidí stav karty, prokazuje se QR kódem.
  - **Barista (Admin):** Skenuje QR kódy zákazníků a přiděluje body.
- **Stav:** Funkční MVP (Minimum Viable Product), ale vyžaduje architektonická vylepšení pro dlouhodobou udržitelnost.

---

## ✅ Silné stránky
1.  **Technologický Stack:** Využití moderních nástrojů (Expo Router, React Native Reanimated, Firebase v9) poskytuje solidní základ.
2.  **UX Věrnostní karty:** Komponenta `loyalty-card.tsx` je výborně zpracovaná. Animace otáčení a "razítkování" působí profesionálně a zvyšují atraktivitu pro uživatele.
3.  **Real-time synchronizace:** Díky `onSnapshot` z Firestore mají uživatelé okamžitou zpětnou vazbu při přičtení bodu.
4.  **Lokalizace:** Aplikace je plně v češtině, což je pro lokální kavárnu nezbytné.

---

## ❌ Slabé stránky a Kritika
1.  **Struktura souborů:**
    - V rootu se nachází složka `.history` (pravděpodobně z IDE pluginu), která znečišťuje repozitář.
    - Chybí jasnější separace logiky.
2.  **Monolitický `index.tsx`:**
    - Hlavní soubor `app/(tabs)/index.tsx` řeší příliš mnoho zodpovědností najednou: auth (login/register/logout), logiku baristy (kamera), logiku zákazníka i UI.
    - Ztěžuje to čitelnost a údržbu.
3.  **Bezpečnostní a "Hack" řešení:**
    - Hardcoded bypass `user.email === "franta@test.cz"` pro verifikaci emailu je rizikový.
    - Chybí explicitní typování (nadměrné použití `any`).
4.  **Styling:**
    - Barvy jsou definovány "natvrdo" přímo v komponentách místo využití centrálního souboru s tématem (`constants/theme.ts`). Ztěžuje to případný rebranding.
5.  **Navigace:**
    - Podmíněné vykreslování celých obrazovek (Login vs App) uvnitř jednoho routu není ideální pro správu historie a gest.

---

## 💡 Plán vylepšení (Doporučení)

### 1. Úklid a Organizace
- [x] Přidat `.history/` do `.gitignore` a odstranit ji z repozitáře. (Hotovo 27.1.2026)
- [ ] Zorganizovat importy a odstranit nepoužívaný kód.

### 2. Refactoring Kódu (Priorita)
- [x] **Rozdělit `index.tsx`:** (Hotovo 27.1.2026)
  - Vytvořeny komponenty `AuthScreen`, `BaristaScreen`, `CustomerScreen`, `VerificationScreen`.
- [ ] **Vlastní Hooky:**
  - Přesunout logiku načítání dat (`onSnapshot`) do custom hooku (např. `useCustomerData`).

### 3. Bezpečnost a Stabilita
- [ ] Nahradit `any` typy konkrétními rozhraními (Interface pro `User`, `UserData`).
- [ ] Odstranit hardcoded emaily a testovací bypassy.
- [ ] Zkontrolovat nastavení Firebase Security Rules (zajistit, že body může měnit jen admin).

### 4. UI/UX
- [x] Vylepšení vizuálu karty a zákaznické sekce. (Hotovo 27.1.2026)
  - Přidán gradient (Latte efekt).
  - Nová Morph animace věrnostní karty (plynulý přechod).
  - Přidána haptická odezva.
- [ ] Sjednotit barvy a styly pomocí `constants/theme.ts`.

---

## 📜 Log Změn (27. 1. 2026)
- **Refactoring:** Rozdělení velkého `index.tsx` na 4 menší, spravovatelné komponenty.
- **Cleanup:** Odstranění složky `.history` a aktualizace `.gitignore`.
- **UI/UX:**
  - Instalace `expo-linear-gradient` a `expo-haptics`.
  - Implementace nové animace karty (škálování + fade) namísto problematického 3D otáčení.
  - Vynucení animací i při zapnutém "Reduced Motion" v systému.
  - Přidání pozadí s gradientem na obrazovku zákazníka.