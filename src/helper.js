
export const normalizeTeamName = (name) => {
    if (!name) return '';
    return name.trim().toLowerCase()
        .replace(/ç/g, 'c')
        .replace(/ğ/g, 'g')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ş/g, 's')
        .replace(/ü/g, 'u')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
};

// TÜM 800+ LOGO DOSYALARI İÇİN TAM EŞLEŞTİRME
const ALL_TEAM_LOGOS = [
    '1-fc-heidenheim', '1-fc-koln', '1-fc-tatran-preov', '1-fc-union-berlin', '1-fsv-mainz-05', '1-sk-prostjov',
    'aali', 'aberdeen', 'ac-marinhense', 'ac-vila-mea', 'academica-vitoria', 'academico-viseu-fc', 'academico-viseu-u23',
    'accra-hearts-of-oak', 'accrington-stanley', 'ad-camacha', 'ad-ceuta', 'ad-jaguar', 'ad-machico', 'ad-os-limianos',
    'adana-demirspor', 'adelaide-united', 'ado-den-haag', 'aduana-stars-fc', 'aek-larnaca', 'ael-limassol', 'afc-ajax',
    'agostini-s-cadenasso-g', 'airdrieonians', 'ajman', 'akritas-chlorakas', 'al-ahli-doha', 'al-ahli', 'al-ain',
    'al-arabi-sc', 'al-bahrain', 'al-bataeh', 'al-dhafra', 'al-duhail', 'al-ettifaq', 'al-fateh', 'al-fayha',
    'al-gharafa', 'al-hazem', 'al-hilal', 'al-ittihad-kalba', 'al-ittihad', 'al-jazira', 'al-khaldiya', 'al-khaleej',
    'al-kholood', 'al-najma-sc', 'al-najma', 'al-nasr-dubai', 'al-nassr', 'al-okhdood', 'al-qadsiah', 'al-rayyan',
    'al-riyadh', 'al-sadd', 'al-sailiya', 'al-shabab', 'al-shahaniya', 'al-shamal-sc', 'al-sharjah', 'al-taawoun',
    'al-wahda-fc', 'al-wakrah', 'al-wasl', 'albacete-balompie', 'albirex-niigata-singapore', 'alebrijes-de-oaxaca',
    'algeria', 'alhama-club-de-futbol', 'almere-city-fc', 'almeria', 'amed-sportif-faaliyetler', 'amrun-spartans-fc',
    'anadia', 'angola', 'anorthosis-famagusta', 'aparecida-fc', 'apoel-nicosia', 'apollon-limassol', 'ar-sao-martinho',
    'arbroath', 'arema-fc', 'arezzo', 'argentina', 'aris-limassol', 'arsenal', 'as-monaco', 'asante-kotoko-sc',
    'ascoli', 'ashdod-sc', 'aso-chlef', 'associacao-naval-1893', 'aston-villa', 'at-malveira', 'atalanta-u20',
    'atalanta-u23', 'atalanta', 'athletic-club', 'atlante-fc', 'atlas-fc', 'atletico-madrid', 'atletico-san-luis',
    'auckland-fc', 'audace-cerignola', 'australia-u23', 'australia', 'austria', 'ayr-united', 'ayutthaya-united',
    'az-alkmaar', 'az-picerno', 'bagnolini-d-colombo-a', 'bala-town', 'balestier-khalsa', 'bali-united-fc',
    'bandirmaspor', 'banik-ostrava', 'baniyas', 'barcelona', 'barnet', 'barrow-afc', 'barry-town', 'basake-holy-stars-fc',
    'basel', 'bayer-04-leverkusen', 'bechem-united', 'beitar-jerusalem', 'belgium', 'benevento', 'benfica-castelo-branco',
    'benfica-u23', 'benfica', 'benin', 'berekum-chelsea', 'besiktas-jk', 'bg-pathum-united', 'bhayangkara-presisi-lampung-fc',
    'bibiani-gold-stars-fc', 'birkirkara-fc', 'bk-hacken', 'bnei-sakhnin', 'bodoglimt', 'bodrum-fk', 'bologna-u20',
    'bologna', 'boluspor', 'borneo-fc-samarinda', 'borrelli-l-fermi-a', 'borussia-dortmund', 'borussia-mgladbach',
    'botswana', 'bournemouth', 'bra', 'brazil', 'breidablik-kopavogur', 'brentford', 'brighton-hove-albion',
    'brisbane-roar', 'bristol-rovers', 'brito-sc', 'briton-ferry-llansawel-afc', 'bromley', 'brunei-dpmm-fc',
    'budaiya', 'burgos-club-de-futbol', 'buriram-united', 'burkina-faso', 'burnley', 'cabo-verde', 'cadiz',
    'caernarfon-town', 'cagliari-u20', 'cagliari', 'cambridge-united', 'cameroon', 'campobasso-fc', 'canada',
    'canberra-united', 'cancun-fc', 'caniato-c-a-malgaroli-l', 'cardiff-met-fc', 'carpi', 'casarano', 'casertana',
    'catania', 'catini-n-perfetti-n', 'cavese', 'cd-castellon', 'cd-celoricense', 'cd-cinfaes', 'cd-fatima',
    'cd-gouveia', 'cd-guadalajara', 'cd-irapuato', 'cd-ribeira-brava', 'cd-tapatio', 'cd-toluca', 'cds-tampico-madero',
    'celta-vigo', 'celtic', 'central-coast-mariners', 'cesena-u20', 'cf-marialvas', 'cf-monterrey', 'cf-pachuca',
    'cf-uniao-de-lamas', 'cfr-1907-cluj', 'chaves-b', 'chaves', 'chelsea', 'cheltenham-town', 'chesterfield',
    'chiangrai-united', 'china-u23', 'chonburi-fc', 'club-america', 'club-atletico-de-madrid', 'club-atletico-la-paz',
    'club-atletico-morelia', 'club-brugge-kv', 'club-leon', 'club-necaxa', 'club-puebla', 'club-tijuana',
    'clube-nautico-capibaribe', 'clube-oriental-de-lisboa', 'coccioli-a-lorusso-l', 'colacioppo-g-martin-manzano-j-c',
    'colchester-united', 'colombia', 'colwyn-bay', 'comercio-e-industria', 'como', 'comoros', 'connahs-quay-nomads',
    'cordoba', 'correcaminos-uat', 'cortimiglia-d-o-byrne-s', 'corum-fk', 'cosenza', 'costa-adeje-tenerife',
    'cote-divoire', 'cr-belouizdad', 'crawley-town', 'cremonese-u20', 'cremonese', 'crewe-alexandra', 'croatia',
    'crotone', 'cruz-azul', 'crystal-palace', 'cs-constantine', 'cultural-leonesa', 'curacao', 'damac-fc',
    'damaiense', 'de-graafschap', 'decisao-goiana', 'deportivo-alaves', 'deportivo-la-coruna', 'desportivo-de-moncao',
    'dewa-united-fc', 'dibba-al-fujairah', 'differdange-fc-03', 'dinamo-minsk', 'dorados-de-sinaloa', 'dr-congo',
    'dreams', 'dukla-praha', 'dunfermline-athletic', 'dux-logrono', 'dynamo-kyiv', 'ecuador', 'egea-f-e-paz-j-p',
    'egypt', 'eibar', 'eintracht-frankfurt', 'elche', 'electrico-fc', 'eleven-wonders', 'england',
    'enosis-neon-paralimniou', 'enosis-neon-ypsona-fc', 'equatorial-guinea', 'erzurumspor-fk', 'es-ben-aknoun',
    'es-mostaganem', 'es-setif', 'esenler-erokspor', 'espanyol', 'estoril-praia-u23', 'estrela-amadora-u23',
    'ethnikos-achnas', 'everton', 'excelsior', 'famalicao-u23', 'fc-alpendorada', 'fc-alverca-b', 'fc-andorra',
    'fc-augsburg', 'fc-badalona', 'fc-bayern-munchen', 'fc-den-bosch', 'fc-dordrecht', 'fc-drita', 'fc-eindhoven',
    'fc-emmen', 'fc-groningen', 'fc-hradec-kralove', 'fc-iberia-1999', 'fc-juarez', 'fc-kobenhavn', 'fc-lugano',
    'fc-midtjylland', 'fc-milsami-orhei', 'fc-noah', 'fc-porto-b', 'fc-porto', 'fc-prishtina', 'fc-sellier-bellot-vlaim',
    'fc-serpa', 'fc-slovan-liberec', 'fc-spartak-trnava', 'fc-st-pauli', 'fc-tirsense', 'fc-tk-1914-amorin',
    'fc-twente', 'fc-utrecht', 'fc-vion-zlate-moravce', 'fc-volendam', 'fc-zlin', 'fci-levadia-tallinn', 'fcsb',
    'feirense', 'felgueiras', 'fenerbahce', 'ferencvaros-tc', 'feyenoord', 'fiorentina-u20', 'fiorentina',
    'fk-aktobe', 'fk-algiris', 'fk-budunost-podgorica', 'fk-crvena-zvezda', 'fk-partizan', 'fk-teplice',
    'fk-viktoria-ikov', 'fleetwood-town', 'flint-town-united', 'florgrade-fc', 'floriana-fc', 'foggia', 'forli',
    'fortuna-sittard', 'france', 'fredrikstad-fk', 'frosinone-u20', 'fulham', 'fumagalli-f-giacomini-l',
    'futbol-club-barcelona', 'gabon', 'galatasaray', 'gd-alcochetense', 'gd-lagoa', 'gd-peniche', 'gd-resende',
    'gd-samora-correia', 'gd-vitoria-sernache', 'genoa-u20', 'genoa', 'germany', 'getafe', 'geylang-international',
    'ghana', 'gil-vicente-u23', 'gillingham', 'giovannini-f-giovannini-u-m', 'gira-united-fc', 'girona-fc',
    'giugliano', 'gnk-dinamo-zagreb', 'go-ahead-eagles', 'granada-club-de-futbol', 'granada', 'greenock-morton',
    'grimsby-town', 'grupo-desportivo-de-braganca', 'gubbio', 'guidonia-montecelio-1937', 'haiti', 'hamburger-sv',
    'hapoel-beer-sheva', 'hapoel-haifa', 'hapoel-ironi-kiryat-shmona', 'hapoel-jerusalem', 'hapoel-petach-tikva',
    'hapoel-tel-aviv', 'harrogate-town', 'hatayspor', 'haverfordwest-county-afc', 'heart-of-lions', 'hellas-verona-u20',
    'hellas-verona', 'helmond-sport', 'heracles-almelo', 'hibernian', 'hibernians', 'hidd', 'hk-zrinjski-mostar',
    'hnk-rijeka', 'hohoe-united-fc', 'hougang-united', 'huesca', 'igdir-fk', 'ilves', 'immigration-fc',
    'inter-club-descaldes', 'inter-u20', 'inter', 'iran-u23', 'iran', 'iraq-u23', 'ironi-dorot-tiberias',
    'istanbulspor', 'japan-u23', 'japan', 'jd-lajense', 'johor-darul-tazim', 'jong-ajax', 'jong-az-alkmaar',
    'jong-fc-utrecht', 'jong-psv-eindhoven', 'jordan-u23', 'jordan', 'js-kabylie', 'js-saoura', 'juventude-sport-clube',
    'juventus-next-gen-u23', 'juventus-u20', 'juventus', 'k-slovan-bratislava', 'kairat-almaty', 'kanchanaburi-power-fc',
    'karela-united', 'keciorengucu', 'kelantan-the-real-warriors-fc', 'kf-egnatia', 'kf-shkendija', 'khor-fakkan',
    'krc-genk', 'kuala-lumpur-city-fc', 'kuching-city', 'kups', 'kyrgyzstan-u23', 'lamphun-warrior', 'las-palmas',
    'latina', 'lazio-u20', 'lazio', 'lebanon-u23', 'leca-fc', 'lecce-u20', 'lecce', 'lech-pozna', 'leeds-united',
    'leganes', 'legia-warszawa', 'leixoes-sc-u23', 'leixoes-sc', 'leones-negros', 'levante-ud', 'levski-sofia',
    'lgc-moncarapachense', 'lille', 'lincoln-red-imps', 'linfield-fc', 'lion-city-sailors', 'liverpool', 'llanelli-afc',
    'louletano-dc', 'ludogorets', 'lusitania-lourosa', 'macarthur-fc', 'maccabi-bney-reine', 'maccabi-haifa',
    'maccabi-netanya', 'maccabi-tel-aviv', 'madrid-cff', 'madura-united-fc', 'maguary', 'malaga', 'mali', 'malkiya',
    'mallorca', 'malmo-ff', 'malut-united-fc', 'manchester-city', 'manchester-united', 'manisa-fk', 'maritimo-u23',
    'maritimo', 'marsaxlokk-fc', 'mazatlan-fc', 'mb-rouissat', 'mc-alger', 'mc-el-bayadh', 'mc-oran', 'medeama-sc',
    'melaka-fc', 'melbourne-city', 'melbourne-victory', 'mexico', 'mfk-chrudim', 'mfk-skalica', 'milan-u20', 'milan',
    'milton-keynes-dons', 'mineros-de-zacatecas', 'mirandes', 'mlada-boleslav', 'monopoli', 'monza-u20', 'morocco',
    'mortagua', 'mosta-fc', 'mozambique', 'muang-thong-united', 'muharraq', 'mvv-maastricht', 'nac-breda',
    'nakhon-ratchasima-mazda-fc', 'napoli-u20', 'napoli', 'nations-fc', 'naxxar-lions-fc', 'nec-nijmegen',
    'negeri-sembilan', 'neom-sc', 'netherlands', 'new-zealand', 'newcastle-jets', 'newcastle-united', 'newport-county',
    'nice', 'nigeria', 'nk-celje', 'nk-olimpija-ljubljana', 'norway', 'nottingham-forest', 'notts-county',
    'o-elvas-cad', 'ofk-dynamo-malenice', 'oldham-athletic', 'oliveira-hospital', 'olympiacos-fc', 'olympiakos-nicosia',
    'olympique-akbou', 'olympique-de-marseille', 'olympique-lyonnais', 'omonia-aradippou', 'omonia-nicosia', 'osasuna',
    'pacos-de-ferreira', 'pafos-fc', 'paksi-fc', 'panama', 'panathinaikos', 'paok', 'paradou-ac', 'paraguay',
    'paris-saint-germain', 'parma-u20', 'parma', 'partick-thistle', 'pdrm-fc', 'pec-zwolle', 'penafiel', 'penang',
    'pendikspor', 'penybont', 'perego-g-potenza-l', 'persebaya-surabaya', 'persib-bandung', 'persija-jakarta',
    'persijap-jepara', 'persik-kediri', 'persis-solo', 'persita-tangerang', 'perth-glory', 'perugia', 'pianese',
    'pineto', 'pisa-l-villa-r', 'pisa', 'pontedera', 'port-fc', 'portimonense-sad', 'portimonense-sporting-clube',
    'portimonense-u23', 'portugal', 'potenza-calcio', 'psbs-biak', 'psim-yogyakarta', 'psm-makassar', 'psv-eindhoven',
    'pt-prachuap-fc', 'pumas-unam', 'qarabag-fk', 'qatar-sc', 'qatar-u23', 'qatar', 'queens-park-fc', 'queretaro-fc',
    'racing-power-football-club', 'raith-rovers', 'rangers', 'ratchaburi', 'ravenna', 'rayo-vallecano', 'rayong-fc',
    'rb-leipzig', 'rcd-espanyol-de-barcelona', 'real-betis', 'real-club-deportivo-de-la-coruna', 'real-madrid',
    'real-oviedo', 'real-racing-club', 'real-sociedad-b-u21', 'real-sociedad', 'real-valladolid', 'real-zaragoza',
    'rebordosa-ac', 'red-bull-salzburg', 'retro', 'rfs', 'riffa', 'rio-ave-fc', 'rio-ave-u23', 'rkc-waalwijk',
    'roda-jc-kerkrade', 'roma-u20', 'roma', 'ross-county', 'royale-union-saint-gilloise', 'rsc-anderlecht',
    'sabah-fc', 'sabah-fk', 'sakaryaspor', 'salernitana', 'salford-city', 'samartex', 'sambenedettese', 'samsunspor',
    'santa-clara-u23', 'santa-cruz', 'santos-laguna', 'sariyer', 'sassuolo-u20', 'sassuolo', 'saudi-arabia-u23',
    'saudi-arabia', 'sc-beira-mar', 'sc-braga-u23', 'sc-braga', 'sc-cambuur', 'sc-farense-u23', 'sc-farense',
    'sc-freiburg', 'sc-heerenveen', 'sc-lusitania', 'sc-mirandela', 'sc-telstar', 'sc-vianense', 'sc-vila-real',
    'scotland', 'scu-torreense', 'sd-eibar', 'selangor-football-club', 'semen-padang-fc', 'senegal', 'serikspor-as',
    'servette-fc', 'sevilla-fc', 'sevilla', 'shabab-al-ahli-dubai', 'shakhtar-donetsk', 'shelbourne', 'sheriff-tiraspol',
    'shrewsbury-town', 'siracusa-calcio', 'sitra', 'sivasspor', 'sk-brann', 'sk-hanacka-slavia-kromi', 'sk-sigma-olomouc',
    'sk-slavia-praha', 'sk-sturm-graz', 'sl-benfica-b-u21', 'sliema-wanderers', 'sorrento', 'south-africa',
    'south-korea-u23', 'south-korea', 'spadola-a-vavassori-m', 'spain', 'sparta-rotterdam', 'sport-comercio-e-salgueiros',
    'sport-recife', 'sporting-braga', 'sporting-cp-b-u21', 'sporting-cp', 'sporting-gijon', 'sporting-u23', 'ss-virtus',
    'st-johnstone', 'sudan', 'sukhothai', 'sunderland', 'su-sintrense', 'sv-werder-bremen', 'swedru-all-blacks-united-fc',
    'swindon-town', 'switzerland', 'sydney-fc', 'syria-u23', 'tampines-rovers', 'tanjong-pagar-united', 'tanzania',
    'tarxien-rainbows-fc', 'team-altamura', 'tepatitlan-fc', 'terengganu', 'ternana', 'thailand-u23', 'the-new-saints',
    'tigres-uanl', 'tlaxcala-fc', 'top-oss', 'torino-u20', 'torino', 'torreense-u23', 'torreense', 'torres',
    'tottenham-hotspur', 'tranmere-rovers', 'trapani', 'true-bangkok-united', 'tsg-hoffenheim', 'tunisia', 'udinese',
    'ud-leiria-u23', 'ud-oliveirense', 'uganda', 'umm-salal-sc', 'umraniyespor', 'uniao-de-leiria', 'uniao-desportiva-da-serra',
    'united-arab-emirates-u23', 'uruguay', 'us-livorno-1915', 'usa', 'usm-alger', 'usm-khenchela', 'uthai-thani-fc',
    'uzbekistan-u23', 'uzbekistan', 'valadares-gaia', 'valencia', 'valletta-fc', 'vanspor-fk', 'vasco-da-gama-vidigueira',
    'venados', 'vfb-stuttgart', 'vfl-wolfsburg', 'vietnam-u23', 'vikingur-gota', 'viktoria-plze', 'vilaverdense-fc',
    'villarreal', 'vis-pesaro', 'vision-fc', 'vitesse', 'vitoria-sc', 'vizela-u23', 'vizela', 'vvv-venlo', 'walsall',
    'wellington-phoenix', 'west-ham-united', 'western-sydney-wanderers', 'willem-ii-tilburg', 'wolfsberger-ac',
    'wolverhampton', 'young-apostles-fc', 'young-boys', 'young-lions', 'zabbar-saint-patrick-fc', 'zambia', 'zimbabwe'
];

