import { z } from 'zod';
import { FeedbackSchema } from '../domain/feedback';
import type { FeedbackPost } from '../domain/feedback';
export type { FeedbackPost } from '../domain/feedback';
export function captureFeedbackOkt() {
  const value = new URLSearchParams(location.search).get('okt');
  if (value) { try { localStorage.setItem('vikingspill_feedback_okt', value.trim().slice(0, 40)); } catch { /* The optional label is not needed to play. */ } }
}
export function saveFeedback(input: Omit<FeedbackPost, 'at' | 'id' | 'okt'>): FeedbackPost {
  const post = FeedbackSchema.parse({ ...input, id: crypto.randomUUID(), at: Date.now(), okt: localStorage.getItem('vikingspill_feedback_okt') ?? '' });
  const raw = localStorage.getItem('vikingspill_feedback_v2');
  const posts = raw ? z.array(FeedbackSchema).parse(JSON.parse(raw)) : [];
  localStorage.setItem('vikingspill_feedback_v2', JSON.stringify([...posts, post]));
  return post;
}
