// Starter catalogue. Brand stories come from the LYNQ brand portfolio deck;
// models are the current ranges listed on each brand's official website
// (October 2026). Only public product information is used: no prices and no
// commercial terms. Prices show as "on request" and specifications are left
// for the team to complete in the admin.
//
// Illustration colours are approximations of each dial, used until product
// photography is uploaded.

import { transaction } from './db.js';

// Watch tuple: [model name, collection, curation, case shape, dial layout, dial colour, case metal, strap colour, featured?, availability?]
const BRANDS = [
  {
    slug: 'arsene-lippens', name: 'Arsène Lippens', country: 'Switzerland', city: 'Geneva', website: 'https://www.arsenelippens.com/',
    tagline: 'Swiss-made watches inspired by heritage, friendship and automotive design.',
    story: 'An independent Swiss watch brand crafted in Geneva, Arsène Lippens pairs vintage-inspired design with a distinctly contemporary eye. The name honours the grandfather of founder Dries Lippens.\n\nPersonalisation and storytelling sit at the heart of the brand, from its woven textile dials to its skeletonised chronographs.',
    highlights: 'Independent Swiss watch brand\nCrafted in Geneva\nVintage-inspired designs with a contemporary aesthetic\nPersonalisation and storytelling at the heart of the brand',
    notes: {
      Visionario: 'A chronograph powered by a La Joux-Perret L113 movement with a custom rotor.',
      Scheletrato: 'A skeleton chronograph with a Swiss Valjoux 7750 automatic movement and 48-hour power reserve, in a 39.5 mm case. “Opaco” means matte.',
      Artigiano: 'A Swiss Made woven textile dial, named after an Italian place.',
    },
    watches: [
      ['Visionario Neve', 'Visionario', 'the-complicated', 'round', 'chrono', '#f2f1ec', 'steel', '#8f8f8f', 1],
      ['Visionario Pietre Nere', 'Visionario', 'the-complicated', 'round', 'chrono', '#26272a', 'steel', '#3a3a3a'],
      ['Visionario Salmone', 'Visionario', 'the-complicated', 'round', 'chrono', '#e4a88e', 'steel', '#4a3326'],
      ['Visionario Terracotta', 'Visionario', 'the-complicated', 'round', 'chrono', '#b6603e', 'steel', '#3f2a20'],
      ['Visionario Blu Cielo', 'Visionario', 'the-complicated', 'round', 'chrono', '#8fb6d6', 'steel', '#2f3f55'],
      ['Scheletrato Blu Opaco', 'Scheletrato', 'the-complicated', 'round', 'skeleton', '#2a3a5a', 'steel', '#1f2a40'],
      ['Scheletrato Grigio Opaco', 'Scheletrato', 'the-complicated', 'round', 'skeleton', '#4b4e54', 'steel', '#55585c'],
      ['Artigiano Chianti', 'Artigiano', 'the-artisans', 'round', 'three-hand', '#7a4a32', 'steel', '#5a3a28'],
      ['Artigiano Portofino', 'Artigiano', 'the-artisans', 'round', 'three-hand', '#3fb0b0', 'steel', '#8f8f8f'],
      ['Artigiano Como', 'Artigiano', 'the-artisans', 'round', 'three-hand', '#3f6a8a', 'steel', '#8f8f8f'],
    ],
  },
  {
    slug: 'furlan-marri', name: 'Furlan Marri', country: 'Switzerland', city: 'Geneva', website: 'https://www.furlanmarri.com/',
    tagline: 'Independent Geneva watchmaking built around design, heritage and storytelling.',
    story: 'Based in Geneva, Furlan Marri combines vintage watchmaking influences with contemporary design.\n\nThe brand has built a devoted following through its focus on craftsmanship, storytelling and community.',
    highlights: 'Independent watchmaker based in Geneva\nVintage influences, contemporary design\nStrong focus on craftsmanship, storytelling and community',
    notes: {
      Mechaquartz: 'A vintage-inspired chronograph with a mecha-quartz movement, the collection that introduced Furlan Marri.',
      'Cornes de Vache': 'A Swiss automatic with a sector dial and “cornes de vache” (cow-horn) lugs.',
      'Disco Volante': 'From the Disco Volante collection, named for its “flying saucer” case.',
      'Hunter & Outback': 'From the Hunter and Outback collection.',
    },
    watches: [
      ['Sabbia Rosa', 'Mechaquartz', 'the-complicated', 'round', 'chrono', '#ead0b8', 'rose', '#4a3326', 1],
      ['Ardesia Blu', 'Mechaquartz', 'the-complicated', 'round', 'chrono', '#3d4f6a', 'steel', '#2a2f3a'],
      ['Nero Sabbia', 'Mechaquartz', 'the-complicated', 'round', 'chrono', '#1d1d1f', 'steel', '#3a3226'],
      ['Castagna', 'Mechaquartz', 'the-complicated', 'round', 'chrono', '#6b4a35', 'steel', '#3f2a20'],
      ['Rosso Grigio', 'Mechaquartz', 'the-complicated', 'round', 'chrono', '#7a7d82', 'steel', '#5a2a2a'],
      ['Blue Sector', 'Cornes de Vache', 'the-independents', 'round', 'small-seconds', '#2f4f7a', 'steel', '#3d4733'],
      ['Salmon Sector', 'Cornes de Vache', 'the-independents', 'round', 'small-seconds', '#e0a58e', 'steel', '#4a3326'],
      ['White Sector', 'Cornes de Vache', 'the-independents', 'round', 'small-seconds', '#f1efe9', 'steel', '#2a2a2a'],
      ['Disco Onyx Diamonds', 'Disco Volante', 'the-architects', 'round', 'small-seconds', '#141416', 'steel', '#9ea2a7'],
      ['Outback Elegy', 'Hunter & Outback', 'the-independents', 'round', 'three-hand', '#b8a27a', 'steel', '#5a4630'],
    ],
  },
  {
    slug: 'beaubleu', name: 'Beaubleu', country: 'France', city: 'Paris', website: 'https://beaubleu-paris.com/en/',
    tagline: 'Parisian watchmaking with a distinctive, artistic design language.',
    story: 'Designed and assembled in Paris, Beaubleu is instantly recognisable by its signature round hands, a visual identity unlike anything else in watchmaking.\n\nEvery watch is automatic, with permanent numbered models alongside limited editions.',
    highlights: 'French independent watch brand\nDesigned and assembled in Paris\nSignature round hands\nAutomatic movements with open casebacks',
    notes: {
      Ecce: 'From Ecce, the Maison’s first permanent collection, unveiled in 2023.',
      'Ecce Figura': 'Beaubleu’s first shaped watch: a semi-octagonal case with a concave bezel and sapphire crystal, powered by a Miyota 9015 automatic movement.',
      'Seconde Française': 'A limited edition from the Seconde Française collection.',
      Vitruve: 'One of three Vitruve limited editions, “for three temporalities, three moments”.',
      'La Pièce': 'A limited edition from the La Pièce series.',
    },
    watches: [
      ['Ecce Lys', 'Ecce', 'the-architects', 'round', 'three-hand', '#f1eee8', 'steel', '#b9a592', 1],
      ['Ecce Vesperal', 'Ecce', 'the-architects', 'round', 'three-hand', '#3a3550', 'steel', '#2a2a30'],
      ['Ecce Smalt', 'Ecce', 'the-architects', 'round', 'three-hand', '#2c4a8f', 'steel', '#1f2a45'],
      ['Ecce Figura Lys', 'Ecce Figura', 'the-architects', 'rect', 'three-hand', '#f1eee8', 'steel', '#bba78f'],
      ['Ecce Figura Alba', 'Ecce Figura', 'the-architects', 'rect', 'three-hand', '#f6f3ea', 'gold', '#bba78f'],
      ['Ecce Figura Onyx', 'Ecce Figura', 'the-architects', 'rect', 'three-hand', '#151517', 'steel', '#1e1e20'],
      ['Ecce Figura Smalt', 'Ecce Figura', 'the-architects', 'rect', 'three-hand', '#2c4a8f', 'steel', '#1f2a45'],
      ['Ecce Figura Vesperal', 'Ecce Figura', 'the-architects', 'rect', 'three-hand', '#3a3550', 'gold', '#2a2a30'],
      ['Ecce Figura Sienna', 'Ecce Figura', 'the-architects', 'rect', 'three-hand', '#a0522d', 'gold', '#4a3326'],
      ['Seconde Française 19.24 Imperial Green', 'Seconde Française', 'the-rare', 'round', 'small-seconds', '#1f4a35', 'steel', '#1e1e20'],
      ['Seconde Française 20.24', 'Seconde Française', 'the-rare', 'round', 'small-seconds', '#24262c', 'steel', '#1e1e20'],
      ['Vitruve Origine Blue', 'Vitruve', 'the-rare', 'round', 'three-hand', '#233a6a', 'steel', '#1f2a45'],
      ['Vitruve Origine Cognac', 'Vitruve', 'the-rare', 'round', 'three-hand', '#8a5a2b', 'steel', '#4a3326'],
      ['Vitruve Date Black', 'Vitruve', 'the-rare', 'round', 'three-hand', '#1a1a1c', 'steel', '#1e1e20'],
      ['Vitruve GMT Blue', 'Vitruve', 'the-rare', 'round', 'three-hand', '#233a6a', 'steel', '#1f2a45'],
      ['La Pièce n°2 Silver', 'La Pièce', 'the-rare', 'round', 'three-hand', '#d9d9d6', 'steel', '#b4a08a'],
    ],
  },
  {
    slug: 'dennison', name: 'Dennison', country: 'Switzerland', city: '', website: 'https://dennisonwatch.com/',
    tagline: '175 years of watchmaking heritage, reimagined for today.',
    story: 'Dennison’s heritage reaches back 175 years to Aaron Lufkin Dennison, regarded as the father of American watchmaking. The name went on to become a renowned British-American case maker for Rolex, Omega, IWC, Jaeger-LeCoultre and Zenith.\n\nToday that heritage is reinterpreted through contemporary design by renowned watch designer Emmanuel Gueit.',
    highlights: 'Heritage dating back 175 years to Aaron Lufkin Dennison\nHistoric case maker for the great Swiss houses\nContemporary design by Emmanuel Gueit',
    notes: {
      'ALD Time Only': 'From the A.L.D. collection designed by Emmanuel Gueit, with a 1960s-inspired cushion case.',
      'ALD Mini': 'The smaller A.L.D. Mini, with the collection’s 1960s-inspired cushion case.',
      'ALD Dual Time': 'An A.L.D. Dual Time, showing two time zones.',
    },
    watches: [
      ['ALD Black Marble (Gold)', 'ALD Time Only', 'the-icons', 'cushion', 'three-hand', '#2a2a2c', 'gold', '#1d1d1f', 1],
      ['ALD Black Marble (Steel)', 'ALD Time Only', 'the-icons', 'cushion', 'three-hand', '#2a2a2c', 'steel', '#1d1d1f'],
      ['ALD White MOP “Ghost” (Gold)', 'ALD Time Only', 'the-icons', 'cushion', 'three-hand', '#eeeae4', 'gold', '#c9a356'],
      ['ALD White MOP “Ghost” (Steel)', 'ALD Time Only', 'the-icons', 'cushion', 'three-hand', '#eeeae4', 'steel', '#9ba0a5'],
      ['ALD Aventurine & Black Sunray (Gold)', 'ALD Time Only', 'the-icons', 'cushion', 'three-hand', '#1f2a5a', 'gold', '#1d1d1f'],
      ['ALD Midnight Aventurine (Gold)', 'ALD Time Only', 'the-icons', 'cushion', 'three-hand', '#19224a', 'gold', '#1d1d1f'],
      ['ALD Midnight Aventurine (Steel)', 'ALD Time Only', 'the-icons', 'cushion', 'three-hand', '#19224a', 'steel', '#9ba0a5'],
      ['ALD Mini Black Onyx (Steel)', 'ALD Mini', 'the-icons', 'cushion', 'three-hand', '#111113', 'steel', '#9ba0a5'],
      ['ALD Mini Aventurine Diamonds', 'ALD Mini', 'the-icons', 'cushion', 'three-hand', '#1f2a5a', 'gold', '#c9a356'],
      ['ALD Dual Time “Carnaby Blue”', 'ALD Dual Time', 'the-icons', 'cushion', 'three-hand', '#2f5fae', 'steel', '#9ba0a5'],
    ],
  },
  {
    slug: 'awake', name: 'Awake', country: 'France', city: '', website: 'https://awakewatches.com/',
    tagline: 'French watchmaking bringing rare artisanal crafts into contemporary watch design.',
    story: 'Awake is a French independent devoted to the Métiers d’Art and the preservation of traditional craftsmanship.\n\nIts Sơn Mài dials are handcrafted in Vietnam using traditional lacquer techniques, with around 15 hours of artisan work in each one.',
    highlights: 'French independent watch brand\nFocused on Métiers d’Art\nHandcrafted, highly artisanal dials\nCultural heritage and artistic expression',
    notes: {
      'Frosted Leaf': 'A Sơn Mài lacquer dial handcrafted in Vietnam, over silver leaf. La Joux-Perret G101 automatic movement with 68-hour power reserve.',
      'Guilloché Main': 'Pairs Sơn Mài lacquer with hand guilloché. La Joux-Perret G101 automatic movement with 68-hour power reserve.',
      'Silver Leaf': 'A Sơn Mài lacquer dial over silver leaf, handcrafted in Vietnam. Limited edition of 100 pieces.',
      Fragments: 'A Sơn Mài lacquer dial handcrafted in Vietnam. Limited to 100 pieces per colour.',
    },
    watches: [
      ['Son Mài – Frosted Leaf « Royal Blue »', 'Frosted Leaf', 'the-artisans', 'round', 'three-hand', '#1f3a7a', 'steel', '#6c6f73', 1],
      ['Son Mài – Frosted Leaf « Blood Moon »', 'Frosted Leaf', 'the-artisans', 'round', 'three-hand', '#7a1f22', 'steel', '#2b2c2e'],
      ['Son Mài – Frosted Leaf « Lagoon »', 'Frosted Leaf', 'the-artisans', 'round', 'three-hand', '#1f7a7a', 'steel', '#2a8ba3'],
      ['Son Mài – Frosted Leaf « Storm »', 'Frosted Leaf', 'the-artisans', 'round', 'three-hand', '#4a5560', 'steel', '#6c6f73'],
      ['Son Mài – Frosted Leaf « Ultraviolet »', 'Frosted Leaf', 'the-artisans', 'round', 'three-hand', '#4a2f7a', 'steel', '#2b2c2e'],
      ['Son Mài – Guilloché Main « Alba »', 'Guilloché Main', 'the-artisans', 'round', 'three-hand', '#e8e0c8', 'steel', '#8f7f6a'],
      ['Son Mài – Guilloché Main « Borealis »', 'Guilloché Main', 'the-artisans', 'round', 'three-hand', '#2f8a5a', 'steel', '#2f9a3c'],
      ['Son Mài – Guilloché Main « Sunset »', 'Guilloché Main', 'the-artisans', 'round', 'three-hand', '#d9822b', 'steel', '#5a3a28'],
      ['Son Mài – Silver Leaf « Ultra Violet »', 'Silver Leaf', 'the-artisans', 'round', 'three-hand', '#5a3f8a', 'steel', '#2b2c2e'],
      ['Son Mài – Silver Leaf « Golden Hour »', 'Silver Leaf', 'the-artisans', 'round', 'three-hand', '#c99a3b', 'steel', '#5a3a28', 0, 'sold'],
      ['Son Mài – Fragments', 'Fragments', 'the-artisans', 'round', 'three-hand', '#1f6a4a', 'steel', '#2b2c2e'],
    ],
  },
  {
    slug: 'atelier-wen', name: 'Atelier Wen', country: 'China', city: '', founded: '2018', website: 'https://us.atelierwen.com/',
    tagline: 'Chinese culture and craftsmanship, reimagined through modern watchmaking.',
    story: 'Founded in 2018 by two French founders with deep ties to Chinese culture, Atelier Wen sets out to elevate Chinese watchmaking and craftsmanship on the global stage.\n\nIts watches combine traditional Chinese crafts, materials and cultural references with contemporary design.',
    highlights: 'Independent, founded in 2018\nElevating Chinese watchmaking globally\nTraditional crafts meet contemporary design',
    notes: {
      Perception: 'A steel sports watch with a handmade guilloché dial and a French automatic calibre, in a 904L steel case.',
      Millésime: 'Atelier Wen’s yearly limited edition. The 2025 edition is a Perception with a natural pietersite dial.',
      Inflection: 'Described by Atelier Wen as the world’s first non-limited full tantalum watch.',
      Ancestra: 'From the Ancestra collection.',
    },
    watches: [
      ['Perception', 'Perception', 'the-artisans', 'round', 'three-hand', '#2e7a68', 'steel', '#a5aaaf', 1],
      ['Millésime 2025 – Perception 漩 (Xuán)', 'Millésime', 'the-rare', 'round', 'three-hand', '#3a4f6a', 'steel', '#a5aaaf'],
      ['Inflection', 'Inflection', 'the-independents', 'round', 'three-hand', '#212224', 'steel', '#7d8186'],
      ['Inflection Shuò', 'Inflection', 'the-independents', 'round', 'three-hand', '#2a2b2e', 'steel', '#7d8186'],
      ['Ancestra', 'Ancestra', 'the-independents', 'round', 'three-hand', '#e8e2d6', 'steel', '#5a4630'],
    ],
  },
  {
    slug: 'amida', name: 'Amida', country: 'Switzerland', city: '', founded: '1925', website: 'https://www.amida-watches.com/',
    tagline: 'Swiss watchmaking heritage revived through radical, retro-futuristic design.',
    story: 'Founded in Switzerland in 1925, Amida is best known for the Digitrend, a pioneering mechanical “driver’s watch” launched in 1976.\n\nRelaunched in 2024, the brand revives its iconic name and patents, including its Light Reflecting Display, which uses a sapphire prism to project the time vertically.',
    highlights: 'Swiss watch brand founded in 1925\nRelaunched in 2024\nHome of the 1976 Digitrend driver’s watch\nLight Reflecting Display with a sapphire prism',
    notes: {
      Digitrend: 'The jumping hours are read through a prism-shaped sapphire crystal. Soprod Newton P092 automatic with an in-house jumping-hour module; 39.6 × 39 mm case, 50 m water resistance.',
    },
    watches: [
      ['Digitrend Steel', 'Digitrend', 'the-architects', 'rect', 'digital', '#121214', 'steel', '#9ea2a7', 1],
      ['Digitrend Black', 'Digitrend', 'the-architects', 'rect', 'digital', '#121214', 'black', '#1c1c1e'],
      ['Digitrend Gold', 'Digitrend', 'the-architects', 'rect', 'digital', '#121214', 'gold', '#c9a356'],
    ],
  },
  {
    slug: 'fears', name: 'Fears', country: 'United Kingdom', city: 'Bristol', founded: '1846', website: 'https://www.fearswatches.com/',
    tagline: 'British watchmaking heritage, hand-built with understated elegance.',
    story: 'Founded in Bristol in 1846 by Edwin Fear and family-owned across generations, Fears designs and hand-builds its watches in Britain.\n\nA deep heritage meets understated, contemporary design.',
    highlights: 'Founded in Bristol in 1846\nFamily-owned across generations\nDesigned and hand-built in Britain',
    notes: {
      Redcliff: 'The first wristwatch of Fears’ modern relaunch, named after Redcliff Street in Bristol, where Edwin Fear opened his first workshop in 1846.',
      Brunswick: 'Cushion-cased and named after Brunswick Square in Bristol, where Fears once had its export office.',
      Arnos: 'Named after the area of Bristol where Fears is based today.',
    },
    watches: [
      ['Brunswick 38 White', 'Brunswick', 'the-icons', 'cushion', 'small-seconds', '#f3f2ee', 'steel', '#1f3560', 1],
      ['Brunswick 38 ‘Orchid’', 'Brunswick', 'the-icons', 'cushion', 'small-seconds', '#c99ac0', 'steel', '#3a2a40'],
      ['Brunswick 38 ‘Charcoal Rose’', 'Brunswick', 'the-icons', 'cushion', 'small-seconds', '#3a3335', 'steel', '#5a3a40'],
      ['Brunswick 40 ‘Aurora’', 'Brunswick', 'the-icons', 'cushion', 'small-seconds', '#3f8a7a', 'steel', '#1f3530'],
      ['Brunswick 40 ‘Helmsman’ ES', 'Brunswick', 'the-icons', 'cushion', 'small-seconds', '#1f2a45', 'steel', '#1f2a45'],
      ['Brunswick 40 Filton ‘Raven Black’', 'Brunswick', 'the-icons', 'cushion', 'small-seconds', '#141416', 'steel', '#2a2a2a'],
      ['Brunswick 40 Filton ‘Squadron Green’', 'Brunswick', 'the-icons', 'cushion', 'small-seconds', '#3a4a35', 'steel', '#3d4733'],
      ['Brunswick 39 Perpetual Calendar', 'Brunswick', 'the-complicated', 'cushion', 'chrono', '#f3f2ee', 'steel', '#1f3560'],
      ['Redcliff 39.5 Date ‘Endurance Specification’', 'Redcliff', 'the-icons', 'round', 'three-hand', '#1d1d1f', 'steel', '#2a2a2a'],
      ['Redcliff Date Pewter Grey', 'Redcliff', 'the-icons', 'round', 'three-hand', '#8a8d90', 'steel', '#3a3a3a'],
      ['Redcliff Sherbet Yellow', 'Redcliff', 'the-icons', 'round', 'three-hand', '#ece18c', 'steel', '#7d6f53'],
      ['Redcliff Soft Peach', 'Redcliff', 'the-icons', 'round', 'three-hand', '#f0c4a8', 'steel', '#7d6f53'],
      ['Redcliff Pale Lilac', 'Redcliff', 'the-icons', 'round', 'three-hand', '#c9b8dc', 'steel', '#3a2a40'],
      ['Arnos Pewter Blue', 'Arnos', 'the-architects', 'rect', 'small-seconds', '#5a6f8a', 'steel', '#1f3560'],
    ],
  },
  {
    slug: 'formex', name: 'Formex', country: 'Switzerland', city: 'Biel/Bienne', founded: '1999', website: 'https://formexwatch.com/',
    tagline: 'Swiss engineering, innovative design and exceptional everyday wearability.',
    story: 'Founded in Switzerland in 1999, Formex is an independent, family-owned watchmaker that designs, develops and assembles its watches in Biel/Bienne.\n\nInspired by high-performance engineering and motorsport, it is known for its patented Case Suspension System and its focus on comfort and ergonomics.',
    highlights: 'Founded in Switzerland in 1999\nIndependent and family-owned\nDesigned and assembled in Biel/Bienne\nPatented Case Suspension System',
    notes: {
      Essence: 'From Essence, Formex’s best-selling family: an automatic chronometer with the patented Case Suspension System.',
      Reef: 'A mechanical dive watch with 300 m water resistance and a bezel that swaps in seconds.',
      Stratos: 'The aviation-inspired Stratos, with a UTC function.',
      Field: 'A rugged 40 mm watch in a hard-coated titanium case, with a screw-down crown and 150 m water resistance.',
      AirField: 'Titanium, with Formex’s Power+ movement and 65-hour power reserve.',
      Aria: 'Formex’s first manufacture calibre, the FX01 micro-rotor, in an ultra-thin titanium case.',
    },
    watches: [
      ['Essence ThirtyNine Blue', 'Essence', 'the-next', 'round', 'three-hand', '#2b4f8a', 'steel', '#a7acb1', 1],
      ['Essence ThirtyNine Gamaret', 'Essence', 'the-next', 'round', 'three-hand', '#6a2a2e', 'steel', '#a7acb1'],
      ['Essence ThirtyNine Mother-of-Sky', 'Essence', 'the-next', 'round', 'three-hand', '#a9cde6', 'steel', '#a7acb1'],
      ['Essence ThirtyNine Malachite', 'Essence', 'the-rare', 'round', 'three-hand', '#1f7a50', 'steel', '#a7acb1'],
      ['Essence ThirtyNine Blue Agate', 'Essence', 'the-rare', 'round', 'three-hand', '#2a4a8a', 'steel', '#a7acb1'],
      ['Essence FortyOne Blue', 'Essence', 'the-next', 'round', 'three-hand', '#2b4f8a', 'steel', '#a7acb1'],
      ['Essence FortyOne White', 'Essence', 'the-next', 'round', 'three-hand', '#f2f3f5', 'steel', '#a7acb1'],
      ['Essence Ceramica', 'Essence', 'the-next', 'round', 'three-hand', '#3a3b3e', 'black', '#2a2b2d'],
      ['Essence Leggera', 'Essence', 'the-next', 'round', 'three-hand', '#efefef', 'black', '#1d1d1f'],
      ['Reef 39.5', 'Reef', 'the-next', 'round', 'three-hand', '#1f2f4a', 'steel', '#1f1f21'],
      ['Reef GMT', 'Reef', 'the-next', 'round', 'three-hand', '#1d1d1f', 'steel', '#a7acb1'],
      ['Stratos UTC True Pilot', 'Stratos', 'the-complicated', 'round', 'chrono', '#2e4a3a', 'steel', '#a7acb1'],
      ['Field Automatic Basalt Grey', 'Field', 'the-next', 'round', 'three-hand', '#5a5d60', 'black', '#46536b'],
      ['Field Automatic Coho Salmon', 'Field', 'the-next', 'round', 'three-hand', '#e09a7a', 'black', '#46536b'],
      ['Field Automatic Golden Honey', 'Field', 'the-next', 'round', 'three-hand', '#d9a64a', 'black', '#46536b'],
      ['AirField', 'AirField', 'the-next', 'round', 'three-hand', '#2b2f36', 'steel', '#46536b'],
      ['Aria', 'Aria', 'the-rare', 'round', 'three-hand', '#e9e6df', 'steel', '#5a4630'],
    ],
  },
  {
    slug: 'hegid', name: 'Hegid', country: 'France', city: 'Paris', founded: '2016', website: 'https://hegid.com/en/',
    tagline: 'French watchmaking, reinvented through an innovative and evolving design.',
    story: 'Founded in Paris in 2016, Hegid designs and manufactures its watches primarily in France.\n\nIt is known for its patented EVOL system: every watch is made of a capsule (movement and dial), a case and a strap, all interchangeable, so collectors can change a watch’s style in seconds rather than buy an entirely new one.',
    highlights: 'Founded in Paris in 2016\nDesigned and manufactured primarily in France\nPatented EVOL modular system',
    notes: {
      Expedition: 'A square, blocky case, built on Hegid’s interchangeable EVOL system.',
      Vision: 'An aviation-inspired tool watch with a bidirectional bezel, built on Hegid’s interchangeable EVOL system.',
      Mirage: 'A 1960s-styled octagonal steel case, built on Hegid’s interchangeable EVOL system.',
      Laboratoire: 'An Art Deco-inspired 38.5 mm steel case, built on Hegid’s interchangeable EVOL system.',
      Royaume: 'A presentation box set from Hegid.',
    },
    watches: [
      ['Expedition', 'Expedition', 'the-next', 'cushion', 'three-hand', '#1b1b1d', 'steel', '#3b2a20', 1],
      ['Expedition Eclipse', 'Expedition', 'the-next', 'cushion', 'three-hand', '#111113', 'black', '#1c1c1e'],
      ['Vision', 'Vision', 'the-next', 'round', 'three-hand', '#2f4f9a', 'black', '#1f2d58'],
      ['Vision Série Noire', 'Vision', 'the-next', 'round', 'three-hand', '#151517', 'black', '#1c1c1e'],
      ['Mirage', 'Mirage', 'the-next', 'cushion', 'three-hand', '#a9c8dc', 'steel', '#1c1c1e'],
      ['Mirage Soleil', 'Mirage', 'the-next', 'cushion', 'three-hand', '#d9a64a', 'steel', '#3b2a20'],
      ['Mirage Série Noire', 'Mirage', 'the-next', 'cushion', 'three-hand', '#151517', 'black', '#1c1c1e'],
      ['Laboratoire Clandestin', 'Laboratoire', 'the-next', 'round', 'three-hand', '#f3f3f1', 'steel', '#1f6c86'],
      ['Laboratoire Colorama', 'Laboratoire', 'the-next', 'round', 'three-hand', '#e8b23a', 'steel', '#1f6c86'],
      ['Royaume Coffret', 'Royaume', 'the-collectors', 'round', 'three-hand', '#1f2a45', 'steel', '#3b2a20'],
    ],
  },
];

