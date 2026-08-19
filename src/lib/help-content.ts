export type HelpFaq = { q: string; a: string };

export const ownerHelpFaqs: HelpFaq[] = [
  {
    q: "Mit jelent az Áttekintés fülön a hőtérkép?",
    a: "Minden cella egy adott nap egy adott óráját mutatja, 1-10 skálán. Minél zöldebb egy cella, annál jobb az átlag; a magenta/rózsaszín cellák gyengébb eredményt jeleznek. Az üres, szaggatott keretű cellákhoz még nem érkezett elég értékelés. Az órák a te nyitvatartásodhoz igazodnak, ha az admin beállította azt — ha nem, alapból 8-20 óráig mutatja.",
  },
  {
    q: "Mi a különbség a Trend és a Hőtérkép nézet között?",
    a: "A Trend a kiválasztott szempont értékeléseit időrendben mutatja, hogy lásd, javul vagy romlik-e az adott terület a kiválasztott időszakban. Az alatta lévő Hőtérkép azt mutatja meg, mikor (melyik nap, melyik napszak) gyengébb ugyanez a szempont — ez segít eldönteni, mikor kell erősíteni a személyzetet. A kettő egymás alatt látszik, nem kell köztük váltani.",
  },
  {
    q: "Miért mutat figyelmeztetést a rendszer?",
    a: "Ha egy szempont átlaga a partneredhez beállított riasztási küszöb alá esik, a rendszer automatikusan kiemeli — a konkrét nap+óra megjelölésével, ha van rá elég adat —, hogy időben tudj reagálni, például extra személyzetet beosztani egy forgalmas időszakra.",
  },
  {
    q: "Mit jelent a figyelmeztetés alatti \"Javaslat\" doboz?",
    a: "Egy előre megírt, gyakorlati ötlet, ami a gyengébb nap+óra kombinációhoz kapcsolódik — nem mesterséges intelligencia generálja, hanem egy pár kész szövegből választ ki egyet, mindig ugyanazt ugyanahhoz a helyzethez. A mellette lévő színes címke (pl. \"Gyenge\", \"Kritikus\") egy fix 1-10 skálán mutatja, mennyire rossz a pontszám — ez független attól, milyen riasztási küszöböt állítottál be, tehát mindig ugyanazt jelenti. Tekintsd tanácsnak, nem mért adatnak; a döntés mindig a tiéd.",
  },
  {
    q: "Mit látok a Napló fülön?",
    a: "Minden egyes leadott értékelést, egyedi szavazat-azonosítóval és pontos időbélyeggel. Ha egy vendég 1-3 pontot adott valamelyik szempontra, itt látod, ha írt is hozzá pár szavas indoklást. A dátum és pontszám szerint szűrhetsz, és CSV-be is exportálhatod a listát.",
  },
  {
    q: "Miért nem látom a vendégek e-mail címét?",
    a: "Adatvédelmi okból a vendégek e-mail címét és a sorsolási azonosítót csak a Fydback admin felülete mutatja — ez a partneri nézetben szándékosan nincs benne.",
  },
  {
    q: "Hogyan kapok visszajelzést?",
    a: "Az asztalokon elhelyezett QR-kódot beolvasva a vendég kb. 30 másodperc alatt tud értékelni — nincs szükség letöltendő alkalmazásra.",
  },
  {
    q: "Több egységet is kezelek — hogyan váltok köztük?",
    a: "Ha egynél több egységhez van hozzáférésed, a fejlécben egy egység-választó jelenik meg — ott tudsz váltani, az Áttekintés és a Napló mindig a kiválasztott egységre vonatkozik.",
  },
  {
    q: "Hogyan módosítom a jelszavam?",
    a: "A fejlécben a \"Jelszó módosítása\" linkre kattintva egyenesen az új jelszó megadására jutsz — nem kell hozzá kilépned vagy e-mailt kérned.",
  },
];

