const examples = {
  Technology: 'technology tech programming developer coding software engineering robotics ai startup javascript python computing data',
  Workshop: 'workshop class beginner beginners learn tutorial training lesson practical hands-on course pottery photography',
  Hackathon: 'hackathon hack build prototype team coding sprint competition pitch demos challenge',
  Cultural: 'cultural culture music concert jazz dance theatre theater art gallery film exhibition festival poetry celebration',
  Sports: 'sports running marathon run football soccer fitness basketball yoga cycling tournament cricket outdoor athletics',
  Conference: 'conference summit expo convention networking panel talks speakers keynote industry seminar meetup',
};

type Intent = keyof typeof examples;
const categories = Object.keys(examples) as Intent[];

export function words(text: string): string[] {
  return text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

// Train a small multinomial classifier on labeled event vocabulary.
const training = categories.map(category => {
  const tokens = words(examples[category]);
  return { category, size: tokens.length, counts: new Map(tokens.map(token => [token, tokens.filter(word => word === token).length])) };
});
const vocabulary = new Set(training.flatMap(group => [...group.counts.keys()]));

export function inferEventIntent(text: string) {
  const tokens = [...new Set(words(text))].filter(word => vocabulary.has(word));
  if (!tokens.length) return null;
  const ranked = training.map(group => ({
    category: group.category,
    score: tokens.reduce((score, word) => score + Math.log(((group.counts.get(word) ?? 0) + 1) / (group.size + vocabulary.size)), 0),
  })).sort((a, b) => b.score - a.score);
  return ranked[0].score - ranked[1].score > .25 ? ranked[0].category : null;
}
