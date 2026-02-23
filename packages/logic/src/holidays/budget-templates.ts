export interface BudgetTemplateItem {
  name: string;
  category: 'flights' | 'accommodation' | 'car_rental' | 'activities' | 'food' | 'transport' | 'other';
  planned_amount: number;
}

export interface BudgetTemplate {
  id: string;
  label: string;
  items: BudgetTemplateItem[];
}

const TEMPLATES: BudgetTemplate[] = [
  {
    id: 'beach',
    label: 'Beach Vacation',
    items: [
      { name: 'Return flights', category: 'flights', planned_amount: 500 },
      { name: 'Hotel/resort', category: 'accommodation', planned_amount: 800 },
      { name: 'Airport transfers', category: 'transport', planned_amount: 60 },
      { name: 'Water sports & excursions', category: 'activities', planned_amount: 200 },
      { name: 'Meals & drinks', category: 'food', planned_amount: 400 },
      { name: 'Travel insurance', category: 'other', planned_amount: 50 },
      { name: 'Spending money', category: 'other', planned_amount: 300 },
    ],
  },
  {
    id: 'city',
    label: 'City Break',
    items: [
      { name: 'Flights/train', category: 'flights', planned_amount: 200 },
      { name: 'Hotel', category: 'accommodation', planned_amount: 450 },
      { name: 'Public transport passes', category: 'transport', planned_amount: 40 },
      { name: 'Museum & attraction tickets', category: 'activities', planned_amount: 120 },
      { name: 'Restaurants & cafes', category: 'food', planned_amount: 250 },
      { name: 'Shopping', category: 'other', planned_amount: 150 },
    ],
  },
  {
    id: 'skiing',
    label: 'Skiing',
    items: [
      { name: 'Flights', category: 'flights', planned_amount: 400 },
      { name: 'Chalet/hotel', category: 'accommodation', planned_amount: 1200 },
      { name: 'Airport & resort transfers', category: 'transport', planned_amount: 100 },
      { name: 'Ski passes', category: 'activities', planned_amount: 600 },
      { name: 'Equipment rental', category: 'car_rental', planned_amount: 250 },
      { name: 'Ski school', category: 'activities', planned_amount: 300 },
      { name: 'Meals & après-ski', category: 'food', planned_amount: 500 },
      { name: 'Travel insurance (winter sports)', category: 'other', planned_amount: 100 },
    ],
  },
  {
    id: 'winter-city',
    label: 'Winter City',
    items: [
      { name: 'Flights/train', category: 'flights', planned_amount: 250 },
      { name: 'Hotel', category: 'accommodation', planned_amount: 500 },
      { name: 'Public transport', category: 'transport', planned_amount: 50 },
      { name: 'Christmas markets & attractions', category: 'activities', planned_amount: 100 },
      { name: 'Meals & warming drinks', category: 'food', planned_amount: 300 },
      { name: 'Gifts & souvenirs', category: 'other', planned_amount: 150 },
    ],
  },
  {
    id: 'camping',
    label: 'Camping',
    items: [
      { name: 'Fuel/transport', category: 'transport', planned_amount: 80 },
      { name: 'Campsite fees', category: 'accommodation', planned_amount: 120 },
      { name: 'Groceries & supplies', category: 'food', planned_amount: 150 },
      { name: 'Park entry fees', category: 'activities', planned_amount: 40 },
      { name: 'Equipment (if needed)', category: 'other', planned_amount: 200 },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    items: [
      { name: 'Business class flight', category: 'flights', planned_amount: 800 },
      { name: 'Hotel', category: 'accommodation', planned_amount: 450 },
      { name: 'Taxi/car service', category: 'transport', planned_amount: 100 },
      { name: 'Meals (expensable)', category: 'food', planned_amount: 200 },
      { name: 'Conference tickets', category: 'activities', planned_amount: 500 },
      { name: 'Client entertainment', category: 'other', planned_amount: 150 },
    ],
  },
];

export function getBudgetTemplate(id: string): BudgetTemplate | undefined {
  const template = TEMPLATES.find((t) => t.id === id);
  if (!template) return undefined;
  return { ...template, items: template.items.map((item) => ({ ...item })) };
}

export function getAllBudgetTemplates(): BudgetTemplate[] {
  return TEMPLATES.map((template) => ({ ...template, items: template.items.map((item) => ({ ...item })) }));
}