export const getTeamLogo = (teamName) => {
    if (!teamName) {
        return '/logos/default-team-logo.png';
    }

    // ÖZEL DURUMLAR - Firebase'den gelen yaygın formatlar
    const specialCases = {
        'b.leverkusen': 'bayer-04-leverkusen',
        'b leverkusen': 'bayer-04-leverkusen',
        'cc mariners': 'central-coast-mariners',
        'cc-mariners': 'central-coast-mariners',
        'perth glory': 'perth-glory',
        'dundee utd': 'dundee-united',
        'dundee united': 'dundee-united',
        'ayr utd': 'ayr-united',
        'ayr united': 'ayr-united',
        'queens park': 'queens-park-fc',
        'st johnstone': 'st-johnstone',
        'st. johnstone': 'st-johnstone',
        'fc koln': '1-fc-koln',
        'fc köln': '1-fc-koln',
        '1. fc koln': '1-fc-koln',
        'sc freiburg': 'sc-freiburg',
        'vfb stuttgart': 'vfb-stuttgart',
        'hamburger sv': 'hamburger-sv',
        'hsv': 'hamburger-sv',
    };

    const lowerName = teamName.trim().toLowerCase();
    if (specialCases[lowerName]) {
        console.log(`✓✓✓ ÖZEL DURUM: "${teamName}" → "${specialCases[lowerName]}"`);
        return `/logos/${specialCases[lowerName]}.png`;
    }

    // ÖNCELİKLE: Tam dosya adı eşleşmesi (normalizasyon yapmadan)
    const exactMatch = teamName.trim().toLowerCase().replace(/\s+/g, '-').replace(/\./g, '');
    if (ALL_TEAM_LOGOS.includes(exactMatch)) {
        console.log(`✓✓ TAM EŞLEŞME: "${teamName}" → "${exactMatch}"`);
        return `/logos/${exactMatch}.png`;
    }

    // Normalizasyon yap
    const normalized = normalizeTeamName(teamName);

    // Tam eşleşme kontrolü (normalize edilmiş)
    if (ALL_TEAM_LOGOS.includes(normalized)) {
        console.log(`✓ Logo bulundu: "${teamName}" → "${normalized}"`);
        return `/logos/${normalized}.png`;
    }

    // Kısmi eşleşme - takım adı logo adının içinde geçiyor mu?
    for (const logo of ALL_TEAM_LOGOS) {
        if (normalized.includes(logo) && logo.length > 3) {
            console.log(`✓ Kısmi eşleşme: "${teamName}" → "${logo}"`);
            return `/logos/${logo}.png`;
        }
    }

    // Ters kontrol - logo adı takım adının içinde geçiyor mu?
    for (const logo of ALL_TEAM_LOGOS) {
        if (logo.includes(normalized) && normalized.length > 3) {
            console.log(`✓ Ters eşleşme: "${teamName}" → "${logo}"`);
            return `/logos/${logo}.png`;
        }
    }

    // Hiç eşleşme bulunamadı
    console.log(`✗ Logo bulunamadı: "${teamName}" (normalized: "${normalized}") - Default kullanılacak`);
    return '/logos/default-team-logo.png';
};

