const CIRCUIT_NOTE = 'PF 30-min express circuit: alternate machine (60 sec) → step platform (60 sec). Follow the lights. Keep moving on steps. Inhaler accessible at all times.'
const TREADMILL_NOTE = 'Incline 3–5, speed 2.5–3.5 mph. Inhaler on the machine. Arms swing naturally. This is your warm-up AND primary cardio.'
const BIKE_NOTE = 'Moderate effort RPE 5–6/10. Bridges treadmill into the session. Keep pace steady.'
const AB_NOTE = 'PF 12-min ab circuit: follow the dedicated core machines in sequence. Controlled reps — core work is about tension, not speed.'

export const WORKOUTS = [
  {
    name: 'Workout A — Monday', subtitle: 'Cardio + 30-Min Circuit + Upper Push · ~80 min',
    color: '#00c896', day: 'Monday',
    exercises: [
      { name: '🏃 Treadmill Incline Walk', sets: '20 min', note: TREADMILL_NOTE },
      { name: '🚴 Stationary Bike', sets: '10 min', note: BIKE_NOTE },
      { name: '🔄 PF 30-Min Express Circuit', sets: '1 full loop', note: CIRCUIT_NOTE },
      { name: '— Upper Push Add-On —', sets: 'Rest 3–5 min', note: 'Water. Breathing check. Skip add-on if asthma is acting up — circuit alone is enough.' },
      { name: 'Seated Chest Press Machine', sets: '2 × 12 reps', note: 'Shoulder blades pinched back. Slow return 2 sec.' },
      { name: 'Shoulder Press Machine', sets: '2 × 12 reps', note: 'Full range — lower to ear level. Breathe out on push.' },
      { name: 'Tricep Pushdown (cable)', sets: '2 × 12 reps', note: 'Elbows pinned at sides. Full extension, squeeze 1 sec.' },
      { name: 'Plank Hold', sets: '2 × 30 sec', note: 'Hips level. Build toward 60 sec over 6 weeks.' },
      { name: 'Cool-Down + Stretch', sets: '5 min', note: 'Let HR settle fully before leaving.' },
    ]
  },
  {
    name: 'Workout B — Tuesday', subtitle: 'Cardio + 12-Min Ab Circuit · ~55 min',
    color: '#3b82f6', day: 'Tuesday',
    exercises: [
      { name: '🏃 Treadmill Incline Walk', sets: '25 min', note: 'Incline 4–6 today. Push harder since no circuit follows.' },
      { name: '🚴 Stationary Bike', sets: '15 min', note: 'RPE 6/10. Building cardiovascular base.' },
      { name: '🔵 PF 12-Min Ab Circuit', sets: '1 full loop', note: AB_NOTE },
      { name: 'Dead Bug', sets: '3 × 10 reps', note: 'Back FLAT to floor. Opposite arm + leg, slow and controlled.' },
      { name: 'Bird Dog', sets: '3 × 10 per side', note: 'All fours. Hold 2 sec. Hips stay square.' },
      { name: 'Cool-Down + Stretch', sets: '5 min', note: "Child's pose · Seated hamstring · Hip flexor lunge." },
    ]
  },
  {
    name: 'Workout C — Wednesday', subtitle: 'Cardio + 30-Min Circuit + Lower Body · ~80 min',
    color: '#8b5cf6', day: 'Wednesday',
    exercises: [
      { name: '🏃 Treadmill Incline Walk', sets: '20 min', note: TREADMILL_NOTE },
      { name: '🚴 Stationary Bike', sets: '10 min', note: BIKE_NOTE },
      { name: '🔄 PF 30-Min Express Circuit', sets: '1 full loop', note: CIRCUIT_NOTE },
      { name: '— Lower Body Add-On —', sets: 'Rest 3–5 min', note: 'Legs are warm from circuit. Now load deliberately.' },
      { name: 'Leg Press Machine', sets: '2 × 12 reps', note: 'Press through heels. 2 sec slow return. Never lock knees.' },
      { name: 'Goblet Squat (dumbbell)', sets: '2 × 10 reps', note: 'Slow descent — as deep as comfortable. Drive through heels.' },
      { name: 'Standing Calf Raises', sets: '2 × 15 reps', note: 'Slow up 2 sec, hold 1 sec, slow down 2 sec.' },
      { name: 'Dead Bug', sets: '2 × 10 reps', note: 'Core finisher. Back flat.' },
      { name: 'Cool-Down + Stretch', sets: '5 min', note: 'Quad · Hamstring · Hip flexor.' },
    ]
  },
  {
    name: 'Workout D — Thursday', subtitle: 'Cardio + 12-Min Ab Circuit · ~55 min',
    color: '#f59e0b', day: 'Thursday',
    exercises: [
      { name: '🏃 Treadmill Incline Walk', sets: '25 min', note: 'Second dedicated cardio day. Match or exceed Tuesday.' },
      { name: '🚴 Stationary Bike', sets: '15 min', note: 'RPE 6/10. Cardiovascular fitness improves session by session.' },
      { name: '🔵 PF 12-Min Ab Circuit', sets: '1 full loop', note: AB_NOTE },
      { name: 'Plank Hold', sets: '3 × 30 sec', note: 'Build toward 60 sec.' },
      { name: 'Russian Twists', sets: '3 × 12 reps', note: '5–10 lb dumbbell. TORSO rotates — not just arms.' },
      { name: 'Cool-Down + Stretch', sets: '5 min', note: 'Chest opener · Shoulder rolls · Calf stretch.' },
    ]
  },
  {
    name: 'Workout E — Friday', subtitle: 'Cardio + 30-Min Circuit + Upper Pull · ~80 min',
    color: '#ef4444', day: 'Friday',
    exercises: [
      { name: '🏃 Treadmill Incline Walk', sets: '20 min', note: TREADMILL_NOTE + ' End of work week — keep going.' },
      { name: '🚴 Stationary Bike', sets: '10 min', note: BIKE_NOTE },
      { name: '🔄 PF 30-Min Express Circuit', sets: '1 full loop', note: CIRCUIT_NOTE },
      { name: '— Upper Pull Add-On —', sets: 'Rest 3–5 min', note: 'Back and biceps warm from circuit row. Now pull with focus.' },
      { name: 'Lat Pulldown Machine', sets: '2 × 12 reps', note: 'Pull to upper chest. Squeeze shoulder blades at bottom.' },
      { name: 'Seated Cable Row', sets: '2 × 12 reps', note: 'Elbows drive BACK. Squeeze hard. Back straight.' },
      { name: 'Dumbbell Bicep Curls', sets: '2 × 12 reps', note: 'Elbows pinned. Slow on the way DOWN (3 sec).' },
      { name: 'Face Pulls (cable)', sets: '2 × 15 reps', note: 'Cable at head height. Light weight, high control.' },
      { name: 'Cool-Down + Stretch', sets: '5 min', note: '5 days done. One more tomorrow.' },
    ]
  },
  {
    name: 'Workout F — Saturday', subtitle: 'Cardio + 12-Min Ab Circuit · ~45 min',
    color: '#52b788', day: 'Saturday',
    exercises: [
      { name: '🏃 Treadmill Incline Walk', sets: '20 min', note: 'Incline 3–4. Comfortable effort — active recovery.' },
      { name: '🚴 Stationary Bike', sets: '10 min', note: 'Easy RPE 5/10. Flush the legs.' },
      { name: '🔵 PF 12-Min Ab Circuit', sets: '1 full loop', note: AB_NOTE + ' Saturday — comfortable pace.' },
      { name: 'Full Body Stretch', sets: '10 min', note: 'Quad · Hamstring · Hip flexor · Chest · Lat · Child\'s pose · Calf. Both sides. This is the most important 10 min of your week.' },
    ]
  },
]
