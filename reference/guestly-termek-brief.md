# Guestly — termékleírás beszélgetéshez

> **Mi ez a fájl:** önmagában elegendő összefoglaló a Guestly nevű működő
> alkalmazásról, hogy egy AI-asszisztens (vagy bárki új) átlássa a terméket, és
> érdemben lehessen vele ötletelni fejlesztésekről, pozicionálásról, üzleti
> kérdésekről. Nem kódot ír le, hanem működést és döntéseket.
>
> Állapot: **éles, működik**, 2 teszt-partnerrel. Még nincs fizető ügyfél.
> Utolsó frissítés: 2026-08-01.

---

## 1. Egy bekezdésben

A Guestly vendégelégedettséget mér vendéglátóhelyeken. Az asztalon egy QR-kód
van; a vendég beolvassa, és kb. 30 másodperc alatt értékel öt szempontot
1–10-es skálán. Nincs app, nincs regisztráció. A tulajdonos ebből **nap és
napszak szerinti bontásban** látja, mikor romlik el a kiszolgálás — nem havi
átlagot, hanem azt, hogy „péntek este 7 körül a tisztaság rendre gyengébb".

---

## 2. Kinek mit ad — három szerepkör

### A vendég (anonim, semmit nem kell telepítenie)
1. Beolvassa a QR-kódot → megnyílik egy weboldal a telefonján
2. Öt kérdés, egyesével, 1–10-es skálán
3. Ha valamire **3 vagy annál kevesebbet** ad, a rendszer rákérdez: „Mi ment
   rosszul?" — opcionális, pár szó
4. Köszönő képernyő az átlagával
5. **Opcionálisan** megadhatja az e-mail címét egy napi nyereményjátékhoz
   (jellemzően egy ingyen kávé). Ehhez explicit adatkezelési hozzájárulás kell.

### A partner / tulajdonos (bejelentkezik)
Csak a **saját egységeit** látja, és **soha nem lát vendég-e-mail címet vagy
sorsolási adatot** — ez adatvédelmi döntés, adatbázis-szinten kikényszerítve.

- **Áttekintés**: szempontonkénti átlagok, és egy **hőtérkép** (hét napja ×
  napszak: 8/10/12/14/16/18/20 óra). Választható időszak: 7 / 30 / 90 / 365 nap
  vagy összes. Alapértelmezés 30 nap.
- **Automatikus figyelmeztetés**: ha egy szempont átlaga a beállított küszöb alá
  esik, szöveges üzenet a leggyengébb idősávval — „Tisztaság gyengébb Pén 18h
  körül (átlag: 5,2) — érdemes ilyenkor erősíteni a személyzetet". Legalább 5
  értékelés kell hozzá, és egy cellához legalább 3, hogy ne egy rossz nap
  látszódjon trendnek.
- **Napló**: minden egyedi értékelés, időponttal, pontszámokkal, indoklásokkal.
  Szűrhető és CSV-be exportálható.
- **Súgó** fül.

### Az admin (a Guestly csapata)
Rejtett, sehonnan nem linkelt URL-en, valódi jogosultság-ellenőrzéssel.

- **Portfólió-áttekintés**: minden partner, rangsor átlag szerint, 24 órás és
  7 napos darabszámok
- **Figyelendő egységek**: ahol egy szempont a küszöb alá esett
- **Szokatlan forgalom**: ha egy egység 24 órás értékelésszáma a **saját**
  szokásos napi átlagának háromszorosa fölé megy (min. 20 értékelés, és csak ha
  van elég előzménye). Ez lehetséges manipuláció jelzése.
- **Partner-adatlap**: pontosan az, amit a partner lát — supporthoz
- **Partnerek kezelése**: felvétel, szerkesztés, QR-kód generálás és letöltés,
  fiók létrehozása a partnernek (e-maillel vagy e-mail nélkül, generált
  jelszóval), előfizetési időszak
- **Napló**: minden partner, **vendég-e-mail címekkel és sorsolási adatokkal**
- **Beállítások**: kérdéscsoportok szerkesztése, partnerekhez rendelése,
  a landing page szövegének szerkesztése, demó-kérések kezelése

---

## 3. A kérdések testreszabhatók

