/**
 * Pre-populated templates for packing lists, itineraries, and budgets
 * based on common trip types.
 */

export type TripType =
  | 'beach'
  | 'city'
  | 'skiing'
  | 'camping'
  | 'business'
  | 'weekend'
  | 'road-trip';

export interface PackingTemplate {
  category: string;
  name: string;
  assignee: 'me' | 'partner' | 'shared';
}

export interface ItineraryTemplate {
  title: string;
  entry_type: 'travel' | 'accommodation' | 'activity' | 'dining' | 'other';
  description?: string;
}

export interface BudgetTemplate {
  category: 'flights' | 'accommodation' | 'car_rental' | 'activities' | 'food' | 'transport' | 'other';
  name: string;
  planned_amount: number;
}

export const TRIP_TYPES = [
  { value: 'beach', label: 'Beach Vacation' },
  { value: 'city', label: 'City Break' },
  { value: 'skiing', label: 'Skiing/Winter Sports' },
  { value: 'camping', label: 'Camping/Hiking' },
  { value: 'business', label: 'Business Trip' },
  { value: 'weekend', label: 'Weekend Getaway' },
  { value: 'road-trip', label: 'Road Trip' },
] as const;

// Packing List Templates
export const PACKING_TEMPLATES: Record<TripType, PackingTemplate[]> = {
  beach: [
    { category: 'Clothing', name: 'Swimwear', assignee: 'shared' },
    { category: 'Clothing', name: 'Beach cover-up', assignee: 'shared' },
    { category: 'Clothing', name: 'Sandals/flip-flops', assignee: 'shared' },
    { category: 'Clothing', name: 'Sun hat', assignee: 'shared' },
    { category: 'Clothing', name: 'Sunglasses', assignee: 'shared' },
    { category: 'Toiletries', name: 'Sunscreen (SPF 30+)', assignee: 'shared' },
    { category: 'Toiletries', name: 'After-sun lotion', assignee: 'shared' },
    { category: 'Accessories', name: 'Beach towel', assignee: 'shared' },
    { category: 'Accessories', name: 'Beach bag', assignee: 'shared' },
    { category: 'Accessories', name: 'Waterproof phone case', assignee: 'shared' },
    { category: 'Other', name: 'Snorkel & mask', assignee: 'shared' },
    { category: 'Other', name: 'Beach umbrella', assignee: 'shared' },
  ],
  city: [
    { category: 'Clothing', name: 'Comfortable walking shoes', assignee: 'shared' },
    { category: 'Clothing', name: 'Smart casual outfit', assignee: 'shared' },
    { category: 'Clothing', name: 'Light jacket', assignee: 'shared' },
    { category: 'Clothing', name: 'Day backpack', assignee: 'shared' },
    { category: 'Electronics', name: 'Camera', assignee: 'shared' },
    { category: 'Electronics', name: 'Phone charger', assignee: 'shared' },
    { category: 'Electronics', name: 'Portable battery pack', assignee: 'shared' },
    { category: 'Documents', name: 'City maps/guidebook', assignee: 'shared' },
    { category: 'Documents', name: 'Museum tickets (printed)', assignee: 'shared' },
    { category: 'Accessories', name: 'Reusable water bottle', assignee: 'shared' },
    { category: 'Accessories', name: 'Umbrella', assignee: 'shared' },
  ],
  skiing: [
    { category: 'Clothing', name: 'Ski jacket', assignee: 'shared' },
    { category: 'Clothing', name: 'Ski pants', assignee: 'shared' },
    { category: 'Clothing', name: 'Thermal base layers', assignee: 'shared' },
    { category: 'Clothing', name: 'Ski gloves', assignee: 'shared' },
    { category: 'Clothing', name: 'Ski socks', assignee: 'shared' },
    { category: 'Clothing', name: 'Neck warmer/balaclava', assignee: 'shared' },
    { category: 'Clothing', name: 'Beanie hat', assignee: 'shared' },
    { category: 'Equipment', name: 'Ski goggles', assignee: 'shared' },
    { category: 'Equipment', name: 'Helmet', assignee: 'shared' },
    { category: 'Equipment', name: 'Ski pass holder', assignee: 'shared' },
    { category: 'Toiletries', name: 'Lip balm', assignee: 'shared' },
    { category: 'Toiletries', name: 'High SPF sunscreen', assignee: 'shared' },
    { category: 'Other', name: 'Hand warmers', assignee: 'shared' },
    { category: 'Other', name: 'Après-ski boots', assignee: 'shared' },
  ],
  camping: [
    { category: 'Equipment', name: 'Tent', assignee: 'shared' },
    { category: 'Equipment', name: 'Sleeping bag', assignee: 'shared' },
    { category: 'Equipment', name: 'Sleeping mat', assignee: 'shared' },
    { category: 'Equipment', name: 'Camping stove', assignee: 'shared' },
    { category: 'Equipment', name: 'Cooking utensils', assignee: 'shared' },
    { category: 'Equipment', name: 'Headtorch/flashlight', assignee: 'shared' },
    { category: 'Equipment', name: 'First aid kit', assignee: 'shared' },
    { category: 'Clothing', name: 'Hiking boots', assignee: 'shared' },
    { category: 'Clothing', name: 'Waterproof jacket', assignee: 'shared' },
    { category: 'Clothing', name: 'Warm layers', assignee: 'shared' },
    { category: 'Other', name: 'Water purification tablets', assignee: 'shared' },
    { category: 'Other', name: 'Maps & compass', assignee: 'shared' },
    { category: 'Other', name: 'Insect repellent', assignee: 'shared' },
    { category: 'Other', name: 'Bin bags', assignee: 'shared' },
  ],
  business: [
    { category: 'Clothing', name: 'Business suits/formal wear', assignee: 'me' },
    { category: 'Clothing', name: 'Dress shoes', assignee: 'me' },
    { category: 'Clothing', name: 'Ties/accessories', assignee: 'me' },
    { category: 'Electronics', name: 'Laptop', assignee: 'me' },
    { category: 'Electronics', name: 'Laptop charger', assignee: 'me' },
    { category: 'Electronics', name: 'Phone charger', assignee: 'me' },
    { category: 'Electronics', name: 'Presentation remote', assignee: 'me' },
    { category: 'Documents', name: 'Business cards', assignee: 'me' },
    { category: 'Documents', name: 'Meeting notes/agenda', assignee: 'me' },
    { category: 'Documents', name: 'Company ID badge', assignee: 'me' },
    { category: 'Other', name: 'Travel adapters', assignee: 'me' },
  ],
  weekend: [
    { category: 'Clothing', name: 'Casual outfits', assignee: 'shared' },
    { category: 'Clothing', name: 'Comfortable shoes', assignee: 'shared' },
    { category: 'Clothing', name: 'Jacket', assignee: 'shared' },
    { category: 'Toiletries', name: 'Toothbrush & toothpaste', assignee: 'shared' },
    { category: 'Toiletries', name: 'Mini toiletries', assignee: 'shared' },
    { category: 'Electronics', name: 'Phone charger', assignee: 'shared' },
    { category: 'Other', name: 'Book/entertainment', assignee: 'shared' },
  ],
  'road-trip': [
    { category: 'Documents', name: 'Driving licence', assignee: 'shared' },
    { category: 'Documents', name: 'Car insurance docs', assignee: 'shared' },
    { category: 'Documents', name: 'Breakdown cover details', assignee: 'shared' },
    { category: 'Equipment', name: 'Phone mount', assignee: 'shared' },
    { category: 'Equipment', name: 'Car charger', assignee: 'shared' },
    { category: 'Equipment', name: 'Sat nav/maps', assignee: 'shared' },
    { category: 'Equipment', name: 'First aid kit', assignee: 'shared' },
    { category: 'Other', name: 'Snacks & drinks', assignee: 'shared' },
    { category: 'Other', name: 'Entertainment/audiobooks', assignee: 'shared' },
    { category: 'Other', name: 'Sunglasses', assignee: 'shared' },
    { category: 'Other', name: 'Reusable bags', assignee: 'shared' },
  ],
};

