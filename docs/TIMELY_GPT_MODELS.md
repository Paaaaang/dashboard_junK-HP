# Timely GPT SDK: Native vs Bridge Models

Timely GPT provides access to a variety of LLM models. However, the way you connect to them differs based on the model provider. 

## 1. Native Models
These are models hosted or directly provided by Timely GPT (such as `gpt-5.1` or other default models).

- **Endpoint URL**: `https://hello.timelygpt.co.kr/api/v2/chat/completions`
- **Authentication Header**: `x-timely-api: <API_KEY>`
- **Payload Format**: Uses Timely's custom schema (e.g., `sessionId`, `instructions`, `messages`).

## 2. Bridge Models (OpenAI Compatible)
Timely GPT also acts as a proxy/bridge to models hosted by external providers (like Anthropic, Google, xAI, etc.) via OpenRouter or similar services. Examples include:
- `anthropic/claude-opus-4.7`
- `google/gemini-3-flash-preview`
- `openai/gpt-4o-mini`

- **Endpoint URL**: `https://hello.timelygpt.co.kr/api/v2/chat/bridge/openai/chat/completions`
- **Authentication Header**: `Authorization: Bearer <API_KEY>`
- **Payload Format**: Strictly adheres to the **OpenAI Chat Completions API standard** (e.g., `system` role messages instead of an `instructions` field, no `sessionId`).

---

### Implementation in Supabase Edge Function
To support both seamlessly from a single frontend request, our Edge Function (`generate-with-timely/index.ts`) dynamically detects the model type and routes the request accordingly:

```typescript
const isBridgeModel = body.model.includes('/') || body.model.includes('claude');

if (isBridgeModel) {
  // 1. Point to the Bridge URL
  endpointUrl = "https://hello.timelygpt.co.kr/api/v2/chat/bridge/openai/chat/completions";
  headers["Authorization"] = `Bearer ${apiKey}`;
  
  // 2. Convert Timely payload -> OpenAI Payload
  const openaiMessages = [];
  if (body.instructions) {
    openaiMessages.push({ role: "system", content: body.instructions });
  }
  openaiMessages.push(...body.messages);

  payload = {
    model: body.model,
    messages: openaiMessages,
    stream: body.stream || false,
  };
} else {
  // Use Native Timely URL and Payload
  // ...
}
```

This routing logic ensures that developers can select any model (Native or Bridge) from the UI dropdown without needing to manage the underlying API specifications.