// Logo yüklenemezse default logo göster
export const handleLogoError = (e) => {
    const src = e.target.src;
    console.log('Logo BULUNAMADI, default kullanılıyor:', src);

    if (src.includes('default-team') || src.includes('data:image') || src.includes('placeholder')) {
        e.target.onerror = null;
        return;
    }

    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NSIgZmlsbD0iIzJlMzMzNSIgc3Ryb2tlPSIjRkRCOTEzIiBzdHJva2Utd2lkdGg9IjMiLz48cGF0aCBkPSJNNTAgMTBMNjUgMzBMODUgMzVMNzUgNTVMODAgNzVMNTAgODBMMjAgNzVMMjUgNTVMMTUgMzVMMzUgMzBaIiBmaWxsPSIjRkRCOTEzIiBvcGFjaXR5PSIwLjMiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIxNSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkRCOTEzIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=';
    e.target.onerror = null;
};

export const LEAGUE_LOGOS = {
    'Serie A': 'https://i.ibb.co/N6N4CGn5/Whats-App-mage-2025-12-05-at-14-21-54-1.jpg',
    'Premier Lig': 'https://i.ibb.co/cXt6fJdd/Whats-App-mage-2025-12-05-at-14-21-54.jpg',
    'La Liga': 'https://i.ibb.co/C55n1CFc/spain-la-liga-64x64-football-logos-cc.png',
    'Super Lig': 'https://i.ibb.co/RT40RH3G/turkey-super-lig-64x64-football-logos-cc.png',
    'Bundesliga': 'https://i.ibb.co/fzrPDNQp/germany-bundesliga-64x64-football-logos-cc.png',
    'Ligue 1': 'https://i.ibb.co/cXSXDS45/france-ligue-1-64x64-football-logos-cc.png'
};

export const calculatePercentage = (home, away) => {
    if (!home || !away) return 0;
    const total = parseFloat(home) + parseFloat(away);
    return Math.round((parseFloat(home) / total) * 100);
};

export const getLeagueLogo = (leagueName) => {
    return LEAGUE_LOGOS[leagueName] || 'https://i.ibb.co/RT40RH3G/turkey-super-lig-64x64-football-logos-cc.png';
};