Van egy „Alap kérdések" csoport (Tisztaság, Kiszolgálás gyorsasága, Kiszolgálás
minősége, Étel-ital minősége, Hangulat), és az admin **tetszőleges további
kérdéscsoportot** hozhat létre — nevesítve, saját kérdésekkel, ikonokkal,
sorrendbe rendezve. Egy csoport több partnerhez is hozzárendelhető.

Ez teszi lehetővé, hogy egy bár, egy étterem és egy kávézó **más kérdéseket**
kapjon. A kérdések sorrendje is állítható, mert a vendég ebben a sorrendben
kapja őket.

---

## 4. A napi nyereményjáték

A vendég motivációja arra, hogy egyáltalán kitöltse. Minden nap egy nyertes
egységenként.

- A sorsolás **automatikus**, minden éjjel, a már lezárt **előző napra**
  (azért az előzőre, hogy a késő este értékelők se maradjanak ki)
- A nyertes e-mailben kap egy egyedi kupon-kódot, amit a pultnál felmutat
- Egy egység egy napra **csak egyszer** sorsolható — nem lehet dupla kupont
  kiadni
- **Egy e-mail cím naponta egy helyen legfeljebb 2 sorsjegyet kap.** Aki
  többször küld be, annak az értékelése rögzül, de a sorsolásba nem számít
  bele. (Reális, hogy valaki napi kétszer megfordul ugyanott; a harmadik már nem
  az.)
- Ha a levél nem megy ki, azt a Napló **pirossal jelzi**, és a kupon-kód ott
  látszik — a pult kézzel át tudja adni

---

## 5. A pozicionálás — miért nem „még egy értékelő rendszer"

A viszonyítási alap **nem** a QR-kód generátorok, hanem a **Google Review**:

| | Google Review | Guestly |
|---|---|---|
| Mikor tudod meg | napokkal-hetekkel később | aznap, óránkénti bontásban |
| Ki látja | bárki, nyilvánosan | csak te és a csapatod |
| Mit mond | egy összesített csillagszám | konkrét szempont, időpont, gyakran ok is |
| Mit takar az átlag | egy 5 éves múlt átlaga — egy rossz hónap alig mozgatja | az elmúlt napok valós állapota |
| Cselekvésre alkalmas | csak utólagos reagálás | beavatkozhatsz, mielőtt gond lesz |

A kulcsérv: **a kumulatív átlag elrejti a romlást.** Egy 5 éve működő helynél egy
rossz hónap alig mozdítja a csillagszámot, tehát a probléma nem látszik, amíg
már késő. A Guestly ezt a pillanat előtt hozza el, belsőleg.

Másodlagos, de fontos: **vállalkozásfejlesztési eszköz is** — megmutatja, mikor
kell több ember a műszakba. Ezt tudatosan **fejlesztés-orientált**, nem
alkalmazott-ellenőrzési nyelven érdemes kommunikálni (munkajogi és etikai okból
egyaránt).

---

## 6. Üzleti állapot és eddigi döntések

**Nincs még fizető ügyfél és nincs validált fizetési hajlandóság.** Ez a
legnagyobb nyitott üzleti kockázat.

Eddigi gondolkodás (nem véglegesített):
- **Árazás**: HU kb. 25.000 Ft/hó — az érvelés szerint ez inkább *alsó*,
  biztonságos belépő ár, nem felső. Kétszintű csomag megfontolható (alap /
  teljes 30–40e Ft). USA/Florida: $39–79/hó.
  ⚠️ Ez **retorika, nem mért ROI** — a validációs beszélgetéseken ezt az
  érvrendszert kell élesben kipróbálni.
- **Csomag**: 1. fázisban csak havi, bármikor felmondható. 3/6 hónapos
  csomagok csak 3-5 elégedett referenciapartner után.
- **Próbaidő**: 2-4 hét, nem 1-2 hónap. Alternatíva: első hónap féláron —
  az már valós fizetési hajlandóságot mér.
- **Csak fizetős**, nincs freemium. Az „legyen ingyenes, hogy elterjedjen"
  tanácsot tudatosan elvetettük: bevétel nélkül nincs support és fejlesztés.
- **Partnerszerzés**: kisebb, helyi partnerekkel kezdeni. Nagy láncokat csak
  bizonyított referenciákkal, és nem ingyen, hanem kedvezménnyel + írásos
  megállapodással.

