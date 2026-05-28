// ── Supabase Edge Function SSE 스트리밍 클라이언트 ─────────────────
// generate-with-timely Edge Function에 요청을 보내고
// Server-Sent Events(SSE)로 스트리밍 응답을 처리합니다.
//
// 지원 응답 형식:
//   1. Timely 네이티브: { type: 'token' | 'thinking', content: '...' }
//   2. OpenAI 호환:    { choices: [{ delta: { content, reasoning_content } }] }
//   3. 폴백:           { message: '...' }
export async function callAPI(
  sessionId: string,
  system: string,
  msgs: Array<{ role: string; content: string }>,
  model: string,
  onChunk: (chunk: string, type: 'content' | 'thinking') => void,
): Promise<void> {
  // ── 환경 변수 검증 ─────────────────────────────────────────────
  const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase 설정 누락');

  // ── API 요청 ───────────────────────────────────────────────────
  const res = await fetch(`${url}/functions/v1/generate-with-timely`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, apikey: key },
    body: JSON.stringify({ sessionId, model, instructions: system, messages: msgs, stream: true, thinking: true }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `HTTP ${res.status}`);
  }
  if (!res.body) throw new Error('No response body');

  // ── SSE 스트림 읽기 ────────────────────────────────────────────
  // 줄 단위로 파싱하며 불완전한 줄은 buf에 보관합니다.
  const reader = res.body.getReader();
  const dec = new TextDecoder('utf-8');
  let done = false;
  let buf = '';
  while (!done) {
    const { value, done: d } = await reader.read();
    done = d;
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() || '';

    // ── SSE 이벤트 파싱 ─────────────────────────────────────────
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const s = line.slice(6).trim();
      if (!s || s === '[DONE]') continue;
      try {
        const p = JSON.parse(s);
        // Timely 네이티브 형식
        if (p.type === 'token') {
          onChunk(p.content, 'content');
        } else if (p.type === 'thinking') {
          onChunk(p.content, 'thinking');
        // OpenAI 호환 형식
        } else if (p.choices?.[0]?.delta) {
          const d = p.choices[0].delta;
          if (d.content) onChunk(d.content, 'content');
          if (d.reasoning_content) onChunk(d.reasoning_content, 'thinking');
        // 폴백 형식
        } else if (typeof p.message === 'string') {
          onChunk(p.message, 'content');
        }
      } catch { /* 불완전한 JSON 청크 무시 */ }
    }
  }
}
