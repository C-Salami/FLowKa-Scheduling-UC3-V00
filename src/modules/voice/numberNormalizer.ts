const WORD2NUM: Record<string, number> = {
  zero:0, one:1, two:2, too:2, to:2, three:3, four:4, for:4, five:5, six:6, seven:7, eight:8, ate:8, nine:9, ten:10,
  eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15, sixteen:16, seventeen:17, eighteen:18, nineteen:19,
  twenty:20, thirty:30, forty:40, fifty:50, sixty:60, seventy:70, eighty:80, ninety:90
};

export function normalizeNumbers(input: string): string {
  return input
    .replace(/\b(next|coming)\s+mon(day)?\b/gi, 'next monday')
    .replace(/\b(two|too|to)\s+days\b/gi, '2 days')
    .replace(/\b(eight|ate)\s+hours\b/gi, '8 hours')
    .replace(/\b(zero|one|two|too|to|three|four|for|five|six|seven|eight|ate|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\b/gi,
      (m) => String(WORD2NUM[m.toLowerCase()] ?? m)
    );
}
