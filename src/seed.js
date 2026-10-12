// Starter content drawn from the LYNQ brand portfolio deck. Only public-facing
// brand information is used here; no commercial terms. Prices are left blank
// ("price on request") and specs empty until the team fills them in the admin.

import { transaction } from './db.js';

const BRANDS = [
  {
    slug: 'arsene-lippens', name: 'Arsène Lippens', country: 'Switzerland', city: 'Geneva',
    tagline: 'Swiss-made watches inspired by heritage, friendship and automotive design.',
    story: 'An independent Swiss watch brand crafted in Geneva, Arsène Lippens pairs vintage-inspired design with a distinctly contemporary eye.\n\nPersonalisation and storytelling sit at the heart of the brand, from its textile dials to its skeletonised chronographs.',
    highlights: 'Independent Swiss watch brand\nCrafted in Geneva\nVintage-inspired designs with a contemporary aesthetic\nPersonalisation and storytelling at the heart of the brand',
    watches: [
      ['Classic 3-Hand', 'Classic 3-Hand', 'the-independents', 'round', 'three-hand', '#4b4e54', 'steel', '#9c9c9c', 1],
      ['Textile Dial', 'Textile Dials', 'the-artisans', 'round', 'three-hand', '#4a97ad', 'steel', '#8f8f8f'],
      ['Chronograph', 'Chronographs', 'the-complicated', 'round', 'chrono', '#2f5c42', 'steel', '#3f4a2c'],
      ['Skeleton Chronograph', 'Skeleton Chronographs', 'the-complicated', 'round', 'skeleton', '#2c2d30', 'steel', '#55585c'],
    ],
  },
  {
    slug: 'furlan-marri', name: 'Furlan Marri', country: 'Switzerland', city: 'Geneva',
    tagline: 'Independent Geneva watchmaking built around design, heritage and storytelling.',
    story: 'Based in Geneva, Furlan Marri combines vintage watchmaking influences with contemporary design.\n\nThe brand has built a devoted following through its focus on craftsmanship, storytelling and community.',
    highlights: 'Independent watchmaker based in Geneva\nVintage influences, contemporary design\nStrong focus on craftsmanship, storytelling and community',
    watches: [
      ['MechaQuartz', 'Mechaquartz', 'the-complicated', 'round', 'chrono', '#ead0b8', 'rose', '#4a3326', 1],
      ['Cornes de Vache', 'Cornes de Vache', 'the-independents', 'round', 'small-seconds', '#cf978c', 'steel', '#3d4733'],
      ['Disco Volante', 'Disco Volante', 'the-architects', 'round', 'small-seconds', '#1b1c1e', 'steel', '#9ea2a7'],
    ],
  },
  {
    slug: 'beaubleu', name: 'Beaubleu', country: 'France', city: 'Paris',
    tagline: 'Parisian watchmaking with a distinctive, artistic design language.',
    story: 'Designed and assembled in Paris, Beaubleu is instantly recognisable by its signature round hands, a visual identity unlike anything else in watchmaking.\n\nEach piece is powered by an automatic movement, displayed through an open caseback.',
    highlights: 'French independent watch brand\nDesigned and assembled in Paris\nSignature round hands\nAutomatic movements with open casebacks',
    watches: [
      ['Ecce', 'Ecce', 'the-architects', 'round', 'three-hand', '#f1eee8', 'rose', '#b9a592', 1],
      ['Figura', 'Figura', 'the-architects', 'rect', 'three-hand', '#f4f1ea', 'gold', '#bba78f'],
      ['La Pièce', 'La Pièce', 'the-architects', 'round', 'three-hand', '#ece2c9', 'rose', '#b4a08a'],
      ['Seconde Française', 'Seconde Française', 'the-architects', 'round', 'small-seconds', '#24262c', 'steel', '#1e1e20'],
    ],
  },
  {
    slug: 'dennison', name: 'Dennison', country: 'Switzerland', city: '',
    tagline: '175 years of watchmaking heritage, reimagined for today.',
    story: 'Dennison’s heritage reaches back 175 years to Aaron Lufkin Dennison, regarded as the father of American watchmaking. The name went on to become a renowned British-American case maker for Rolex, Omega, IWC, Jaeger-LeCoultre and Zenith.\n\nToday that heritage is reinterpreted through contemporary design by renowned watch designer Emmanuel Gueit.',
    highlights: 'Heritage dating back 175 years to Aaron Lufkin Dennison\nHistoric case maker for the great Swiss houses\nContemporary design by Emmanuel Gueit',
    watches: [
      ['ALD Malachite', 'ALD Collection', 'the-icons', 'cushion', 'three-hand', '#1f7a50', 'gold', '#1d5a3a', 1],
      ['ALD Mini', 'ALD Mini', 'the-icons', 'cushion', 'three-hand', '#eeeae4', 'gold', '#c9a356'],
      ['ALD Dual Time', 'ALD Dual Time', 'the-icons', 'cushion', 'three-hand', '#69a85b', 'steel', '#9ba0a5'],
    ],
  },
  {
    slug: 'awake', name: 'Awake', country: 'France', city: '',
    tagline: 'French watchmaking bringing rare artisanal crafts into contemporary watch design.',
    story: 'Awake is a French independent devoted to the Métiers d’Art and the preservation of traditional craftsmanship.\n\nIts contemporary watches are built around highly artisanal, handcrafted dials, with a strong emphasis on cultural heritage and artistic expression.',
    highlights: 'French independent watch brand\nFocused on Métiers d’Art\nHandcrafted, highly artisanal dials\nCultural heritage and artistic expression',
    watches: [
      ['Son Mài – Frosted Leaf', 'Son Mài', 'the-artisans', 'round', 'three-hand', '#1e4a3a', 'steel', '#6c6f73', 1],
      ['Son Mài – Guilloché Main', 'Son Mài', 'the-artisans', 'round', 'three-hand', '#8fc131', 'steel', '#2f9a3c'],
      ['Son Mài – Fragments', 'Son Mài', 'the-artisans', 'round', 'three-hand', '#1f6a4a', 'steel', '#2b2c2e'],
      ['Silver Leaf', 'Silver Leaf', 'the-artisans', 'round', 'three-hand', '#1f8091', 'steel', '#2a8ba3'],
    ],
  },
  {
    slug: 'atelier-wen', name: 'Atelier Wen', country: 'China', city: '', founded: '2018',
    tagline: 'Chinese culture and craftsmanship, reimagined through modern watchmaking.',
    story: 'Founded in 2018 by two French founders with deep ties to Chinese culture, Atelier Wen sets out to elevate Chinese watchmaking and craftsmanship on the global stage.\n\nIts watches combine traditional Chinese crafts, materials and cultural references with contemporary design.',
    highlights: 'Independent, founded in 2018\nElevating Chinese watchmaking globally\nTraditional crafts meet contemporary design',
    watches: [
      ['Perception', 'Perception', 'the-artisans', 'round', 'three-hand', '#2e7a68', 'steel', '#a5aaaf', 1],
      ['Inflection', 'Inflection', 'the-independents', 'round', 'three-hand', '#212224', 'steel', '#7d8186'],
      ['Millésime', 'Millésime', 'the-artisans', 'round', 'three-hand', '#203f7c', 'steel', '#a5aaaf'],
    ],
  },
  {
    slug: 'amida', name: 'Amida', country: 'Switzerland', city: '', founded: '1925',
    tagline: 'Swiss watchmaking heritage revived through radical, retro-futuristic design.',
    story: 'Founded in Switzerland in 1925, Amida is best known for the Digitrend, a pioneering mechanical “driver’s watch” launched in 1976.\n\nRelaunched in 2024, the brand revives its iconic name and patents, including its Light Reflecting Display, which uses a sapphire prism to project the time vertically.',
    highlights: 'Swiss watch brand founded in 1925\nRelaunched in 2024\nHome of the 1976 Digitrend driver’s watch\nLight Reflecting Display with a sapphire prism',
    watches: [
      ['NASA Tribute', 'NASA Tribute', 'the-architects', 'rect', 'digital', '#121214', 'steel', '#1c1c1e', 1],
      ['Open Sapphire 2', 'Open Sapphire 2', 'the-architects', 'rect', 'digital', '#121214', 'steel', '#2a2a2c'],
    ],
  },
  {
    slug: 'fears', name: 'Fears', country: 'United Kingdom', city: 'Bristol', founded: '1846',
    tagline: 'British watchmaking heritage, hand-built with understated elegance.',
    story: 'Founded in Bristol in 1846 and family-owned across generations, Fears designs and hand-builds its watches in Britain.\n\nA deep heritage meets understated, contemporary design.',
    highlights: 'Founded in Bristol in 1846\nFamily-owned across generations\nDesigned and hand-built in Britain',
    watches: [
      ['Brunswick', 'Brunswick', 'the-icons', 'cushion', 'small-seconds', '#f3f2ee', 'steel', '#1f3560', 1],
      ['Redcliff', 'Redcliff', 'the-icons', 'round', 'three-hand', '#e4dc8c', 'steel', '#7d6f53'],
      ['Arnos', 'Arnos', 'the-architects', 'rect', 'small-seconds', '#3d5480', 'steel', '#1f3560'],
      ['Eminence', 'Eminence', 'the-complicated', 'round', 'skeleton', '#f1f0ec', 'steel', '#1c2e55'],
    ],
  },
  {
    slug: 'formex', name: 'Formex', country: 'Switzerland', city: 'Biel/Bienne', founded: '1999',
    tagline: 'Swiss engineering, innovative design and exceptional everyday wearability.',
    story: 'Founded in Switzerland in 1999, Formex is an independent, family-owned watchmaker that designs, develops and assembles its watches in Biel/Bienne.\n\nInspired by high-performance engineering and motorsport, it is known for its patented Case Suspension System and its focus on comfort and ergonomics.',
    highlights: 'Founded in Switzerland in 1999\nIndependent and family-owned\nDesigned and assembled in Biel/Bienne\nPatented Case Suspension System',
    watches: [
      ['Essence', 'Essence', 'the-next', 'round', 'three-hand', '#f2f3f5', 'steel', '#a7acb1', 1],
      ['Essence Leggera', 'Essence Leggera', 'the-next', 'round', 'three-hand', '#efefef', 'black', '#1d1d1f'],
      ['Reef', 'Reef', 'the-next', 'round', 'three-hand', '#d9a064', 'steel', '#1f1f21'],
      ['Field', 'Field', 'the-next', 'round', 'three-hand', '#2b406b', 'black', '#46536b'],
      ['Essence Ceramica', 'Essence Ceramica', 'the-next', 'round', 'three-hand', '#3a3b3e', 'black', '#2a2b2d'],
      ['Stratos', 'Stratos', 'the-complicated', 'round', 'chrono', '#2e4a3a', 'steel', '#a7acb1'],
    ],
  },
  {
    slug: 'hegid', name: 'Hegid', country: 'France', city: 'Paris', founded: '2016',
    tagline: 'French watchmaking, reinvented through an innovative and evolving design.',
    story: 'Founded in Paris in 2016, Hegid designs and manufactures its watches primarily in France.\n\nIt is known for its patented EVOL system, which lets a watch change style in seconds. The brand also offers individual capsules, cases and straps, so collectors can evolve an existing watch rather than buy an entirely new one.',
    highlights: 'Founded in Paris in 2016\nDesigned and manufactured primarily in France\nPatented EVOL modular system',
    watches: [
      ['Expedition', 'Expedition', 'the-next', 'cushion', 'three-hand', '#1b1b1d', 'steel', '#3b2a20', 1],
      ['Vision', 'Vision', 'the-next', 'round', 'three-hand', '#2f4f9a', 'black', '#1f2d58'],
      ['Mirage', 'Mirage', 'the-next', 'cushion', 'three-hand', '#a9c8dc', 'steel', '#1c1c1e'],
      ['Laboratoire', 'Laboratoire', 'the-next', 'round', 'three-hand', '#f3f3f1', 'steel', '#1f6c86'],
    ],
  },
];

const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function seedIfEmpty(db) {
  if (db.prepare('SELECT COUNT(*) AS n FROM brands').get().n > 0) return false;
  transaction(db, () => {
    const insBrand = db.prepare(`INSERT INTO brands (slug, name, country, city, founded, tagline, story, highlights, position)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const insWatch = db.prepare(`INSERT INTO watches
      (slug, brand_id, name, collection, curation, description, art_shape, art_style, art_dial, art_case, art_strap, featured, position)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    BRANDS.forEach((b, i) => {
      const { lastInsertRowid: brandId } = insBrand.run(b.slug, b.name, b.country, b.city, b.founded || '', b.tagline, b.story, b.highlights, i);
      b.watches.forEach(([name, collection, curation, shape, style, dial, metal, strap, featured = 0], j) => {
        insWatch.run(slugify(`${b.name} ${name}`), brandId, name, collection, curation,
          `From the ${collection} collection by ${b.name}. ${b.tagline}`,
          shape, style, dial, metal, strap, featured, j);
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

export { slugify };
