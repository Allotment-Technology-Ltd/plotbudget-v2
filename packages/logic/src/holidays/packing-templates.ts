export interface PackingTemplateItem {
  name: string;
  category: string;
}

export interface PackingTemplate {
  id: string;
  label: string;
  items: PackingTemplateItem[];
}

const TEMPLATES: PackingTemplate[] = [
  {
    id: 'beach',
    label: 'Beach',
    items: [
      { name: 'Swimwear', category: 'Clothing' },
      { name: 'Sunscreen', category: 'Toiletries' },
      { name: 'Sunglasses', category: 'Accessories' },
      { name: 'Sun hat', category: 'Accessories' },
      { name: 'Beach towel', category: 'Accessories' },
      { name: 'Flip flops', category: 'Clothing' },
      { name: 'After-sun lotion', category: 'Toiletries' },
      { name: 'Insect repellent', category: 'Toiletries' },
      { name: 'Reusable water bottle', category: 'Essentials' },
      { name: 'Passport / ID', category: 'Documents' },
      { name: 'Travel adapter', category: 'Electronics' },
      { name: 'Phone charger', category: 'Electronics' },
    ],
  },
  {
    id: 'city',
    label: 'City',
    items: [
      { name: 'Comfortable walking shoes', category: 'Clothing' },
      { name: 'Day bag / backpack', category: 'Accessories' },
      { name: 'Passport / ID', category: 'Documents' },
      { name: 'Travel adapter', category: 'Electronics' },
      { name: 'Phone charger', category: 'Electronics' },
      { name: 'Reusable water bottle', category: 'Essentials' },
      { name: 'Umbrella', category: 'Accessories' },
      { name: 'Smart outfit for dining', category: 'Clothing' },
      { name: 'Guidebook / city map', category: 'Essentials' },
      { name: 'Medication', category: 'Health' },
    ],
  },
  {
    id: 'skiing',
    label: 'Skiing',
    items: [
      { name: 'Ski jacket', category: 'Clothing' },
      { name: 'Ski trousers', category: 'Clothing' },
      { name: 'Thermal base layers', category: 'Clothing' },
      { name: 'Ski gloves', category: 'Clothing' },
      { name: 'Ski goggles', category: 'Accessories' },
      { name: 'Ski helmet', category: 'Accessories' },
      { name: 'Warm hat', category: 'Accessories' },
      { name: 'Ski socks', category: 'Clothing' },
      { name: 'Sun cream (high SPF)', category: 'Toiletries' },
      { name: 'Lip balm with SPF', category: 'Toiletries' },
      { name: 'Passport / ID', category: 'Documents' },
      { name: 'Travel insurance docs', category: 'Documents' },
    ],
  },
  {
    id: 'winter-city',
    label: 'Winter City',
    items: [
      { name: 'Winter coat', category: 'Clothing' },
      { name: 'Thermal layers', category: 'Clothing' },
      { name: 'Warm hat', category: 'Accessories' },
      { name: 'Scarf', category: 'Accessories' },
      { name: 'Gloves', category: 'Accessories' },
      { name: 'Waterproof boots', category: 'Clothing' },
      { name: 'Passport / ID', category: 'Documents' },
      { name: 'Travel adapter', category: 'Electronics' },
      { name: 'Phone charger', category: 'Electronics' },
      { name: 'Reusable water bottle', category: 'Essentials' },
    ],
  },
  {
    id: 'camping',
    label: 'Camping',
    items: [
      { name: 'Tent', category: 'Camping Gear' },
      { name: 'Sleeping bag', category: 'Camping Gear' },
      { name: 'Sleeping mat', category: 'Camping Gear' },
      { name: 'Headtorch + batteries', category: 'Camping Gear' },
      { name: 'First aid kit', category: 'Health' },
      { name: 'Insect repellent', category: 'Toiletries' },
      { name: 'Waterproof jacket', category: 'Clothing' },
      { name: 'Walking boots', category: 'Clothing' },
      { name: 'Reusable water bottle', category: 'Essentials' },
      { name: 'Cooking kit', category: 'Camping Gear' },
      { name: 'Passport / ID', category: 'Documents' },
      { name: 'Maps / navigation', category: 'Essentials' },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    items: [
      { name: 'Smart clothes', category: 'Clothing' },
      { name: 'Laptop + charger', category: 'Electronics' },
      { name: 'Phone charger', category: 'Electronics' },
      { name: 'Business cards', category: 'Documents' },
      { name: 'Passport / ID', category: 'Documents' },
      { name: 'Travel adapter', category: 'Electronics' },
      { name: 'Notebook and pen', category: 'Essentials' },
      { name: 'Formal shoes', category: 'Clothing' },
      { name: 'Toiletries bag', category: 'Toiletries' },
      { name: 'Earphones / headphones', category: 'Electronics' },
    ],
  },
];

export function getPackingTemplate(id: string): PackingTemplate | undefined {
  const template = TEMPLATES.find((t) => t.id === id);
  if (!template) return undefined;
  return { ...template, items: template.items.map((item) => ({ ...item })) };
}

export function getAllPackingTemplates(): PackingTemplate[] {
  return TEMPLATES.map((template) => ({ ...template, items: template.items.map((item) => ({ ...item })) }));
}
