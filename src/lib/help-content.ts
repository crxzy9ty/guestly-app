export type HelpFaq = { q: string; a: string };

export const ownerHelpFaqs: HelpFaq[] = [
  {
    q: "Mit jelent az Áttekintés fülön a hőtérkép?",
    a: "Minden cella egy adott nap egy adott óráját mutatja, 1-10 skálán. Minél zöldebb egy cella, annál jobb az átlag; a magenta/rózsaszín cellák gyengébb eredményt jeleznek. Az üres, szaggatott keretű cellákhoz még nem érkezett elég értékelés.",
  },
  {
    q: "Miért mutat figyelmeztetést a rendszer?",
    a: "Ha egy szempont átlaga a partneredhez beállított riasztási küszöb alá esik, a rendszer automatikusan kiemeli — a konkrét nap+óra megjelölésével, ha van rá elég adat —, hogy időben tudj reagálni, például extra személyzetet beosztani egy forgalmas időszakra.",
  },
  {
    q: "Mit látok a Napló fülön?",
    a: "Minden egyes leadott értékelést, egyedi szavazat-azonosítóval és pontos időbélyeggel. Ha egy vendég 1-3 pontot adott valamelyik szempontra, itt látod, ha írt is hozzá pár szavas indoklást. A dátum és pontszám szerint szűrhetsz, és CSV-be is exportálhatod a listát.",
  },
  {
    q: "Miért nem látom a vendégek e-mail címét?",
    a: "Adatvédelmi okból a vendégek e-mail címét és a sorsolási azonosítót csak a Guestly admin felülete mutatja — ez a partneri nézetben szándékosan nincs benne.",
  },
  {
    q: "Hogyan kapok visszajelzést?",
    a: "Az asztalokon elhelyezett QR-kódot beolvasva a vendég kb. 30 másodperc alatt tud értékelni — nincs szükség letöltendő alkalmazásra.",
  },
  {
    q: "Több egységet is kezelek — hogyan váltok köztük?",
    a: "Ha egynél több egységhez van hozzáférésed, a fejlécben egy egység-választó jelenik meg — ott tudsz váltani, az Áttekintés és a Napló mindig a kiválasztott egységre vonatkozik.",
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
    q: "Hogyan állítom be, mikor jelezzen riasztást a rendszer?",
    a: "A Partnerek fülön, egy egység szerkesztésekor a \"Riasztási küszöb\" mezőben partnerenként külön beállítható — ez alapból 6.5, de igazíthatod az adott hely elvárásaihoz.",
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
    a: "Azt, hogy a vendéget kisorsoltuk, de az értesítő levél nem jutott el hozzá — tehát ő nem tudja, hogy nyert. Ilyenkor neked kell átadnod a kupon-kódot, ami ott áll mellette a sorban. A leggyakoribb ok, hogy még nincs verifikált küldő-domain a Resendben: a teszt-feladó csak a saját fiókod címére tud kézbesíteni, minden más címet elutasít. Ha ez a jelzés rendszeresen megjelenik, a Resendben verifikálj egy domaint, és állítsd át rá az EMAIL_FROM változót.",
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
];
