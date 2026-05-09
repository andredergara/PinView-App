export interface GolfCourse {
  name: string;
  location: string;
}

export const GOLF_COURSES_WORLDWIDE: GolfCourse[] = [
  // ── USA ──────────────────────────────────────────────────────────────────
  { name: "Augusta National Golf Club", location: "Augusta, GA, USA" },
  { name: "Pebble Beach Golf Links", location: "Pebble Beach, CA, USA" },
  { name: "TPC Sawgrass", location: "Ponte Vedra Beach, FL, USA" },
  { name: "Pine Valley Golf Club", location: "Pine Valley, NJ, USA" },
  { name: "Cypress Point Club", location: "Pebble Beach, CA, USA" },
  { name: "Shinnecock Hills Golf Club", location: "Southampton, NY, USA" },
  { name: "Oakmont Country Club", location: "Oakmont, PA, USA" },
  { name: "Merion Golf Club", location: "Ardmore, PA, USA" },
  { name: "Winged Foot Golf Club", location: "Mamaroneck, NY, USA" },
  { name: "Bethpage Black", location: "Farmingdale, NY, USA" },
  { name: "Torrey Pines Golf Course", location: "La Jolla, CA, USA" },
  { name: "Congressional Country Club", location: "Bethesda, MD, USA" },
  { name: "Cherry Hills Country Club", location: "Cherry Hills Village, CO, USA" },
  { name: "Riviera Country Club", location: "Pacific Palisades, CA, USA" },
  { name: "Medinah Country Club", location: "Medinah, IL, USA" },
  { name: "Valhalla Golf Club", location: "Louisville, KY, USA" },
  { name: "Firestone Country Club", location: "Akron, OH, USA" },
  { name: "TPC Scottsdale", location: "Scottsdale, AZ, USA" },
  { name: "Bay Hill Club & Lodge", location: "Orlando, FL, USA" },
  { name: "Harbour Town Golf Links", location: "Hilton Head, SC, USA" },
  { name: "Muirfield Village Golf Club", location: "Dublin, OH, USA" },
  { name: "Seminole Golf Club", location: "Juno Beach, FL, USA" },
  { name: "The Country Club", location: "Brookline, MA, USA" },
  { name: "Chicago Golf Club", location: "Wheaton, IL, USA" },
  { name: "Pinehurst No. 2", location: "Pinehurst, NC, USA" },
  { name: "Pinehurst No. 4", location: "Pinehurst, NC, USA" },
  { name: "Bandon Dunes Golf Resort", location: "Bandon, OR, USA" },
  { name: "Bandon Trails", location: "Bandon, OR, USA" },
  { name: "Pacific Dunes", location: "Bandon, OR, USA" },
  { name: "Whistling Straits", location: "Sheboygan, WI, USA" },
  { name: "Erin Hills", location: "Erin, WI, USA" },
  { name: "Chambers Bay", location: "University Place, WA, USA" },
  { name: "Kiawah Island Ocean Course", location: "Kiawah Island, SC, USA" },
  { name: "Southern Hills Country Club", location: "Tulsa, OK, USA" },
  { name: "Quail Hollow Club", location: "Charlotte, NC, USA" },
  { name: "Hazeltine National Golf Club", location: "Chaska, MN, USA" },
  { name: "Oakland Hills Country Club", location: "Bloomfield Hills, MI, USA" },
  { name: "East Lake Golf Club", location: "Atlanta, GA, USA" },
  { name: "TPC Twin Cities", location: "Blaine, MN, USA" },
  { name: "Shadow Creek Golf Course", location: "Las Vegas, NV, USA" },
  { name: "Spyglass Hill Golf Course", location: "Pebble Beach, CA, USA" },
  { name: "Pelican Hill Golf Club", location: "Newport Coast, CA, USA" },
  { name: "Kapalua Plantation Course", location: "Kapalua, HI, USA" },
  { name: "Waialae Country Club", location: "Honolulu, HI, USA" },
  { name: "Cog Hill Golf & Country Club", location: "Lemont, IL, USA" },
  { name: "Sedgefield Country Club", location: "Greensboro, NC, USA" },
  { name: "Wilmington Country Club", location: "Wilmington, DE, USA" },
  { name: "Inverness Club", location: "Toledo, OH, USA" },
  { name: "Baltusrol Golf Club", location: "Springfield, NJ, USA" },
  { name: "Plainfield Country Club", location: "Plainfield, NJ, USA" },
  { name: "Aronimink Golf Club", location: "Newtown Square, PA, USA" },
  { name: "Olympia Fields Country Club", location: "Olympia Fields, IL, USA" },
  { name: "Colonial Country Club", location: "Fort Worth, TX, USA" },
  { name: "TPC San Antonio", location: "San Antonio, TX, USA" },
  { name: "Caves Valley Golf Club", location: "Owings Mills, MD, USA" },
  { name: "The Club at Carlton Woods", location: "The Woodlands, TX, USA" },
  { name: "Sea Island Golf Club", location: "Sea Island, GA, USA" },
  { name: "Newport Country Club", location: "Newport, RI, USA" },
  { name: "Los Angeles Country Club", location: "Los Angeles, CA, USA" },

  // ── SCOTLAND ─────────────────────────────────────────────────────────────
  { name: "St Andrews Old Course", location: "St Andrews, Scotland" },
  { name: "St Andrews New Course", location: "St Andrews, Scotland" },
  { name: "Carnoustie Golf Links", location: "Carnoustie, Scotland" },
  { name: "Muirfield", location: "Gullane, Scotland" },
  { name: "Royal Troon Golf Club", location: "Troon, Scotland" },
  { name: "Turnberry Ailsa Course", location: "Turnberry, Scotland" },
  { name: "Royal Dornoch Golf Club", location: "Dornoch, Scotland" },
  { name: "Gleneagles Kings Course", location: "Auchterarder, Scotland" },
  { name: "Gleneagles Queens Course", location: "Auchterarder, Scotland" },
  { name: "Gleneagles PGA Centenary Course", location: "Auchterarder, Scotland" },
  { name: "Cruden Bay Golf Club", location: "Cruden Bay, Scotland" },
  { name: "Kingsbarns Golf Links", location: "St Andrews, Scotland" },
  { name: "Castle Stuart Golf Links", location: "Inverness, Scotland" },
  { name: "Machrihanish Golf Club", location: "Machrihanish, Scotland" },
  { name: "Prestwick Golf Club", location: "Prestwick, Scotland" },
  { name: "North Berwick Golf Club", location: "North Berwick, Scotland" },
  { name: "Loch Lomond Golf Club", location: "Luss, Scotland" },
  { name: "Trump International Golf Links Scotland", location: "Aberdeenshire, Scotland" },
  { name: "Cabot Highlands", location: "Inverness, Scotland" },
  { name: "Dumbarnie Links", location: "Leven, Scotland" },
  { name: "Royal Aberdeen Golf Club", location: "Aberdeen, Scotland" },

  // ── ENGLAND ──────────────────────────────────────────────────────────────
  { name: "Royal Birkdale Golf Club", location: "Southport, England" },
  { name: "Royal Liverpool Golf Club", location: "Hoylake, England" },
  { name: "Royal St George's Golf Club", location: "Sandwich, England" },
  { name: "Royal Lytham & St Annes Golf Club", location: "Lytham St Annes, England" },
  { name: "Wentworth Club", location: "Virginia Water, England" },
  { name: "The Belfry", location: "Sutton Coldfield, England" },
  { name: "Sunningdale Golf Club", location: "Sunningdale, England" },
  { name: "Walton Heath Golf Club", location: "Tadworth, England" },
  { name: "Royal Porthcawl Golf Club", location: "Porthcawl, Wales" },
  { name: "Royal St David's Golf Club", location: "Harlech, Wales" },
  { name: "Swinley Forest Golf Club", location: "Ascot, England" },
  { name: "Worplesdon Golf Club", location: "Worplesdon, England" },
  { name: "St George's Hill Golf Club", location: "Weybridge, England" },
  { name: "Woodhall Spa Golf Club", location: "Woodhall Spa, England" },
  { name: "Ganton Golf Club", location: "Scarborough, England" },
  { name: "Prince's Golf Club", location: "Sandwich Bay, England" },
  { name: "Rye Golf Club", location: "Rye, England" },

  // ── IRELAND ──────────────────────────────────────────────────────────────
  { name: "Royal Portrush Golf Club", location: "Portrush, Northern Ireland" },
  { name: "Royal County Down Golf Club", location: "Newcastle, Northern Ireland" },
  { name: "Ballybunion Golf Club", location: "Ballybunion, Ireland" },
  { name: "Portmarnock Golf Club", location: "Portmarnock, Ireland" },
  { name: "Lahinch Golf Club", location: "Lahinch, Ireland" },
  { name: "Waterville Golf Links", location: "Waterville, Ireland" },
  { name: "The European Club", location: "Brittas Bay, Ireland" },
  { name: "Old Head Golf Links", location: "Kinsale, Ireland" },
  { name: "Druids Glen Golf Club", location: "Newtownmountkennedy, Ireland" },
  { name: "K Club", location: "Straffan, Ireland" },
  { name: "Mount Juliet Golf Club", location: "Thomastown, Ireland" },
  { name: "Adare Manor Golf Club", location: "Adare, Ireland" },
  { name: "Carne Golf Links", location: "Belmullet, Ireland" },
  { name: "Enniscrone Golf Club", location: "Enniscrone, Ireland" },
  { name: "Tralee Golf Club", location: "Tralee, Ireland" },
  { name: "Dooks Golf Club", location: "Glenbeigh, Ireland" },
  { name: "County Sligo Golf Club", location: "Rosses Point, Ireland" },

  // ── AUSTRALIA ────────────────────────────────────────────────────────────
  { name: "Royal Melbourne Golf Club", location: "Melbourne, Australia" },
  { name: "Kingston Heath Golf Club", location: "Melbourne, Australia" },
  { name: "Royal Adelaide Golf Club", location: "Adelaide, Australia" },
  { name: "Metropolitan Golf Club", location: "Melbourne, Australia" },
  { name: "New South Wales Golf Club", location: "Sydney, Australia" },
  { name: "Barnbougle Dunes", location: "Tasmania, Australia" },
  { name: "Barnbougle Lost Farm", location: "Tasmania, Australia" },
  { name: "Cape Wickham Links", location: "King Island, Australia" },
  { name: "Royal Queensland Golf Club", location: "Brisbane, Australia" },
  { name: "Ellerston Golf Course", location: "Scone, Australia" },
  { name: "Commonwealth Golf Club", location: "Melbourne, Australia" },
  { name: "The Dunes Golf Links", location: "Mornington Peninsula, Australia" },
  { name: "Thirteenth Beach Golf Links", location: "Barwon Heads, Australia" },

  // ── NEW ZEALAND ──────────────────────────────────────────────────────────
  { name: "Cape Kidnappers Golf Course", location: "Hawke's Bay, New Zealand" },
  { name: "Kauri Cliffs Golf Course", location: "Northland, New Zealand" },
  { name: "Tara Iti Golf Club", location: "Mangawhai, New Zealand" },
  { name: "The Hills Golf Club", location: "Queenstown, New Zealand" },
  { name: "Millbrook Resort", location: "Queenstown, New Zealand" },

  // ── JAPAN ────────────────────────────────────────────────────────────────
  { name: "Hirono Golf Club", location: "Hyogo, Japan" },
  { name: "Tokyo Golf Club", location: "Tokyo, Japan" },
  { name: "Kawana Golf Resort Fuji Course", location: "Shizuoka, Japan" },
  { name: "Kasumigaseki Country Club", location: "Saitama, Japan" },
  { name: "Naruo Golf Club", location: "Hyogo, Japan" },
  { name: "Sobu Country Club", location: "Chiba, Japan" },
  { name: "Taiheiyo Club Gotemba Course", location: "Shizuoka, Japan" },
  { name: "Ibaraki Golf Club", location: "Ibaraki, Japan" },

  // ── SOUTH KOREA ──────────────────────────────────────────────────────────
  { name: "Nine Bridges Golf Club", location: "Jeju, South Korea" },
  { name: "Woo Jeong Hills Country Club", location: "Chungnam, South Korea" },
  { name: "Jack Nicklaus Golf Club Korea", location: "Incheon, South Korea" },
  { name: "Sky72 Golf Club", location: "Incheon, South Korea" },

  // ── CHINA ────────────────────────────────────────────────────────────────
  { name: "Mission Hills Golf Club", location: "Shenzhen, China" },
  { name: "Clearwater Bay Golf & Country Club", location: "Hong Kong" },
  { name: "Sheshan International Golf Club", location: "Shanghai, China" },
  { name: "Genzon Golf Club", location: "Shenzhen, China" },

  // ── SINGAPORE / SOUTHEAST ASIA ───────────────────────────────────────────
  { name: "Sentosa Golf Club", location: "Singapore" },
  { name: "Laguna National Golf Resort Club", location: "Singapore" },
  { name: "Thai Country Club", location: "Bangkok, Thailand" },
  { name: "Blue Canyon Country Club", location: "Phuket, Thailand" },
  { name: "Bali National Golf Club", location: "Bali, Indonesia" },
  { name: "Vietnam Golf & Country Club", location: "Ho Chi Minh City, Vietnam" },

  // ── MIDDLE EAST ──────────────────────────────────────────────────────────
  { name: "Emirates Golf Club", location: "Dubai, UAE" },
  { name: "Jumeirah Golf Estates", location: "Dubai, UAE" },
  { name: "Abu Dhabi Golf Club", location: "Abu Dhabi, UAE" },
  { name: "Yas Links Abu Dhabi", location: "Abu Dhabi, UAE" },
  { name: "Saadiyat Beach Golf Club", location: "Abu Dhabi, UAE" },
  { name: "Ayla Golf Club", location: "Aqaba, Jordan" },

  // ── AFRICA / INDIAN OCEAN ────────────────────────────────────────────────
  { name: "Fancourt Golf Estate", location: "George, South Africa" },
  { name: "Gary Player Country Club", location: "Sun City, South Africa" },
  { name: "Leopard Creek Country Club", location: "Mpumalanga, South Africa" },
  { name: "Royal Cape Golf Club", location: "Cape Town, South Africa" },
  { name: "Sharm El Sheikh Golf Club", location: "Sharm El Sheikh, Egypt" },
  { name: "Constance Lemuria Golf Course", location: "Praslin, Seychelles" },

  // ── SPAIN ────────────────────────────────────────────────────────────────
  { name: "Real Club Valderrama", location: "Sotogrande, Spain" },
  { name: "Real Golf de Pedreña", location: "Pedreña, Spain" },
  { name: "Club de Golf El Prat", location: "Barcelona, Spain" },
  { name: "Real Club de Golf Sotogrande", location: "Sotogrande, Spain" },
  { name: "PGA Catalunya Resort", location: "Girona, Spain" },
  { name: "Las Brisas Golf Club", location: "Marbella, Spain" },

  // ── PORTUGAL ─────────────────────────────────────────────────────────────
  { name: "Royal Óbidos Spa & Golf Resort", location: "Óbidos, Portugal" },
  { name: "Penha Longa Resort", location: "Sintra, Portugal" },
  { name: "Monte Rei Golf & Country Club", location: "Algarve, Portugal" },
  { name: "Quinta do Lago", location: "Algarve, Portugal" },
  { name: "Vale do Lobo", location: "Algarve, Portugal" },
  { name: "Vilamoura Victoria Golf Course", location: "Algarve, Portugal" },

  // ── FRANCE ───────────────────────────────────────────────────────────────
  { name: "Golf de Morfontaine", location: "Morfontaine, France" },
  { name: "Golf National", location: "Saint-Quentin-en-Yvelines, France" },
  { name: "Golf de Chantilly", location: "Chantilly, France" },
  { name: "Les Bordes Golf International", location: "Loir-et-Cher, France" },
  { name: "Golf de Sperone", location: "Bonifacio, Corsica, France" },

  // ── GERMANY / AUSTRIA / SWITZERLAND ──────────────────────────────────────
  { name: "Gut Lärchenhof Golf Club", location: "Pulheim, Germany" },
  { name: "Golf Club Eichenried", location: "Munich, Germany" },
  { name: "Crans-sur-Sierre Golf Club", location: "Crans-Montana, Switzerland" },
  { name: "Golf Club Bad Ragaz", location: "Bad Ragaz, Switzerland" },
  { name: "Diamond Country Club", location: "Atzenbrugg, Austria" },

  // ── ITALY ────────────────────────────────────────────────────────────────
  { name: "Is Molas Golf Club", location: "Sardinia, Italy" },
  { name: "Golf Club Castelfalfi", location: "Tuscany, Italy" },
  { name: "Marco Simone Golf & Country Club", location: "Rome, Italy" },
  { name: "Golf Club Biella Le Betulle", location: "Biella, Italy" },

  // ── NETHERLANDS / BELGIUM / SCANDINAVIA ──────────────────────────────────
  { name: "The Dutch Golf Club", location: "Spijk, Netherlands" },
  { name: "Kennemer Golf & Country Club", location: "Zandvoort, Netherlands" },
  { name: "Royal Waterloo Golf Club", location: "Lasne, Belgium" },
  { name: "Barsebäck Golf & Country Club", location: "Skåne, Sweden" },
  { name: "Halmstad Golf Club", location: "Halmstad, Sweden" },
  { name: "Loch Lomond Golf Club", location: "Luss, Scotland" },

  // ── CANADA ───────────────────────────────────────────────────────────────
  { name: "Cabot Links", location: "Inverness, Nova Scotia, Canada" },
  { name: "Cabot Cliffs", location: "Inverness, Nova Scotia, Canada" },
  { name: "Hamilton Golf & Country Club", location: "Ancaster, Ontario, Canada" },
  { name: "Royal Montreal Golf Club", location: "Montreal, Quebec, Canada" },
  { name: "Jasper Park Lodge Golf Course", location: "Jasper, Alberta, Canada" },
  { name: "Capilano Golf & Country Club", location: "West Vancouver, Canada" },

  // ── MEXICO / CARIBBEAN ───────────────────────────────────────────────────
  { name: "Cabo del Sol Golf Club", location: "Los Cabos, Mexico" },
  { name: "Diamante Golf Club", location: "Los Cabos, Mexico" },
  { name: "El Camaleon Golf Club", location: "Riviera Maya, Mexico" },
  { name: "Casa de Campo Links Course", location: "La Romana, Dominican Republic" },
  { name: "Mid Ocean Club", location: "Bermuda" },

  // ── ARGENTINA / BRAZIL ───────────────────────────────────────────────────
  { name: "Jockey Club Argentino", location: "Buenos Aires, Argentina" },
  { name: "Club de Golf Los Lagartos", location: "Bogotá, Colombia" },
  { name: "São Paulo Golf Club", location: "São Paulo, Brazil" },
];

/**
 * Fuzzy search courses by name — returns up to `limit` matches,
 * sorted by how early in the name the query appears.
 */
export function searchCourses(query: string, limit = 8): GolfCourse[] {
  if (query.length < 2) return [];
  const q = query.toLowerCase();
  const matches: Array<{ course: GolfCourse; score: number }> = [];

  for (const course of GOLF_COURSES_WORLDWIDE) {
    const name = course.name.toLowerCase();
    const location = course.location.toLowerCase();
    const idx = name.indexOf(q);
    if (idx !== -1) {
      // Earlier match = lower score = higher priority
      matches.push({ course, score: idx });
    } else if (location.includes(q)) {
      matches.push({ course, score: 1000 });
    } else {
      // Check if all words in query appear in name (word-level fuzzy)
      const words = q.split(/\s+/).filter(Boolean);
      if (words.length > 1 && words.every(w => name.includes(w))) {
        matches.push({ course, score: 500 });
      }
    }
  }

  return matches
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map(m => m.course);
}