---

## 7. Technikai keret (csak amennyi a megvalósíthatóság megítéléséhez kell)

Next.js + Supabase (PostgreSQL) + Vercel. Minden statisztika az adatbázisban
aggregálódik. Az adatvédelem nem alkalmazás-logika, hanem adatbázis-szintű
jogosultság: a partner **technikailag sem tudja** lekérdezni a vendégek
e-mail címét.

A vendég-beküldés aláírt, egyszer használatos tokent igényel, és a nyilvános
kulccsal közvetlenül **nem lehet** az adatbázisba írni.

---

## 8. Mai korlátok — őszintén

- **Az e-mail-küldés nem működik idegen címre.** Nincs verifikált saját domain,
  ezért a nyertes-értesítők és a demó-visszaigazolások jelenleg nem érkeznek
  meg. Ez konfigurációs, nem kódbeli hiány, de **most a legnagyobb akadály** —
  a nyereményjáték a fő vendég-motiváció.
- **A szkriptelt visszaélés nehezebb lett, de nem lehetetlen.** Aki minden
  hamis értékelés előtt betölt egy oldalt, meg tudja csinálni. A nyereményt
  ettől már nem tudja megszerezni (napi 2 sorsjegy/e-mail), és a szokatlan
  forgalom jelzés észreveszi.
- **A riasztások csak képernyőn léteznek** — nincs e-mail vagy push. Aki nem
  nyitja meg az admin felületet, nem tud róluk.
- **Magyar nyelvű, budapesti időzónára rögzítve.** Az angolosítás kb. egy hét;
  az USA-piac ennél több (partnerenkénti időzóna, más jogi szövegek).
- **A jogi szövegek (adatvédelem, impresszum) placeholder-szintűek**, valódi
  ügyfél előtt jogásszal át kell nézetni.
- **Nincs valós eszközös tesztelés** régebbi Androidon, kis kijelzőn. Ezt a
  QR-kódok kinyomtatása *előtt* kell elvégezni.

---

## 9. Szándékosan elvetett vagy elhalasztott dolgok

Ezeket **már megtárgyaltuk**; ha ötletelésnél előjönnek, érdemes tudni, hogy
nem feledékenységből hiányoznak:

- **CAPTCHA a vendég-űrlapon** — elvetve. A termék ígérete „30 másodperc, nincs
  app"; egy CAPTCHA a kávézós visszajelzésen konverziógyilkos.
- **IP-alapú duplikáció-szűrés** — elvetve. Egy hely összes vendége **egy
  nyilvános IP-n** van a WiFi mögött, tehát valódi vendégeket zárna ki.
- **Az előfizetés lejárata korlátozzon** — elvetve. Ha a vendég hibát kap egy
  lejárt előfizetésű helyen, az **a vendég élményét rontja**, nem a partnert
  szorítja. A lejárat csak jelzés az admin felületen.
- **Napi összegző e-mail az adminnak** — elhalasztva, amíg kevés a partner.
- **Hűségprogram (visszatérő pontgyűjtés)** — elhalasztva. Turista-erős
  piacokon a vendégek nagy része nem tér vissza; akkor éri meg, ha helyi
  törzsközönségű partnerek kérik.
- **Sorsolás visszavonása a felületről** — előbb üzleti döntés kell: ha a
  nyertes már megkapta a kódot, mi történjen a régivel?

---

## 10. Nyitott kérdések, amikre jó lenne válasz

1. **Validáció**: hajlandó-e egy vendéglátós fizetni ezért, és mennyit? Ez
   minden más előtt van.
2. **Árazás véglegesítése** — a doksi szerint ezt a fejlesztés *előtt* kellett
   volna tisztázni.
3. **Ki telepíti és támogatja** 20-30 partnernél? QR-kihelyezés, technikai
   kérdések, onboarding.
4. **Mi a „siker" a partner szemében?** Ma a termék adatot ad; nem mondja meg,
   hogy a beavatkozás használt-e. Egy „mióta beavatkoztál, ez a szempont javult"
   visszacsatolás erős lehetne.
5. **Kell-e a vendégnek visszajelzés arról, hogy számított a véleménye?** Ma nem
   tud meg semmit. Ez a hűségprogram-gondolat egy olcsóbb változata lehetne.