// Itinerary Templates (sample entries)
export const ITINERARY_TEMPLATES: Record<TripType, ItineraryTemplate[]> = {
  beach: [
    { title: 'Flight to destination', entry_type: 'travel', description: 'Outbound flight' },
    { title: 'Hotel check-in', entry_type: 'accommodation', description: 'Check-in at resort' },
    { title: 'Beach day', entry_type: 'activity', description: 'Relax on the beach' },
    { title: 'Sunset dinner', entry_type: 'dining', description: 'Beachfront restaurant' },
    { title: 'Return flight', entry_type: 'travel', description: 'Flight home' },
  ],
  city: [
    { title: 'Train/flight arrival', entry_type: 'travel', description: 'Arrive in city' },
    { title: 'Hotel check-in', entry_type: 'accommodation' },
    { title: 'City walking tour', entry_type: 'activity', description: 'Explore main sights' },
    { title: 'Museum visit', entry_type: 'activity', description: 'Pre-booked tickets' },
    { title: 'Local restaurant dinner', entry_type: 'dining' },
    { title: 'Shopping district', entry_type: 'activity' },
    { title: 'Return journey', entry_type: 'travel' },
  ],
  skiing: [
    { title: 'Travel to resort', entry_type: 'travel', description: 'Flight + transfer' },
    { title: 'Chalet check-in', entry_type: 'accommodation' },
    { title: 'Ski equipment rental', entry_type: 'other', description: 'Pick up skis & boots' },
    { title: 'Ski school/lessons', entry_type: 'activity', description: 'Morning lessons' },
    { title: 'Mountain lunch', entry_type: 'dining' },
    { title: 'Afternoon skiing', entry_type: 'activity' },
    { title: 'Après-ski', entry_type: 'dining' },
  ],
  camping: [
    { title: 'Drive to campsite', entry_type: 'travel' },
    { title: 'Pitch tent', entry_type: 'accommodation', description: 'Set up camp' },
    { title: 'Hiking trail', entry_type: 'activity', description: 'Morning hike' },
    { title: 'Picnic lunch', entry_type: 'dining' },
    { title: 'Swimming/lake activities', entry_type: 'activity' },
    { title: 'Campfire dinner', entry_type: 'dining' },
  ],
  business: [
    { title: 'Flight to conference', entry_type: 'travel' },
    { title: 'Hotel check-in', entry_type: 'accommodation' },
    { title: 'Conference registration', entry_type: 'other' },
    { title: 'Keynote presentation', entry_type: 'activity', description: 'Morning session' },
    { title: 'Networking lunch', entry_type: 'dining' },
    { title: 'Afternoon workshops', entry_type: 'activity' },
    { title: 'Client dinner', entry_type: 'dining' },
    { title: 'Return flight', entry_type: 'travel' },
  ],
  weekend: [
    { title: 'Travel to destination', entry_type: 'travel' },
    { title: 'B&B check-in', entry_type: 'accommodation' },
    { title: 'Explore local area', entry_type: 'activity' },
    { title: 'Dinner reservation', entry_type: 'dining' },
    { title: 'Brunch', entry_type: 'dining' },
    { title: 'Return journey', entry_type: 'travel' },
  ],
  'road-trip': [
    { title: 'Depart home', entry_type: 'travel', description: 'Start driving' },
    { title: 'Stop 1: Scenic viewpoint', entry_type: 'activity' },
    { title: 'Lunch stop', entry_type: 'dining' },
    { title: 'Hotel check-in', entry_type: 'accommodation', description: 'Overnight stay' },
    { title: 'Explore local town', entry_type: 'activity' },
    { title: 'Continue journey', entry_type: 'travel' },
    { title: 'Return home', entry_type: 'travel' },
  ],
};

