export const QUOTES = [
  "The quieter you become, the more you can hear.",
  "Not all those who wander are lost.",
  "What you seek is seeking you.",
  "In the middle of difficulty lies opportunity.",
  "The present moment always will have been.",
  "Sit quietly, and the world will reveal itself.",
  "You are enough, exactly as you are.",
  "The soul always knows what it needs to heal.",
  "Let go of what you think life should look like.",
  "Be still and let the mud settle.",
  "You don't have to be everything today.",
  "Small steps still move you forward.",
  "Rest is not a reward. It is a right.",
  "Feelings are visitors. Let them come and go.",
  "What is essential is invisible to the eye.",
  "The cave you fear to enter holds the treasure you seek.",
  "Nothing is permanent. Not even this.",
  "Pay attention. That is the whole of it.",
  "Simplicity is the ultimate sophistication.",
  "The only way out is through.",
  "Your sensitivity is not a weakness.",
  "There is nowhere you need to get to.",
  "Breathe. You have survived every hard day so far.",
  "What we resist, persists.",
  "Begin again, and again, and again.",
  "You are allowed to take up space.",
  "The mind is a garden. Choose what you grow.",
  "Do less. Mean more.",
  "A quiet life is a rich life.",
  "One breath at a time is enough.",
  "You do not have to earn your rest.",
  "Autumn knows how to let go. So can you.",
  "Write it down before it slips away.",
  "The truth will not hurt you as much as the hiding.",
  "Something good is still possible.",
  "Not knowing is the beginning of wisdom.",
  "Let your life be the answer.",
  "What matters most is how you walk through the fire.",
  "Today is enough.",
  "Your mind is a home. Keep it kind.",
  "The work of the heart is never wasted.",
  "Softness is its own kind of strength.",
  "Less noise. More signal.",
  "You are not behind. You are exactly where you are.",
  "A river doesn't fight the current. It is the current.",
  "The moment you have right now is irreplaceable.",
  "What are you avoiding by staying busy?",
  "Hold your plans loosely.",
  "Even grief is a form of love.",
  "There is wisdom in slowness.",
  "You came here to notice things.",
  "Tend to what is in front of you.",
  "Let it be imperfect. Let it be real.",
  "What you feel is information. Listen.",
  "The ordinary is extraordinary, if you look closely.",
  "Wonder is available in the smallest of things.",
  "You are the only one who can write this story.",
  "Kindness to yourself is where it starts.",
  "There is still so much beauty left to see.",
  "Every end is also a beginning.",
];

export const TAGS = ['life', 'gratitude', 'honesty', 'reflection'];

export function getDailyQuote(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return QUOTES[dayOfYear % QUOTES.length];
}

export function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export function formatFullDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
