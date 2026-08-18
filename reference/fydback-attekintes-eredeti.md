# Guestly — Projekt áttekintő

Ez a fájl összefoglalja az eddig elkészült terveket, hogy ne kelljen visszagörgetni értük a beszélgetésben.

---

> ## ⚠️ Olvasási útmutató
>
> **A terméket 2026-08-18 óta Fydbacknek hívják**, nem Guestlynek — a domain
> `fydback.hu`. Ebben a fájlban szándékosan a régi név maradt: ez egy
> tervezési napló, és a névválasztás maga is egy rögzített döntés volt
> (lásd a „Márkanév" pontot). Átírni azt jelentené, hogy a név sosem változott.
> Minden más dokumentum az új nevet használja.
>
> **A dokumentum technikai állításai elavultak.** Ahol azt írja, hogy „a bejelentkezés és az adatok demó-szinten
> működnek", „nincs valódi felhasználó-adatbázis", vagy hogy a Next.js/Supabase
> átállás egy jövőbeli lépés — az azóta **elkészült és élesben fut**.
>
> Az akkori élesítés előtti checklistből teljesült: valódi adattárolás,
> QR-generálás, duplikáció-védelem, e-mail-küldés, jelszó-visszaállítás,
> GDPR-tájékoztató és hozzájárulás, állítható riasztási küszöb, `/admin` route
> szerveroldali jogosultsággal, onboarding-form, súgó a felületen. Ezen felül
> elkészült még: időszak-szűrő a statisztikákra, automatikus napi sorsolás,
> előfizetés-kezelés, admin partner-adatlap.
>
> **Onnan nyitva maradt:** valós eszközös tesztelés (régebbi Android, kis
> kijelző), „első értékelés" ünneplő értesítés, és az opcionális hűségprogram.
>
> **A rendszer aktuális technikai állapotát a `README.md` írja le**, a kód
> minőségi állapotát pedig a `reference/audit-2026-07-30.md`.
>
> Az **üzleti** részek (árazás, előfizetési struktúra, próbaidő, partnerszerzés,
> ingyenes vs. fizetős) továbbra is érvényesek — azokat nem érintette fejlesztés.

---

## 1. Termék-prototípus (vendég + tulajdonos folyamat)
**Fájl:** `guestly.jsx`

A vendégoldali élmény és a tulajdonosi dashboard önálló bemutatója.

- QR-kód "beolvasás" képernyő (demó)
- Egy-kérdés-egyszerre értékelő form, 1-10 skála, progress-sávval
- Köszönő képernyő, nyereményjáték-utalással
- Tulajdonosi dashboard: 5 szempont, óránkénti hőtérkép, automatikus figyelmeztetés a leggyengébb szempontra

**Státusz:** kész, design lezárva (feszes, letisztult stílus, gradiens csak kiemelt pontokon)

---

## 2. Landing page (teljes weboldal, bejelentkezéssel)
**Fájl:** `guestly-landing.jsx`

A publikus marketing oldal, vendéglátós tulajdonosoknak szólva, összekötve a bejelentkezéssel és a dashboarddal.

Tartalma:
- **Fejléc**: logó, "Bejelentkezés", "Demó kérése" gombok
- **Hero**: fő üzenet + élő, interaktív mini hőtérkép-előnézet
- **Probléma szekció**: miért nem elég a jelenlegi visszajelzés-gyűjtés
- **"Hogyan működik"**: 3 lépéses folyamat
- **Statisztika-sáv**: 30 mp / 1 nap / 0 letöltés
- **GYIK**: árazás egyelőre nyitva hagyva ("kérj demót, egyeztetünk")
- **Záró CTA + lábléc**
- **"Demó kérése" gomb** → külön kapcsolatfelvételi form (név, e-mail, vállalkozás neve, üzenet) → megerősítő képernyő
- **"Bejelentkezés" gomb** → login képernyő (demó mód, bármilyen adattal beléphetsz) → tulajdonosi dashboard (csak saját egység, e-mail cím és sorsolási azonosító nélkül)
- **Tulajdonosi dashboard**: "Áttekintés" / "Napló" fül — a Napló nézet soronként mutatja a leadott értékeléseket, egyedi szavazat-azonosítóval, másodperces időbélyeggel, szűrhető időszak/pontszám/sorsolás-jelentkezés szerint
- **Rejtett admin-belépés**: a lábléc alatti, alig látható pont-link → külön, sötét hátterű admin-bejelentkező → admin dashboard, ahol minden egység, minden vendég e-mail címe és sorsolási azonosítója látható

**Státusz:** kész, reszponzív (mobil + laptop nézet), heatmap zöld-árnyalatai finomítva a jobb kontraszt érdekében

---

## Fontos döntések / nyitott kérdések

- **Márkanév**: *Guestly* — ellenőrizendő domain- és App Store-szinten, mielőtt véglegesítenéd (a korábbi *Visify* és *Vello* nevek már foglaltak voltak)
- **Árazás**: még nincs kialakítva, a landing page jelenleg erre nem tesz konkrét ígéretet
- **Backend**: a bejelentkezés és az adatok jelenleg demó-szinten működnek (nincs valódi felhasználó-adatbázis) — éles használathoz ez a következő fejlesztési lépés

---

## Következő lépések, amikről szó volt
- Saját, letölthető HTML-fájl elkészítése (hogy telefonon/asztali gépen kezdőképernyőre menthető, ingyenes hosting pl. Netlify Drop-on keresztül közzétehető legyen)
- Domain-ellenőrzés a Guestly névre
- Valódi backend/adatbázis kialakítása, ha live tesztelésre kerül sor

---

## Jövőbeli, másodlagos funkció: opcionális hűségprogram

**Ötlet:** a jelenlegi opcionális nyereményjáték-jelentkezés (e-mail megadása) mellé egy második, szintén opcionális lépés — "Szeretnél pontokat gyűjteni a következő látogatásokra is?" — ami egy hosszabb távú, visszatérő hűségprogramba kapcsolná be a vendéget.

**Miért opcionális, nem kötelező:**
- Turista-erős piacokon (pl. Miami–Fort Lauderdale vonal) a vendégek nagy része nem tér vissza, így egy kötelező hűségprogram felesleges súrlódást okozna anélkül, hogy értéket adna.
- Opcionálisan viszont nem zavarja a turista-vendéget, miközben a helyi törzsközönséggel rendelkező üzleteknél valódi plusz értéket ad.

**Mikor érdemes belefektetni:**
- Nem most — előbb az alaptermék (értékelő rendszer + dashboard) piaci validációja a fontos.
- Akkor éri meg komolyabban megépíteni, ha már vannak valós ügyfelek, és ők maguk kérik ezt a funkciót, vagy ha a terjeszkedés olyan piacra/városrészre irányul, ahol erősebb a helyi, visszatérő vendégkör (kevésbé turistazóna).

**Technikai megjegyzés:** ehhez már valamilyen azonosított, visszatérő felhasználói fiók kellene (pl. magic link e-maillel, vagy telefonszám-alapú azonosítás — nem klasszikus jelszavas regisztráció), plusz adatbázis és pontbeváltási logika az üzlet oldalán. Ez egy érdemben nagyobb backend-fejlesztés, mint a jelenlegi egyszeri sorsolás.

---

## Admin vs. tulajdonosi hozzáférés

**Jelenlegi állapot (demó-szinten megoldva):**
- A tulajdonosok a publikus "Bejelentkezés" gombon keresztül jutnak be — csak a saját egységük adatait látják, **e-mail cím és sorsolási azonosító nélkül**.
- Az admin (te) hozzáférést egy szándékosan rejtett, alig látható link biztosítja a landing page lábléce alatt — ez egy vizuálisan is elkülönített, sötét hátterű admin-bejelentkezőre visz, ahonnan minden egységhez, minden vendég e-mail címéhez és sorsolási ID-hoz hozzáférsz.
- Ez a megoldás **csak arra jó, hogy demózhasd a koncepciót** — nem valódi jogosultság-kezelés, csak vizuálisan van elrejtve.

**Miért nem ez a végleges megoldás:**
- Az artifact-alapú környezet egyetlen fájlban, egyetlen URL-en fut — nem támogat valódi, több útvonalas (multi-route) webalkalmazást saját címekkel.
- Éles használatra egy **valódi, külön admin URL** kell (pl. `admin.guestly.hu` egy külön aldomainen, vagy `guestly.hu/admin` route-ként), amit egy tényleges backend/szerver különít el a tulajdonosi felülettől — ezt már nem lehet pusztán frontend-kóddal, jogosultság-ellenőrzés nélkül biztonságosan megoldani.
- Ehhez egy valódi fejlesztői környezet (pl. Next.js vagy hasonló, saját routing-gal és szerveroldali hitelesítéssel) és hosting szükséges — ez a következő, backend-fejlesztést igénylő lépés, ha a termék éles használatba kerül.

---

## Éles indulás ingyenes eszközökkel

**A cél:** a jelenlegi demó (statikus, nem mentődő adatok, nincs valódi hitelesítés) átalakítása egy ténylegesen működő, éles alkalmazássá — nulla vagy közel nulla induló költséggel.

**Javasolt ingyenes eszközkészlet:**

| Terület | Eszköz | Miért ez |
|---|---|---|
| Backend + adatbázis + hitelesítés | **Supabase** | Ingyenes csomagja bőven elég induláshoz: valódi adatbázis, felhasználó-kezelés, jogosultságkezelés egyben |
| Weboldal futtatása (hosting) | **Vercel** vagy **Netlify** | Mindkettő ingyenes csomagot ad kisebb projektekhez, és jól együttműködik a Next.js-szel |
| Fejlesztési keretrendszer | **Next.js** | React-alapú, támogatja a valódi, több-URL-es routingot (pl. külön `/admin` útvonal) — ez az, ami itt, az artifact-környezetben nem megoldható |
| QR-kód generálás | Ingyenes online generátor (pl. qr-code-generator.com) vagy egy pár soros ingyenes kódkönyvtár | Nem igényel fizetős szolgáltatást |
| E-mail küldés (nyereményjáték-értesítés, demó-visszaigazolás) | **Resend** vagy **SendGrid** ingyenes csomagja | Havi pár száz e-mailig ingyenes, induláshoz elég |
| Domain | Ez az egyetlen tényleges költség, ha profi domain-t szeretnél (kb. 3000–15000 Ft/év) | Elkerülhető egy ingyenes aldomainnel (pl. `guestly.vercel.app`), de kevésbé profi megjelenés |

**A valódi "ár": idő és tanulás, nem pénz.**
Ha nem vagy fejlesztő, ennek felépítése hetekbe-hónapokba telhet, mert meg kell tanulnod (vagy AI-eszközzel megcsináltatnod) a Next.js/React és Supabase alapjait. A jelenlegi design és logika jó kiindulópont, de nem másolható át 1:1 — újra kell építeni valódi adatbázis-kapcsolatokkal.

**Reális következő lépés:**
A leggyorsabb ingyenes út: **Claude Code** (Anthropic fejlesztői eszköze) segítségével, lépésről lépésre felépíteni ugyanezt Next.js + Supabase kombóval. Ez pontosan arra való, hogy valaki komolyabb kód-tapasztalat nélkül is el tudjon jutni egy éles, működő alkalmazásig, AI-asszisztenssel dolgozva lépésenként.

**Javasolt sorrend:**
1. Supabase-fiók létrehozása, adatbázis-séma kialakítása (partnerek, értékelések, felhasználók tábláinak megtervezése a jelenlegi demó-adatstruktúra alapján)
2. Next.js projekt indítása, Supabase összekötése (hitelesítés + adatbázis-lekérdezések)
3. A jelenlegi design/komponensek átültetése Next.js oldalakra, valódi adatlekérdezésekkel a demó-adatok helyett
4. Külön `/admin` route kialakítása, szerveroldali jogosultság-ellenőrzéssel (ez váltja ki a jelenlegi "rejtett link" megoldást)
5. Vercel/Netlify-ra telepítés, majd domain hozzákötése (ha van rá büdzsé)

---

## Összképes értékelés — érdemes-e vállalkozásként folytatni?

**Rövid válasz: igen, reális esély van rá.** A koncepció (QR-alapú, valós idejű vendégelégedettség-mérés, óránkénti bontással) valós fájdalompontra válaszol — a legtöbb kisvendéglátós utólag, egy rossz Google-értékelésből tudja meg, hogy valami elromlott, nem valós időben. A jelenlegi terv (kérdéscsoportok, partner-kezelés, admin/tulajdonos szerepkör-szétválasztás) jól átgondolt, skálázható alap.

### A legfontosabb hiányosságok / kockázatok

1. **Nincs még validált fizetési hajlandóság.** Eddig nulla valós ügyfél-visszajelzés van arról, hogy egy vendéglátós tényleg fizetne ezért.
2. **Nincs árazási modell.** Alapvető blokkoló — nem lehet élesíteni fizető ügyfelekkel ár nélkül.
3. **A "több partner, egy admin" modell skálázási kérdéseket vet fel**: ki kezeli a support-kéréseket, a QR-kódok kihelyezését, a technikai problémákat, ha 20-30 partner lesz?

### Élesítés előtti technikai checklist (fontossági sorrendben)

**Nem indulhat nélkülük:**
- Valódi adattárolás (Supabase-átállás) — most minden a böngésző memóriájában él, frissítésnél elvész
- QR-kód → partner/asztal összekapcsolás validálása (valódi, beolvasható kód, nem csak demó-mintázat)
- Duplikált-értékelés elleni védelem (session/cookie + IP-minta) — koncepció megvan, még nincs beépítve
- E-mail-küldés a nyereményjátékhoz (jelenleg csak vizuális visszaigazolás van)
- Jelszó-visszaállítás / valódi fiókkezelés

**Fontos, de nem feltétlenül blokkoló induláskor:**
- GDPR-tájékoztató és explicit hozzájárulás-jelölő a nyereményjáték-e-mail megadásánál
- A "Figyelendő egységek" riasztás küszöbértékének (jelenleg fix 6.5) admin-szintű állíthatósága
- Valós eszközös tesztelés (régebbi Android, kisebb képernyők), mielőtt QR-kódot nyomtatsz

### Javasolt lépések induláskor, üzleti oldalon

1. **Validáció fejlesztés előtt**: demózd le a jelenlegi artifact-verziót személyesen 3-5 potenciális vendéglátós-ügyfélnek, mielőtt a Next.js/Supabase-átállásba időt/pénzt fektetsz. Ha ők azt mondják, fizetnének ezért, van vállalkozás; ha nem, még olcsón pivotálható a koncepció.
2. **Árazási modell kialakítása** — ezt a technikai fejlesztés előtt kell tisztázni, nem utána.
3. **Egyszerű onboarding-folyamat** új partnereknek — most kézzel adod hozzá a partnereket; egy önálló regisztrációs form (pl. a "Demó kérése" utáni lépésként) csökkentené a manuális terhet.
4. **Alapszintű súgó/FAQ a tulajdonosi felületen** — az első benyomás a dashboard-dal kritikus az elköteleződéshez.
5. **"Első értékelés" ünneplő pillanat** — értesítés/e-mail, amikor egy új partner megkapja az első valódi visszajelzését, sokat segít az elköteleződésben.

---

## Árazási gondolatok (frissítve a Google Review-s pozicionálás után)

**Kiinduló kérdés volt**: mennyit érdemes kérni havidíjas előfizetésért, HU és USA/Florida piacon.

**Első megközelítés (piaci viszonyítás alapján):**
- Egyszerű, nemzetközi QR-kód-generátor eszközök (pl. Uniqode) $5-8/hó áron indulnak — de ezek **csak QR-kódot generálnak**, ami egy külső kérdőívhez/Google Review linkhez vezet. Nincs saját elemzés, dashboard, riasztás.
- Komolyabb, több-csatornás customer-feedback platformok (pl. Podium, USA) $259/hó-tól indulnak — de ezek sokkal szélesebb körű eszközök (SMS, CRM, fizetés), nem összevethetők közvetlenül.
- Ezek alapján egy első becslés: HU 25.000 Ft/hó, USA/Florida $39-79/hó — a "sima QR-generátor" és a "teljes enterprise-platform" közötti sáv.

**Fontos felismerés, ami módosítja ezt:**
A Guestly nem egy QR-generátorral versenyez (az csak egy eszköz a folyamatban, nem a termék maga) — a valós összehasonlítási alap a **Google Review**, mint jelenleg elterjedt, de strukturálisan hiányos "megoldás":
- Google Review **nyilvánosan, késve, összesítve** mutatja az elégedettséget — egy 5 éves vállalkozásnál egy rossz hónap alig mozgatja a kumulált csillagszámot, így egy jelenleg romló trend **nem látszik a felszínen**.
- A Guestly ezzel szemben **valós időben, belsőleg, időben elkülönítve** (heti/napi/egyéni időszak) mutatja az állapotot — ez nem egy "extra funkció", hanem a **fő értékajánlat**.
- A termék kettős célt szolgál: **elégedettségmérés** és **vállalkozásfejlesztési eszköz** (mikor/hol van szükség plusz figyelemre a csapattól) — ez utóbbi de facto egy teljesítmény-nyomkövetési funkció is, amit érdemes fejlesztés-orientált nyelvezettel kommunikálni, nem "alkalmazott-kontrollként" (lásd jogi/etikai megjegyzés alább).

**Ez alapján módosított árazási gondolat:**
- A **25.000 Ft/hó HU-ban nem tekinthető túlárazottnak** — az érvrendszer (elveszett vendég értéke, korai észlelés haszna) alapján ez inkább **alsó, biztonságos belépő ár**, nem felső határ.
- Érdemes lehet **kétszintű csomagstruktúrát** kialakítani: alapcsomag (dashboard, napi/heti bontás) alacsonyabb áron, "teljes" csomag (kérdéscsoport-testreszabás, napi nyereményjáték-kezelés, prioritásos support) 30-40 ezer Ft/hó körül.
- USA/Florida piacon a $39-79/hó sáv továbbra is reális kiindulópont, ugyanezzel a Google Review-s pozicionálással kommunikálva.

**Fontos figyelmeztetés — ez retorika, nem mért adat:**
Az "elveszett vendég értéke" és a "korai észlelés haszna" **feltételezések**, amivel az árazás igazolható, de nem tényleges ROI-mérésből származnak. A validációs beszélgetéseknél (3-5 potenciális partnerrel) érdemes **pontosan ezt az érvrendszert kipróbálni élesben** — a Google Review-s összehasonlítást és a kumulatív-átlag problémáját elmondva —, és megfigyelni, mennyire hat valós tulajdonosokra, illetve hogy tényleg hajlandók-e ezért az árért fizetni.

**Jogi/etikai megjegyzés a "vállalkozásfejlesztési" funkcióról:**
Mivel a rendszer de facto alkalmazotti teljesítményt is mérhet (mikor/melyik műszakban gyengébb egy szempont), érdemes átgondolni, hogy ez munkajogi kérdéseket vet-e fel (adatvédelem, mire használható fel személyzeti döntéseknél) — ezt a landing page-en és a partnerekkel folytatott beszélgetésekben is fejlesztés-orientált, nem büntetés-orientált nyelvezettel érdemes kommunikálni.

---

## Előfizetési struktúra: havi vs. 3/6 hónapos csomagok

**Kérdés volt**: 1 hónapos havidíj, vagy 3/6 hónapos csomagok legyenek?

**Javasolt fázisos megközelítés:**

**1. fázis — indulás, validáció (jelenlegi állapot):**
- **Csak havi, bármikor felmondható előfizetés** — ez a legalacsonyabb belépési korlát az első partnereknek, akiknek még nincs bizonyítékuk arra, hogy a rendszer hosszú távon értéket ad.
- Megfontolható egy **"első hónap kedvezményes/ingyenes"** akció, hogy a validációt (3-5 partner tesztelése) megkönnyítse.
- Ok: validáció-fázisban nincs még referencia/bizonyított érték, amivel meggyőzhető lenne valaki egy hosszabb elköteleződésre — a havi opció csökkenti a kockázatot mindkét oldalon.

**2. fázis — 3-5 elégedett, referenciaként felhasználható partner után:**
- Bevezetni **3 és 6 hónapos előre fizetős csomagokat**, kedvezménnyel (pl. 10-15%) a havi árhoz képest.
- Ez stabilabb, kiszámíthatóbb bevételt ad, miközben a partnernek is van ösztönzője hosszabb távra elköteleződni.
- Ekkor már van bizonyíték (referenciapartnerek), amivel a hosszabb elköteleződés eladhatóvá válik — nem csak ígéretre épül.

**Miért nem érdemes most, azonnal 3/6 hónapos csomaggal indulni:**
- Egy validálatlan, új terméknél nehezebb "igent" kapni egy hosszabb elköteleződésre — a potenciális partner joggal kérdezhetné, miért kötelezze el magát hónapokra egy ki nem próbált eszközért.
- A havi opció megengedi, hogy gyorsan, alacsony kockázattal gyűjts valós felhasználói visszajelzést és referenciákat, amelyek később a hosszabb csomagok eladását megalapozzák.

---

## Ingyenes próbaidő

**Kérdés volt**: érdemes 1-2 hónap ingyenes kezdést biztosítani?

**Javasolt megoldás: 2-4 hetes ingyenes próba, nem 1-2 hónap.**

**Miért jó ötlet az ingyenes próba általában:**
- Radikálisan csökkenti a belépési korlátot a validáció-fázisban — nincs pénzügyi kockázat a partnernek a kipróbáláshoz.
- Időt ad arra, hogy összegyűljön elég értékelés ahhoz, hogy a dashboard (hőtérkép, riasztás) valóban meggyőző legyen.

**Miért 2-4 hét, nem 1-2 hónap:**
1. **Költség a te oldaladon**: a próbaidő alatt is fut a Supabase/hosting/e-mail-küldés költsége, amíg a partner nem fizet — hosszabb ingyenes időszak nagyobb, bevétel nélküli terhelést jelent, főleg ha sok partner egyszerre próbál.
2. **"Ingyen → fizetős" lélektani törés**: hosszabb ingyenes időszak után nehezebb elfogadtatni a hirtelen díjfizetést, még elégedett partnereknél is — ez nem feltétlenül az elégedettségről szól, csak a váltás pszichológiailag nehéz.
3. **Torzíthatja a validációt**: ha valaki ingyen kipróbálja és nem fizet utána, ez nem feltétlenül azt jelenti, hogy nem ér neki annyit — lehet, hogy csak az ingyen-fizetős váltást nem szereti. Ez elmossa a legfontosabb kérdést: "fizetnél-e ezért, és mennyit".

**Alternatíva, ha rövidebb próbaidő mellett is erősebb kedvezmény kell:**
Az első hónap **féláron**, nem teljesen ingyen — ez már valós fizetési hajlandóságot mér (még kedvezményesen is), miközben az alacsony belépési korlát is megmarad.

---

## Partnerszerzési stratégia: kisebb partnerek előbb, nagy láncok később

**Kérdés volt**: érdemes egy ismertebb, nagyobb kávézólánchoz (pl. Frei Café) fordulni ingyenes ajánlattal, csak a névhasználatért/reklámcélra?

**Döntés: kisebb, helyi partnerekkel kezdeni, nagy láncokat csak később, bizonyított referenciákkal megkeresni.**

**Miért ez az okosabb sorrend:**
1. **Gyorsabb, egyszerűbb döntéshozás** — egy önálló, kisebb kávézó/étterem tulajdonosával közvetlenül lehet tárgyalni, nincs központi marketing/üzemeltetési jóváhagyási lánc, mint egy láncnál.
2. **Kisebb kockázat validáció-fázisban** — ha egy demó-szintű, még nem teljesen éles rendszernél technikai probléma adódik, ez egy kisebb, helyi partnernél kevésbé rombolja a hírnevet, mint egy ismert márkánál.
3. **A "csak névhasználatért, ingyen" modell kockázatos**: ha a fő cél a márka reklámcélú felhasználása, nem a tényleges, dokumentált használat, ez etikai/jogi kérdéseket vet fel — a legtöbb márka szerződéses engedélyt is kérne a név/logó marketingben történő használatához.
4. **A kisebb partnerekkel szerzett működő referencia később megalapozza a nagyobb láncok felé nyitást** — ha van 2-3 sikeres, elégedett kisebb partner, ez sokkal hitelesebb kiindulópont egy nagyobb lánc megkereséséhez, mint egy validálatlan, demó-szintű rendszer felajánlása ingyen.

**Ha később mégis nagyobb lánc felé nyitnál:**
Ne ingyenességet, hanem jelentős kezdő kedvezményt és explicit, írásos megállapodást ajánlj a referenciaként történő hivatkozásról — ez tisztázza a kereteket, és elkerüli a "csak a névért akarom" félreértést.

---

## Ingyenes vs. fizetős modell — végleges döntés

**Kérdés volt**: egy fejlesztő javasolta, hogy a termék legyen teljesen ingyenes, hogy gyorsan elterjedjen ("fél országban ott lenne").

**Végleges döntés: csak fizetős modell az elejétől, nincs freemium vagy teljesen ingyenes verzió.**

**Miért nem freemium/ingyenes:**
- Egy teljesen ingyenes modellnél nincs bevétel, amiből a szervert, fejlesztést, support-ot fenntartani lehetne — hosszú távon ez nem vállalkozás, hanem önfinanszírozott ráfizetés, hacsak nincs más, tisztázott bevételi forrás (hirdetés, adateladás — mindkettő saját kockázatokkal jár: hirdetés rombolná a vendég-élményt, adateladás GDPR-szempontból kockázatos).
- A "legyen ingyenes, hogy elterjedjen" jellemzően technikai szemléletű tanács, ami a felhasználószám-maximalizálásra fókuszál, nem a fenntartható bevételre — ez nem ugyanaz, mint egy működő vállalkozás.
- Validáció-fázisban a fizetési hajlandóság az egyetlen tiszta szignál arra, hogy valóban van-e piaci igény — egy ingyenes regisztráció nem bizonyítja ugyanezt.
- Korlátozott kapacitás (idő, support) esetén kevesebb, de fizető ügyfelet könnyebb kiszolgálni, mint sok ingyenes felhasználót, akik support-igényt generálnak bevétel nélkül.

**A freemium opció nincs teljesen kizárva a jövőre, de nem prioritás**: ha a fizetős modell bizonyítottan működik és van kapacitás a bővülésre, egy ingyenes, korlátozott szint később megfontolható lenne elterjedés-gyorsító célból — de ez már egy bizonyított, működő fizetős alapra épülne, nem helyettesítené azt.
