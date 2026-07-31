const monthNames = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${Number(day)} ${monthNames[Number(month) - 1]} ${year}`;
}

export function ChapterHeader({ dayNumber, title, summary, date, phase }: { dayNumber: number; title: string; summary: string; date: string; phase: string }) {
  return <header className="chapter-header"><span className="day-number">Día {dayNumber}</span><h2>{title}</h2><div className="chapter-meta"><time dateTime={date}>{formatDate(date)}</time><span>{phase}</span></div><p>{summary}</p></header>;
}
