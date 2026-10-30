export type Question = { q: string; options: string[]; answer: number; explain: string };

export function score(questions: Question[], picks: (number | null)[]) {
  const correct = questions.filter((q, i) => picks[i] === q.answer).length;
  return { correct, total: questions.length, allCorrect: correct === questions.length };
}