const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function seedIfEmpty(db) {
  if (db.prepare('SELECT COUNT(*) AS n FROM brands').get().n > 0) return false;
  transaction(db, () => {
    const insBrand = db.prepare(`INSERT INTO brands (slug, name, country, city, founded, tagline, story, highlights, website, position)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const insWatch = db.prepare(`INSERT INTO watches
      (slug, brand_id, name, collection, curation, description, art_shape, art_style, art_dial, art_case, art_strap, featured, availability, position)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    BRANDS.forEach((b, i) => {
      const { lastInsertRowid: brandId } = insBrand.run(b.slug, b.name, b.country, b.city, b.founded || '', b.tagline, b.story, b.highlights, b.website || '', i);
      b.watches.forEach(([name, collection, curation, shape, style, dial, metal, strap, featured = 0, availability = 'request'], j) => {
        const note = b.notes?.[collection] || `From the ${collection} collection by ${b.name}.`;
        insWatch.run(slugify(`${b.name} ${name}`), brandId, name, collection, curation,
          `${note}\n\n${b.tagline}`, shape, style, dial, metal, strap, featured, availability, j);
      });
    });
    db.prepare(`INSERT INTO locations (slug, name, city, status, status_note, description, position)
      VALUES (?, ?, ?, ?, ?, ?, 0)`).run(
      'delhi-ncr', 'LYNQ Gallery, Delhi NCR', 'Delhi NCR', 'coming', 'Opening 2026',
      'Our first gallery: an intimate, design-led space where collectors can discover independent watchmaking in context, with 10–12 like-minded brands and minimal display that honours limited production.',
    );
  });
  return true;
}

export { slugify, BRANDS };
