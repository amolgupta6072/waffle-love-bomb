// Fixed vocabularies shared by the public site and the admin.

// The eight curations from the LYNQ wall concept.
export const CURATIONS = [
  { slug: 'the-independents', name: 'The Independents', blurb: 'Founder-led maisons answering only to their own vision.' },
  { slug: 'the-complicated', name: 'The Complicated', blurb: 'Chronographs, skeletons and mechanical ingenuity.' },
  { slug: 'the-artisans', name: 'The Artisans', blurb: 'Métiers d’art: lacquer, guilloché and hand-made dials.' },
  { slug: 'the-icons', name: 'The Icons', blurb: 'Heritage names and designs that defined their era.' },
  { slug: 'the-next', name: 'The Next', blurb: 'New thinking in modularity, materials and engineering.' },
  { slug: 'the-rare', name: 'The Rare', blurb: 'Limited runs and pieces that seldom surface.' },
  { slug: 'the-architects', name: 'The Architects', blurb: 'Form-first design, from unconventional cases to new displays.' },
  { slug: 'the-collectors', name: 'The Collectors', blurb: 'Pieces chosen for the seasoned collector.' },
];
export const curationBySlug = Object.fromEntries(CURATIONS.map((c) => [c.slug, c]));

export const AVAILABILITY = {
  available: 'Available to order',
  request: 'Available on request',
  preview: 'View in gallery',
  sold: 'Sold out',
};

export const REQUEST_TYPES = {
  order: 'Order',
  enquiry: 'Enquiry',
  appointment: 'Appointment',
  event: 'Event RSVP',
  partner: 'Brand partnership',
  newsletter: 'Newsletter',
};

export const REQUEST_STATUSES = { new: 'New', in_progress: 'In progress', closed: 'Closed' };

export const requestRef = (id) => `LQ-${String(id).padStart(6, '0')}`;

export const LOCATION_STATUSES = { open: 'Open', coming: 'Coming soon' };
