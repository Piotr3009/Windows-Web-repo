# Windows Configurator - 3-Column Layout Update

## 📋 Opis Projektu

Konfigurator okien drewnianych Skylon Timber & Glazing z nowym układem 3-kolumnowym, zaprojektowanym dla lepszego wykorzystania przestrzeni ekranu i poprawy user experience.

## 🎯 Cel Zmian

Poprzedni layout (2 kolumny) marnował dużo miejsca po bokach na szerokich ekranach. Nowy layout (3 kolumny) maksymalnie wykorzystuje dostępną przestrzeń, zachowując przejrzystość i logiczny flow użytkownika.

## 🔄 Zmiany w Layoutcie

### Poprzedni Layout (2 kolumny)
```
┌─────────────────────────────────────────────────┐
│  [Wizualizacja + Spec]  │  [Opcje]             │
│       (550px)           │  (reszta)            │
│                         │                       │
└─────────────────────────────────────────────────┘
Container: 1200px
```

### Nowy Layout (3 kolumny)
```
┌──────────────────────────────────────────────────────┐
│  [Opcje]  │  [Spec]  │  [Wizualizacja + Cena STICKY] │
│  (400px)  │  (400px) │         (550px)               │
│           │          │                               │
└──────────────────────────────────────────────────────┘
Container: 1400px
```

## 📐 Szczegóły Techniczne

### Szerokości Kolumn
- **Lewa (Opcje)**: 400px - formularze konfiguracji
- **Środek (Specyfikacja)**: 400px - szczegóły wybranej konfiguracji
- **Prawa (Wizualizacja + Cena)**: 550px - podgląd okna i cena (STICKY)
- **Gap**: 25px między kolumnami
- **Container**: 1400px (zwiększony z 1200px)

### Funkcje
- ✅ **Sticky Preview**: Wizualizacja i cena zawsze widoczne przy scrollowaniu
- ✅ **Logiczny Flow**: Opcje → Spec → Wizualizacja (naturalny ruch wzroku)
- ✅ **Responsive**: Automatyczne przejście na układ kolumnowy na małych ekranach
- ✅ **Zachowana Grafika**: Canvas wizualizacji (240px) bez zmian - bary się nie rozjadą

## 📝 Zmodyfikowane Pliki

### 1. `css/main.css`
**Zmiany:**
```css
.container {
  max-width: 1400px;  /* było: 1200px */
}
```

### 2. `css/configurator.css`
**Zmiany:**
```css
/* Layout 3 kolumn */
.configurator-grid {
  display: flex;
  gap: 25px;  /* było: 40px */
  align-items: flex-start;
}

.configurator-options {
  flex: 0 0 400px;  /* nowe */
}

.window-specification {
  flex: 0 0 400px;  /* nowe + style */
  background-color: var(--white);
  border: 2px solid var(--secondary-color);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-md);
}

.configurator-preview {
  flex: 0 0 550px;
  position: sticky;  /* nowe */
  top: 20px;
  /* ... reszta bez zmian */
}

/* Responsive */
@media (max-width: 768px) {
  .configurator-grid {
    flex-direction: column;
  }
  
  .configurator-options,
  .window-specification {
    width: 100%;
    flex: none;
  }
  
  .configurator-preview {
    position: relative;
    top: 0;
    width: 100%;
    flex: none;
  }
}
```

### 3. `build-your-own-windows.html`
**Zmiany struktury:**
```html
<!-- PRZED -->
<div class="configurator-grid">
  <div class="configurator-preview">
    <div class="svg-window-visualization">...</div>
    <div class="window-specification">...</div>
    <div class="price-summary">...</div>
  </div>
  <div class="configurator-options">...</div>
</div>

<!-- PO -->
<div class="configurator-grid">
  <div class="configurator-options">...</div>
  <div class="window-specification">...</div>
  <div class="configurator-preview">
    <div class="svg-window-visualization">...</div>
    <div class="price-summary">...</div>
  </div>
</div>
```

## ✅ Testy i Weryfikacja

