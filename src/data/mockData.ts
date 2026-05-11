export const familyMembers = [
  { id: '1', name: 'Alex (You)', age: 35, avatar: 'A', role: 'Parent', calories: 2200, goal: 'Weight Loss', allergies: ['Peanuts'] },
  { id: '2', name: 'Jamie', age: 32, avatar: 'J', role: 'Parent', calories: 1900, goal: 'Maintenance', allergies: [] },
  { id: '3', name: 'Sam', age: 10, avatar: 'S', role: 'Child', calories: 1600, goal: 'Growth', allergies: ['Dairy'] },
  { id: '4', name: 'Riley', age: 7, avatar: 'R', role: 'Child', calories: 1400, goal: 'Growth', allergies: [] },
];

export const weeklyMealPlan = [
  {
    day: 'Monday',
    breakfast: 'Greek Yogurt Parfait with Berries',
    lunch: 'Grilled Chicken Wrap',
    dinner: 'Salmon with Roasted Vegetables',
    snack: 'Apple with Almond Butter',
  },
  {
    day: 'Tuesday',
    breakfast: 'Avocado Toast with Poached Eggs',
    lunch: 'Lentil Soup with Crusty Bread',
    dinner: 'Stir-fry Tofu with Brown Rice',
    snack: 'Mixed Nuts',
  },
  {
    day: 'Wednesday',
    breakfast: 'Overnight Oats with Chia Seeds',
    lunch: 'Caesar Salad with Grilled Shrimp',
    dinner: 'Beef Tacos with Guacamole',
    snack: 'Hummus with Veggies',
  },
  {
    day: 'Thursday',
    breakfast: 'Smoothie Bowl',
    lunch: 'Turkey & Avocado Sandwich',
    dinner: 'Baked Lemon Herb Chicken',
    snack: 'Dark Chocolate & Almonds',
  },
  {
    day: 'Friday',
    breakfast: 'Veggie Omelette',
    lunch: 'Quinoa Power Bowl',
    dinner: 'Pasta Primavera',
    snack: 'Banana with Peanut Butter',
  },
  {
    day: 'Saturday',
    breakfast: 'Pancakes with Maple Syrup',
    lunch: 'Grilled Cheese & Tomato Soup',
    dinner: 'BBQ Salmon Skewers',
    snack: 'Fruit Salad',
  },
  {
    day: 'Sunday',
    breakfast: 'French Toast with Fresh Fruit',
    lunch: 'Mediterranean Platter',
    dinner: 'Roast Chicken with Herbs',
    snack: 'Trail Mix',
  },
];

export const groceryList = [
  { category: 'Produce', items: ['Spinach', 'Avocados (4)', 'Broccoli', 'Bell Peppers', 'Cherry Tomatoes', 'Lemons (3)'] },
  { category: 'Proteins', items: ['Salmon Fillet (2 lbs)', 'Chicken Breast (3 lbs)', 'Greek Yogurt (32oz)', 'Eggs (dozen)', 'Tofu (firm)'] },
  { category: 'Grains', items: ['Brown Rice', 'Quinoa', 'Whole Wheat Bread', 'Oats (rolled)', 'Pasta'] },
  { category: 'Dairy & Alternatives', items: ['Almond Milk', 'Cheddar Cheese', 'Butter'] },
  { category: 'Pantry', items: ['Olive Oil', 'Almond Butter', 'Hummus', 'Mixed Nuts', 'Chia Seeds'] },
];

export const nutritionData = [
  { day: 'Mon', calories: 1980, protein: 82, carbs: 210, fat: 65 },
  { day: 'Tue', calories: 2100, protein: 90, carbs: 230, fat: 70 },
  { day: 'Wed', calories: 1850, protein: 78, carbs: 195, fat: 60 },
  { day: 'Thu', calories: 2050, protein: 88, carbs: 220, fat: 68 },
  { day: 'Fri', calories: 1920, protein: 84, carbs: 205, fat: 63 },
  { day: 'Sat', calories: 2200, protein: 95, carbs: 240, fat: 75 },
  { day: 'Sun', calories: 2000, protein: 86, carbs: 215, fat: 66 },
];

export const aiRecommendations = [
  {
    id: '1',
    type: 'swap',
    title: 'Healthier Swap',
    description: 'Replace white rice with cauliflower rice to save 150 calories per serving.',
    impact: '-150 cal',
    color: 'green',
  },
  {
    id: '2',
    type: 'waste',
    title: 'Reduce Food Waste',
    description: 'You have leftover roasted vegetables — add them to Wednesday\'s omelette.',
    impact: 'Save $4',
    color: 'amber',
  },
  {
    id: '3',
    type: 'quick',
    title: 'Quick Meal',
    description: 'Busy Thursday? Try 15-min sheet pan shrimp fajitas — all ingredients in stock.',
    impact: '15 min',
    color: 'blue',
  },
  {
    id: '4',
    type: 'nutrition',
    title: 'Nutrition Insight',
    description: 'Sam\'s calcium intake is low this week. Add fortified oat milk to breakfast.',
    impact: '+20% Ca',
    color: 'green',
  },
];

export const testimonials = [
  {
    name: 'Sarah M.',
    role: 'Mother of 3',
    avatar: 'S',
    text: 'NutriNest AI has completely transformed how our family eats. We save 3 hours a week on meal planning and have cut our grocery bill by 20%.',
    rating: 5,
  },
  {
    name: 'David K.',
    role: 'Working Dad',
    avatar: 'D',
    text: 'The AI suggestions are spot on. It knows my kids hate broccoli and always finds creative ways to sneak in vegetables. Brilliant product.',
    rating: 5,
  },
  {
    name: 'Priya L.',
    role: 'Nutritionist & Mom',
    avatar: 'P',
    text: 'As a nutritionist I was skeptical, but the macro tracking and allergen management is genuinely impressive. I recommend it to my clients.',
    rating: 5,
  },
];