export const adminHelpFaqs: HelpFaq[] = [
  {
    q: "Mi a különbség az Áttekintés és a partnerek saját nézete között?",
    a: "Az admin Áttekintés az összes partner portfólió-szintű összesítését mutatja: aktív partnerek száma, összesített értékelésszám, egységek rangsora, és automatikus riasztás azoknál, ahol valamelyik szempont a saját küszöbük alá esik. Ha egy konkrét egységet szeretnél úgy látni, ahogy a partner látja (szempont-kártyák, hőtérkép, riasztás), kattints a rangsorban a \"Részletek\" linkre, vagy magára a riasztás-kártyára.",
  },
  {
    q: "Hogyan adok hozzá új partnert?",
    a: "A Partnerek fülön \"Új vendéglátóegység hozzáadása\" — töltsd ki a nevet (a többi mező opcionális), majd mentsd el.",
  },
  {
    q: "Hogyan tud a tulajdonos bejelentkezni?",
    a: "A Partnerek fülön az adott sor \"Meghívás\" gombjával adhatod meg az e-mail címét — ha új cím, meghívó levelet kap jelszó-beállító linkkel; ha már van fiókja (mert másik egységet is kezel), csak hozzárendeljük ehhez az egységhez is.",
  },
  {
    q: "Be tudok állítani jelszót e-mail küldése nélkül?",
    a: "Igen. A \"Meghívás\" modálban jelöld be a \"Jelszó generálása e-mail helyett\" opciót — a fiók azonnal elkészül, és a felületen megjelenik egy ideiglenes jelszó, amit átadhatsz a partnernek. Akkor hasznos, ha épp együtt vagytok, vagy ha a levélküldés órai korlátjába ütköztél. Javasold neki, hogy első bejelentkezés után változtassa meg.",
  },
  {
    q: "Hogyan tudok QR-kódot generálni egy partnerhez?",
    a: "A Partnerek táblázatban minden sornál található egy \"QR-kód\" gomb — ez megnyit egy előnézetet, amit letölthetsz és kinyomtathatsz kihelyezésre.",
  },
  {
    q: "Mit mutat a \"Napi értékelésszám\" grafikon az Áttekintésen?",
    a: "Az elmúlt 30 nap értékelésszámát, az összes partner együtt — egyfajta pulzusmérő a teljes portfólióra. A halványszürke, alig látható oszlopok azt jelzik, hogy azon a napon nem érkezett értékelés sehonnan; ez segít észrevenni, ha hirtelen leáll a forgalom (pl. mert egy QR-kód elromlott egy frissítés után), nem csak azt, ha egy adott partnernél kiugrás van — az utóbbit a \"Szokatlan forgalom\" jelzés figyeli.",
  },
  {
    q: "Mit jelent a \"Szokatlan forgalom\" sárga jelzés?",
    a: "Azt, hogy az adott egységnél az elmúlt 24 óra értékelésszáma jóval kilóg a saját szokásos napi forgalmából (legalább 20 értékelés, és legalább a szokásos háromszorosa). Nem hiba és nem vád: lehet kampány, rendezvény vagy egyszerűen egy jó nap. Azért van, hogy egyáltalán észrevedd — a rendszer nem tudja teljesen megakadályozni, hogy valaki szkripttel hamis értékeléseket küldjön be, csak megnehezíti. Kattints a jelzésre, és nézd meg a Naplóban: sok, percek alatt érkezett, hasonló mintázatú értékelés gyanús. Új partnereknél nem jelez, amíg nincs elég előzményük az összehasonlításhoz.",
  },
  {
    q: "Hogyan állítom be, mikor jelezzen riasztást a rendszer?",
    a: "A Partnerek fülön, egy egység szerkesztésekor a \"Riasztási küszöb\" mezőben partnerenként külön beállítható — ez alapból 6.5, de igazíthatod az adott hely elvárásaihoz.",
  },
  {
    q: "Mit jelent a figyelmeztetés alatti \"Javaslat\" doboz egy egység nézeténél?",
    a: "Egy előre megírt, gyakorlati ötlet a gyengébb nap+óra kombinációhoz — nem AI generálja, egy pár kész szövegből választ ki egyet konzisztensen, mindig ugyanazt ugyanahhoz a helyzethez. A mellette lévő színes címke egy fix, minden partnernél ugyanazt jelentő 1-10 skálán mutatja a súlyosságot, függetlenül attól, az adott partnernek milyen riasztási küszöbe van beállítva. Ha egy partner rákérdez, nyugodtan mondd, hogy ez egy sablon-tanács, nem a rendszer által \"kiszámolt\" megoldás.",
  },
  {
    q: "Miért 8-20 óráig mutatja a hőtérkép egy éjszaka nyitva tartó helynél?",
    a: "Mert nincs beállítva a nyitvatartása. A Partnerek fülön, az egység szerkesztésekor add meg a \"Nyitás órája\" és \"Zárás órája\" mezőket (pl. 18 és 2, ha éjfél után zár) — ezután a hőtérkép a partner saját órái szerinti oszlopokat mutatja, nem az alapértelmezett 8-20-at. Mindkét mezőt együtt kell megadni, vagy hagyd mindkettőt üresen.",
  },
  {
    q: "Mire jók a kérdéscsoportok?",
    a: "A Beállítások → Kérdéscsoportok fülön kezelheted, mely kérdéseket kapják a vendégek. Az \"Alap kérdések\" minden új partnernek jár, de létrehozhatsz egyedi csoportokat, és a Hozzárendelés fülön egyszerre több partnerhez is hozzárendelheted őket.",
  },
  {
    q: "Hogyan sorsolok napi nyertest?",
    a: "Alapesetben sehogy: a sorsolás minden éjjel automatikusan lefut minden partnernél az előző napra, és a nyertes e-mailben megkapja a kupon-kódot. Az előző napra sorsolunk, nem az aktuálisra, hogy az este későn értékelők se maradjanak ki. Ha valamiért kézzel akarod lezárni a mai napot, a Napló fülön válaszd ki az egységet a szűrőben, és használd a \"Mai nyertes sorsolása\" gombot — egy napra egy egység csak egyszer sorsolható, tehát ez nem tud dupla kupont kiadni.",
  },
  {
    q: "Mit jelent a Naplóban a piros \"e-mail nem ment ki\" jelzés?",
    a: "Azt, hogy a vendéget kisorsoltuk, de az értesítő levél nem jutott el hozzá — tehát ő nem tudja, hogy nyert. Ilyenkor neked kell átadnod a kupon-kódot, ami ott áll mellette a sorban. A küldő domain verifikálva van, de a kézbesítés soha nem lesz 100% — egy levelezőszolgáltató időnként spamnek jelölhet egy levelet, főleg új domainnél, amíg fel nem épül a reputációja.",
  },
  {
    q: "Hogyan szerkesztem a nyilvános landing oldal szövegét?",
    a: "A Beállítások → Tartalom szerkesztése fülön — a mentés után azonnal megjelenik a látogatóknak.",
  },
  {
    q: "Honnan látom, ki kért demót?",
    a: "A Beállítások → Demó kérések fülön — itt a státuszt is jelölheted (Új / Felvéve a kapcsolat / Lezárva).",
  },
  {
    q: "Hogyan találok meg egy adott partnert egy nagy listában?",
    a: "A Partnerek, a Napló és a Hozzárendelés fülön is van keresőmező — kereshetsz név, cím, e-mail vagy kapcsolattartó szerint.",
  },
  {
    q: "Mit jelent a \"Csak sorsolásra jelentkezettek\" szűrő?",
    a: "Csak azokat az értékeléseket mutatja, ahol a vendég megadta az e-mail címét a nyereményjátékhoz.",
  },
  {
    q: "Hogyan hívok meg egy másik adminisztrátort?",
    a: "A Beállítások → Adminok fülön a \"+ Admin meghívása\" gombbal. Egyszerre több admin fiók is bejelentkezhet, egymástól függetlenül, más-más helyről — nincs korlátozva a szám. Fontos: minden admin fiók ugyanazt a teljes hozzáférést kapja minden partner adatához, vendég-e-mail címekkel és sorsolási adatokkal együtt, tehát csak megbízható embert hívj meg.",
  },
  {
    q: "Hogyan törlök egy admin fiókot?",
    a: "Ezt szándékosan csak egyetlen, kijelölt fiók teheti meg — nála a lista minden sorában megjelenik egy \"Törlés\" gomb. Ha nálad nem látszik, az azt jelenti, hogy a te fiókod nincs erre kijelölve; ez nem hiba, hanem tudatos korlátozás, hogy egy admin fiók feltörése esetén se lehessen az összes többit egyszerre eltávolítani. A saját fiókodat még a kijelölt fiókkal sem lehet törölni, hogy soha ne maradhasson admin nélkül a rendszer.",
  },
  {
    q: "Hogyan módosítom a saját jelszavam?",
    a: "A fejlécben a \"Jelszó módosítása\" linkre kattintva egyenesen az új jelszó megadására jutsz — nem kell hozzá kilépned vagy e-mailt kérned.",
  },
];