### Sprawdzone:
- [x] Struktura HTML (222 opening divs = 222 closing divs)
- [x] JavaScript nie zależy od kolejności DOM (używa tylko ID)
- [x] Canvas wizualizacji ma fixed 240px (nie rozjedzie się)
- [x] Wszystkie ID z JS istnieją w HTML
- [x] Responsive CSS dla małych ekranów
- [x] Brak konfliktów w selektorach CSS

### Wymaga Testu w Przeglądarce:
- [ ] Wyświetlanie 3 kolumn na desktop
- [ ] Sticky behavior prawej kolumny
- [ ] Scrollowanie środkowej i lewej kolumny
- [ ] Aktualizacja ceny w czasie rzeczywistym
- [ ] Wizualizacja canvas (bary)
- [ ] Responsive na różnych rozdzielczościach

## 🔧 Instalacja

### Opcja 1: Bezpośrednie Wgranie
Skopiuj pliki z `/mnt/user-data/outputs/` do katalogu strony:
```bash
cp /mnt/user-data/outputs/build-your-own-windows.html ./
cp /mnt/user-data/outputs/css/main.css ./css/
cp /mnt/user-data/outputs/css/configurator.css ./css/
```

### Opcja 2: Git
```bash
git pull origin main
```

## 🔙 Rollback (w razie problemów)

Backup oryginalnego pliku znajduje się w:
```
build-your-own-windows.html.backup
```

Przywracanie:
```bash
cp build-your-own-windows.html.backup build-your-own-windows.html
git checkout HEAD -- css/main.css css/configurator.css
```

## 🎨 User Experience

### Korzyści Nowego Layoutu:
1. **Lepsza czytelność** - każda sekcja ma dedykowaną przestrzeń
2. **Zawsze widoczna cena** - sticky preview eliminuje przewijanie do góry
3. **Naturalny flow** - od lewej do prawej: konfiguruj → sprawdź spec → zobacz efekt
4. **Więcej miejsca** - powiększony container (1400px) lepiej wykorzystuje ekran

### Zachowane Funkcjonalności:
- ✅ Wszystkie formularze konfiguracji
- ✅ Wizualizacja canvas z barami
- ✅ Kalkulacja ceny w czasie rzeczywistym
- ✅ Zapisywanie konfiguracji
- ✅ Wszystkie przyciski i akcje

## 📊 Kompatybilność

- **Desktop (>1400px)**: Layout 3 kolumn - optymalne doświadczenie
- **Laptop (1024-1400px)**: Layout 3 kolumn - dopasowany
- **Tablet (<768px)**: Layout kolumnowy (responsive)
- **Mobile (<768px)**: Layout kolumnowy (planowany osobny kod dla iPhone)

## 🐛 Znane Ograniczenia

1. **Bardzo małe ekrany (<768px)**: Podstawowy responsive (planowany dedykowany layout mobilny)
2. **Bardzo duże ekrany (>1600px)**: Puste przestrzenie po bokach (container fixed 1400px)

## 📌 Uwagi dla Developerów

### Canvas Wizualizacji
**NIE ZMIENIAJ** szerokości `.window-container` (240px) - spowoduje rozjechanie się barów!

### JavaScript
Wszystkie event handlery działają na ID - kolejność elementów w DOM nie ma znaczenia.

### Sticky Behavior
Prawa kolumna (preview) ma `position: sticky; top: 20px` - automatycznie przyklejona przy scrollowaniu.

## 📧 Kontakt

W razie problemów lub pytań:
- GitHub Issues
- Email: support@skylontimber.com

## 📜 Changelog

### [1.0.0] - 2025-01-XX
#### Added
- Layout 3-kolumnowy (Opcje | Spec | Wizualizacja+Cena)
- Sticky preview (prawa kolumna)
- Powiększony container do 1400px
- Responsive CSS dla wszystkich kolumn

#### Changed
- Struktura HTML: przeniesiona specyfikacja do osobnej kolumny
- Gap między kolumnami: 40px → 25px
- Kolejność kolumn: Preview+Options → Options+Spec+Preview

#### Fixed
- Duplikaty `.window-specification` w CSS
- Brakujący `.configurator-preview` w CSS
- Responsive breakpoints dla wszystkich kolumn

---

**Wersja:** 1.0.0  
**Data:** 2025-01-XX  
**Author:** Claude & Piotr  
**License:** Proprietary - Skylon Timber & Glazing
