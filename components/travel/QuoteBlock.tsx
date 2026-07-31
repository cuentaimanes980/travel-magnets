export function QuoteBlock({ quote, attribution }: { quote: string; attribution: string }) { return <figure className="quote"><blockquote>“{quote}”</blockquote><cite>{attribution}</cite></figure>; }
