export const RECIPES = [
  {
    emoji: '🥣', name: 'Oats', sub: '6 rotations · Prep 5 jars Sunday',
    prepNote: 'All 6 share the same base. Prep base in all 5 jars first, then add toppings. Refrigerate minimum 6 hours. Grab and go — zero cooking on weekdays.',
    variants: [
      {
        name: '🍌 Banana Peanut Butter', macros: '~420 kcal · 22g protein · 52g carbs · 14g fat',
        ingredients: [
          { amt: '½ cup (40g)', name: 'Rolled oats — Old Fashioned', store: '🔵 Costco', price: '~$0.18/jar' },
          { amt: '½ cup (120g)', name: 'Greek yogurt, plain', store: '🔵 Costco', price: '~$0.65/jar' },
          { amt: '½ cup (120ml)', name: 'Oat milk', store: '🔵 Costco', price: '~$0.20/jar' },
          { amt: '1 medium', name: 'Banana, mashed', store: '🟢 Walmart', price: '~$0.25' },
          { amt: '2 tbsp', name: 'Peanut butter natural', store: '🔵 Costco', price: '~$0.30' },
          { amt: '½ tsp', name: 'Vanilla extract', store: '🟣 Pantry', price: '' },
          { amt: '1 tsp', name: 'Honey', store: '🟢 Walmart', price: '' },
          { amt: '1 tsp', name: 'Chia seeds', store: '🔵 Costco', price: '~$0.10 · 🔴 blood sugar stabilizer' },
        ],
        steps: ['Add oats, yogurt, and milk to mason jar — stir well', 'Mash banana directly into jar and mix thoroughly', 'Stir in peanut butter, vanilla extract, and honey', 'Add chia seeds — stir once more', 'Seal jar, refrigerate overnight (minimum 6h)', 'Morning: grab from fridge. No cooking, no prep.'],
      },
      {
        name: '🥭 Mango Coconut', macros: '~390 kcal · 18g protein · 55g carbs · 10g fat',
        ingredients: [
          { amt: '½ cup', name: 'Rolled oats', store: '🔵 Costco', price: '' },
          { amt: '½ cup', name: 'Greek yogurt', store: '🔵 Costco', price: '' },
          { amt: '½ cup', name: 'Coconut milk (light)', store: '🟢 Walmart', price: '' },
          { amt: '½ cup', name: 'Mango chunks, fresh or frozen', store: '🟡 Colmado', price: '' },
          { amt: '1 tbsp', name: 'Shredded coconut unsweetened', store: '🟢 Walmart', price: '' },
          { amt: '1 tbsp', name: 'Honey', store: '🟣 Pantry', price: '' },
        ],
        steps: ['Combine oats, yogurt, coconut milk in jar', 'Add mango chunks and honey', 'Top with shredded coconut', 'Refrigerate 6h minimum'],
      },
      {
        name: '🍫 Chocolate PB', macros: '~430 kcal · 23g protein · 48g carbs · 16g fat',
        ingredients: [
          { amt: '½ cup', name: 'Rolled oats', store: '🔵 Costco', price: '' },
          { amt: '½ cup', name: 'Greek yogurt', store: '🔵 Costco', price: '' },
          { amt: '½ cup', name: 'Oat milk', store: '🔵 Costco', price: '' },
          { amt: '½ tbsp', name: 'Cocoa powder unsweetened', store: '🟢 Walmart', price: '' },
          { amt: '2 tbsp', name: 'Peanut butter', store: '🔵 Costco', price: '' },
          { amt: '½', name: 'Banana, mashed', store: '🟢 Walmart', price: '' },
          { amt: '1 tbsp', name: 'Honey', store: '🟣 Pantry', price: '' },
        ],
        steps: ['Whisk cocoa powder into oat milk first (prevents clumps)', 'Add oats and yogurt, stir well', 'Mash banana in, add PB and honey', 'Refrigerate overnight — tastes like dessert'],
      },
      {
        name: '🍓 Strawberry Vanilla', macros: '~380 kcal · 19g protein · 50g carbs · 11g fat',
        ingredients: [
          { amt: '½ cup', name: 'Rolled oats', store: '🔵 Costco', price: '' },
          { amt: '½ cup', name: 'Greek yogurt', store: '🔵 Costco', price: '' },
          { amt: '½ cup', name: 'Almond milk', store: '🔵 Costco', price: '' },
          { amt: '½ cup', name: 'Strawberries, sliced', store: '🟢 Walmart', price: '' },
          { amt: '1 tsp', name: 'Vanilla extract', store: '🟣 Pantry', price: '' },
          { amt: '1 tbsp', name: 'Honey', store: '🟣 Pantry', price: '' },
        ],
        steps: ['Combine oats, yogurt, milk, vanilla, honey', 'Fold in sliced strawberries', 'Refrigerate overnight'],
      },
      {
        name: '🥜 PB Banana Honey', macros: '~440 kcal · 24g protein · 54g carbs · 15g fat',
        ingredients: [
          { amt: '½ cup', name: 'Rolled oats', store: '🔵 Costco', price: '' },
          { amt: '½ cup', name: 'Greek yogurt', store: '🔵 Costco', price: '' },
          { amt: '½ cup', name: 'Oat milk', store: '🔵 Costco', price: '' },
          { amt: '1 large', name: 'Banana, mashed', store: '🟢 Walmart', price: '' },
          { amt: '3 tbsp', name: 'Peanut butter', store: '🔵 Costco', price: '' },
          { amt: '1.5 tbsp', name: 'Honey', store: '🟣 Pantry', price: '' },
          { amt: 'Pinch', name: 'Sea salt', store: '🟣 Pantry', price: '' },
        ],
        steps: ['Mash banana into oat milk first', 'Add oats, yogurt, PB, honey, sea salt', 'Stir vigorously — dense and filling', 'Refrigerate overnight'],
      },
      {
        name: '🫐 Blueberry Almond', macros: '~400 kcal · 20g protein · 52g carbs · 12g fat',
        ingredients: [
          { amt: '½ cup', name: 'Rolled oats', store: '🔵 Costco', price: '' },
          { amt: '½ cup', name: 'Greek yogurt', store: '🔵 Costco', price: '' },
          { amt: '½ cup', name: 'Almond milk', store: '🔵 Costco', price: '' },
          { amt: '½ cup', name: 'Blueberries frozen', store: '🟢 Walmart', price: '' },
          { amt: '2 tbsp', name: 'Slivered almonds', store: '🟢 Walmart', price: '' },
          { amt: '1 tbsp', name: 'Honey', store: '🟣 Pantry', price: '' },
        ],
        steps: ['Add frozen blueberries directly to jar (they thaw overnight)', 'Add oats, yogurt, milk, honey', 'Top with almonds', 'Refrigerate overnight'],
      },
    ],
  },
  {
    emoji: '🍛', name: 'Main Meals', sub: 'Lunch · High protein PR staples',
    variants: [
      {
        name: 'Pollo al Sofrito + Arroz', macros: '~520 kcal · 42g protein · 48g carbs · 12g fat',
        ingredients: [
          { amt: '6 oz', name: 'Chicken thighs boneless', store: '🔵 Costco', price: '' },
          { amt: '2 tbsp', name: 'Sofrito', store: '🟡 Colmado', price: '' },
          { amt: '1 tsp', name: 'Sazon con culantro', store: '🟢 Walmart', price: '' },
          { amt: '1 tsp', name: 'Adobo', store: '🟣 Pantry', price: '' },
          { amt: '½ cup dry', name: 'Brown rice', store: '🔵 Costco', price: '' },
          { amt: 'To taste', name: 'Pique criollo', store: '🟡 Colmado', price: '' },
        ],
        steps: ['Season chicken with sazon and adobo', 'Heat olive oil over medium-high, sear chicken 4 min each side', 'Add sofrito, stir and cook 2 min', 'Add ¼ cup water, cover and simmer 18 min low heat', 'Serve over ½ cup cooked brown rice with pique'],
      },
      {
        name: 'Turkey & Black Bean Bowl', macros: '~490 kcal · 45g protein · 42g carbs · 11g fat',
        ingredients: [
          { amt: '5 oz', name: 'Ground turkey 93/7', store: '🔵 Costco', price: '' },
          { amt: '½ cup', name: 'Black beans, rinsed', store: '🟢 Walmart', price: '' },
          { amt: '¼ cup', name: 'Fire roasted tomatoes', store: '🟢 Walmart', price: '' },
          { amt: '½ cup cooked', name: 'Brown rice', store: '🔵 Costco', price: '' },
          { amt: '¼', name: 'Aguacate', store: '🟡 Colmado', price: '' },
        ],
        steps: ['Brown turkey with garlic and minced onion', 'Season with cumin, paprika, adobo', 'Add beans and fire roasted tomatoes, simmer 8 min', 'Serve over rice, top with sliced aguacate'],
      },
      {
        name: 'Tuna Wrap con Aguacate', macros: '~420 kcal · 38g protein · 38g carbs · 10g fat',
        ingredients: [
          { amt: '1 can (5oz)', name: 'Tuna in water, drained', store: '🟢 Walmart', price: '' },
          { amt: '¼', name: 'Aguacate, mashed', store: '🟡 Colmado', price: '' },
          { amt: '1', name: 'Whole wheat tortilla', store: '🟢 Walmart', price: '' },
          { amt: '1 cup', name: 'Baby spinach', store: '🔵 Costco', price: '' },
          { amt: '½', name: 'Lime, juice', store: '🟡 Colmado', price: '' },
        ],
        steps: ['Mix tuna with mashed aguacate and lime juice', 'Season with salt, pepper, optional pique', 'Lay spinach on tortilla, add tuna mix', 'Roll tight and slice in half'],
      },
    ],
  },
  {
    emoji: '🍎', name: 'Snacks', sub: 'Under 250 kcal · Portioned',
    variants: [
      { name: '⚠️ Pre-Workout: Banana + PB', macros: '~240 kcal · 8g protein — MANDATORY on gym days', ingredients: [], steps: ['Eat 45–60 min before gym', 'Banana + 2 tbsp peanut butter', 'If hypoglycemic — glucose tabs in bag regardless'] },
      { name: 'Greek Yogurt + Fruit', macros: '~180 kcal · 15g protein', ingredients: [], steps: ['½ cup plain Greek yogurt', 'Top with ½ cup fresh fruit', 'Optional: drizzle 1 tsp honey'] },
      { name: 'Hard Boiled Eggs', macros: '~140 kcal · 12g protein', ingredients: [], steps: ['Boil 6 eggs Sunday for the week', 'Store in fridge in their shells', '2 eggs = 1 snack serving. Season with adobo.'] },
      { name: 'Apple + Peanut Butter', macros: '~200 kcal · 7g protein', ingredients: [], steps: ['1 medium apple, sliced', '1.5 tbsp peanut butter for dipping', 'High fiber — good for blood sugar stability'] },
    ],
  },
  {
    emoji: '🌙', name: 'Dinner', sub: 'Post-workout recovery · Eat by 8:30pm gym days',
    variants: [
      {
        name: 'Post-Workout Recovery Bowl', macros: '~480 kcal · 42g protein · 44g carbs · 10g fat',
        ingredients: [
          { amt: '6 oz', name: 'Chicken breast or thighs', store: '🔵 Costco', price: '' },
          { amt: '1 bag', name: 'Tattooed Chef roasted veggies', store: '🟢 Walmart', price: '' },
          { amt: '½ cup cooked', name: 'Brown rice', store: '🔵 Costco', price: '' },
          { amt: 'To taste', name: 'Pique criollo', store: '🟡 Colmado', price: '' },
        ],
        steps: ['Prep chicken before gym — season and refrigerate', 'When home: oven to 400°F, sheet pan veggies 20 min', 'Reheat chicken in pan 3 min each side', 'Rice from cooker (prep Sunday batch)', 'Plate: rice + chicken + veggies + pique. Eat within 30 min of getting home.'],
      },
      {
        name: 'Bacalao con Guineos', macros: '~440 kcal · 38g protein · 40g carbs · 10g fat',
        ingredients: [
          { amt: '5 oz', name: 'Bacalao (salt cod)', store: '🟡 Colmado', price: '' },
          { amt: '2 medium', name: 'Green bananas (guineos)', store: '🟡 Colmado', price: '' },
          { amt: '2 tbsp', name: 'Olive oil', store: '🟣 Pantry', price: '' },
          { amt: '2 cloves', name: 'Garlic, minced', store: '🟡 Colmado', price: '' },
          { amt: '¼ cup', name: 'Onion, sliced', store: '🟡 Colmado', price: '' },
        ],
        steps: ['Soak bacalao in cold water 30 min, drain and change water once', 'Boil green bananas whole in salted water 20 min until tender', 'Flake fish, sauté with olive oil, garlic, and onion 5 min', 'Peel bananas, slice, combine with fish', 'Serve hot with a side salad'],
      },
      {
        name: 'Chuleta al Horno + Chayote', macros: '~460 kcal · 40g protein · 20g carbs · 22g fat',
        ingredients: [
          { amt: '6 oz', name: 'Pork chop, boneless', store: '🟢 Walmart', price: '' },
          { amt: '2 medium', name: 'Chayote, cubed', store: '🟡 Colmado', price: '' },
          { amt: '1 tsp', name: 'Adobo', store: '🟣 Pantry', price: '' },
          { amt: '1 tsp', name: 'Garlic powder', store: '🟣 Pantry', price: '' },
        ],
        steps: ['Season pork with adobo and garlic powder', 'Toss chayote cubes with olive oil and salt', 'Oven 400°F: chop 22 min, chayote 20 min on same pan', 'Rest meat 3 min before cutting'],
      },
    ],
  },
]