// Budget Templates (estimated amounts in GBP)
export const BUDGET_TEMPLATES: Record<TripType, BudgetTemplate[]> = {
  beach: [
    { category: 'flights', name: 'Return flights (2 people)', planned_amount: 500 },
    { category: 'accommodation', name: 'Hotel (7 nights)', planned_amount: 800 },
    { category: 'transport', name: 'Airport transfers', planned_amount: 60 },
    { category: 'activities', name: 'Water sports & excursions', planned_amount: 200 },
    { category: 'food', name: 'Meals & drinks', planned_amount: 400 },
    { category: 'other', name: 'Travel insurance', planned_amount: 50 },
    { category: 'other', name: 'Spending money', planned_amount: 300 },
  ],
  city: [
    { category: 'transport', name: 'Train/flights', planned_amount: 200 },
    { category: 'accommodation', name: 'Hotel (3 nights)', planned_amount: 450 },
    { category: 'transport', name: 'Public transport passes', planned_amount: 40 },
    { category: 'activities', name: 'Museum & attraction tickets', planned_amount: 120 },
    { category: 'food', name: 'Restaurants & cafes', planned_amount: 250 },
    { category: 'other', name: 'Shopping', planned_amount: 150 },
  ],
  skiing: [
    { category: 'flights', name: 'Flights (2 people)', planned_amount: 400 },
    { category: 'accommodation', name: 'Chalet (7 nights)', planned_amount: 1200 },
    { category: 'transport', name: 'Airport & resort transfers', planned_amount: 100 },
    { category: 'activities', name: 'Ski passes (7 days)', planned_amount: 600 },
    { category: 'activities', name: 'Equipment rental', planned_amount: 250 },
    { category: 'activities', name: 'Ski school', planned_amount: 300 },
    { category: 'food', name: 'Meals & après-ski', planned_amount: 500 },
    { category: 'other', name: 'Travel insurance (winter sports)', planned_amount: 100 },
  ],
  camping: [
    { category: 'transport', name: 'Fuel', planned_amount: 80 },
    { category: 'accommodation', name: 'Campsite fees (5 nights)', planned_amount: 120 },
    { category: 'food', name: 'Groceries & supplies', planned_amount: 150 },
    { category: 'activities', name: 'Park entry fees', planned_amount: 40 },
    { category: 'other', name: 'Equipment (if needed)', planned_amount: 200 },
  ],
  business: [
    { category: 'flights', name: 'Business class flight', planned_amount: 800 },
    { category: 'accommodation', name: 'Hotel (3 nights)', planned_amount: 450 },
    { category: 'transport', name: 'Taxi/car service', planned_amount: 100 },
    { category: 'food', name: 'Meals (expensable)', planned_amount: 200 },
    { category: 'activities', name: 'Conference tickets', planned_amount: 500 },
    { category: 'other', name: 'Client entertainment', planned_amount: 150 },
  ],
  weekend: [
    { category: 'transport', name: 'Train/fuel', planned_amount: 80 },
    { category: 'accommodation', name: 'B&B (2 nights)', planned_amount: 200 },
    { category: 'food', name: 'Meals out', planned_amount: 150 },
    { category: 'activities', name: 'Local attractions', planned_amount: 60 },
    { category: 'other', name: 'Sundries', planned_amount: 50 },
  ],
  'road-trip': [
    { category: 'transport', name: 'Fuel', planned_amount: 200 },
    { category: 'car_rental', name: 'Car hire (if needed)', planned_amount: 300 },
    { category: 'accommodation', name: 'Hotels en route (4 nights)', planned_amount: 400 },
    { category: 'food', name: 'Meals & snacks', planned_amount: 250 },
    { category: 'activities', name: 'Attractions & tours', planned_amount: 150 },
    { category: 'other', name: 'Parking & tolls', planned_amount: 60 },
    { category: 'other', name: 'Emergency fund', planned_amount: 100 },
  ],
};
