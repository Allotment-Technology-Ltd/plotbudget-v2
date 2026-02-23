export interface ItineraryTemplateItem {
  title: string;
  entry_type: 'travel' | 'accommodation' | 'activity' | 'dining' | 'other';
  description?: string;
  start_time?: string;
  end_time?: string;
  cost_amount?: number;
  day_offset: number; // Days from trip start (0 = first day, 1 = second day, etc.)
}

export interface ItineraryTemplate {
  id: string;
  label: string;
  items: ItineraryTemplateItem[];
}

const TEMPLATES: ItineraryTemplate[] = [
  {
    id: 'beach',
    label: 'Beach Vacation',
    items: [
      { title: 'Outbound flight', entry_type: 'travel', description: 'Travel to destination', day_offset: 0 },
      { title: 'Hotel check-in', entry_type: 'accommodation', description: 'Arrive at resort', day_offset: 0 },
      { title: 'Beach day', entry_type: 'activity', description: 'Relax on the beach', day_offset: 1 },
      { title: 'Water sports', entry_type: 'activity', description: 'Snorkeling or jet skiing', day_offset: 2 },
      { title: 'Sunset dinner', entry_type: 'dining', description: 'Beachfront restaurant', day_offset: 2 },
      { title: 'Beach day', entry_type: 'activity', day_offset: 3 },
      { title: 'Boat excursion', entry_type: 'activity', description: 'Island hopping tour', day_offset: 4 },
      { title: 'Return flight', entry_type: 'travel', description: 'Flight home', day_offset: 6 },
    ],
  },
  {
    id: 'city',
    label: 'City Break',
    items: [
      { title: 'Arrival (train/flight)', entry_type: 'travel', day_offset: 0 },
      { title: 'Hotel check-in', entry_type: 'accommodation', day_offset: 0 },
      { title: 'City walking tour', entry_type: 'activity', description: 'Explore main sights', day_offset: 0 },
      { title: 'Museum visit', entry_type: 'activity', description: 'Pre-booked tickets', day_offset: 1 },
      { title: 'Local restaurant dinner', entry_type: 'dining', day_offset: 1 },
      { title: 'Shopping district', entry_type: 'activity', day_offset: 2 },
      { title: 'Lunch at food market', entry_type: 'dining', day_offset: 2 },
      { title: 'Return journey', entry_type: 'travel', day_offset: 2 },
    ],
  },
  {
    id: 'skiing',
    label: 'Skiing',
    items: [
      { title: 'Flight to resort', entry_type: 'travel', description: 'Flight + transfer', day_offset: 0 },
      { title: 'Chalet check-in', entry_type: 'accommodation', day_offset: 0 },
      { title: 'Equipment rental', entry_type: 'other', description: 'Pick up skis & boots', day_offset: 0 },
      { title: 'Ski school (morning)', entry_type: 'activity', day_offset: 1 },
      { title: 'On-mountain lunch', entry_type: 'dining', day_offset: 1 },
      { title: 'Full day skiing', entry_type: 'activity', day_offset: 2 },
      { title: 'Après-ski', entry_type: 'dining', day_offset: 2 },
      { title: 'Full day skiing', entry_type: 'activity', day_offset: 3 },
      { title: 'Full day skiing', entry_type: 'activity', day_offset: 4 },
      { title: 'Spa/wellness', entry_type: 'activity', description: 'Rest day', day_offset: 5 },
      { title: 'Return flight', entry_type: 'travel', day_offset: 6 },
    ],
  },
  {
    id: 'winter-city',
    label: 'Winter City',
    items: [
      { title: 'Arrival (train/flight)', entry_type: 'travel', day_offset: 0 },
      { title: 'Hotel check-in', entry_type: 'accommodation', day_offset: 0 },
      { title: 'Christmas markets', entry_type: 'activity', day_offset: 0 },
      { title: 'Museum visit', entry_type: 'activity', day_offset: 1 },
      { title: 'Traditional restaurant', entry_type: 'dining', description: 'Local cuisine', day_offset: 1 },
      { title: 'Ice skating', entry_type: 'activity', day_offset: 2 },
      { title: 'Hot chocolate & pastries', entry_type: 'dining', day_offset: 2 },
      { title: 'Return journey', entry_type: 'travel', day_offset: 2 },
    ],
  },
  {
    id: 'camping',
    label: 'Camping',
    items: [
      { title: 'Drive to campsite', entry_type: 'travel', day_offset: 0 },
      { title: 'Set up tent', entry_type: 'accommodation', day_offset: 0 },
      { title: 'Hiking trail', entry_type: 'activity', description: 'Morning hike', day_offset: 1 },
      { title: 'Picnic lunch', entry_type: 'dining', day_offset: 1 },
      { title: 'Lake swimming', entry_type: 'activity', day_offset: 1 },
      { title: 'Campfire dinner', entry_type: 'dining', day_offset: 1 },
      { title: 'Nature walk', entry_type: 'activity', day_offset: 2 },
      { title: 'Pack up & return', entry_type: 'travel', day_offset: 2 },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    items: [
      { title: 'Flight to conference', entry_type: 'travel', day_offset: 0 },
      { title: 'Hotel check-in', entry_type: 'accommodation', day_offset: 0 },
      { title: 'Conference registration', entry_type: 'other', day_offset: 0 },
      { title: 'Keynote presentation', entry_type: 'activity', description: 'Morning session', day_offset: 1 },
      { title: 'Networking lunch', entry_type: 'dining', day_offset: 1 },
      { title: 'Afternoon workshops', entry_type: 'activity', day_offset: 1 },
      { title: 'Client dinner', entry_type: 'dining', day_offset: 1 },
      { title: 'Final sessions', entry_type: 'activity', day_offset: 2 },
      { title: 'Return flight', entry_type: 'travel', day_offset: 2 },
    ],
  },
];

export function getItineraryTemplate(id: string): ItineraryTemplate | undefined {
  const template = TEMPLATES.find((t) => t.id === id);
  if (!template) return undefined;
  return { ...template, items: template.items.map((item) => ({ ...item })) };
}

export function getAllItineraryTemplates(): ItineraryTemplate[] {
  return TEMPLATES.map((template) => ({ ...template, items: template.items.map((item) => ({ ...item })) }));
}
