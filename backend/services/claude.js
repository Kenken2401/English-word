import Anthropic from '@anthropic-ai/sdk';

export async function enrichWord(word) {
  if (!process.env.ANTHROPIC_API_KEY) {
    const err = new Error('ANTHROPIC_API_KEY is not configured');
    err.status = 503;
    throw err;
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    system: 'You are a C2-level English vocabulary expert. Return JSON only.',
    messages: [
      {
        role: 'user',
        content: `Provide detailed information for the word: ${word}\n\nReturn JSON with this exact structure:\n{\n  "part_of_speech": "...",\n  "definition": "clear, comprehensive definition",\n  "prepositions": [{"prep": "...", "use": "...", "example": "..."}],\n  "grammar_notes": "...",\n  "examples": ["sentence1", "sentence2"]\n}`
      }
    ],
    output_config: {
      format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            part_of_speech: { type: 'string' },
            definition: { type: 'string' },
            prepositions: { type: 'array' },
            grammar_notes: { type: 'string' },
            examples: { type: 'array' }
          },
          required: ['part_of_speech', 'definition', 'prepositions', 'grammar_notes', 'examples'],
          additionalProperties: false
        }
      }
    }
  });

  const textBlock = response.content.find(block => block.type === 'text');
  if (!textBlock) {
    throw new Error('No text content in Claude response');
  }

  try {
    return JSON.parse(textBlock.text);
  } catch (e) {
    throw new Error('Failed to parse Claude response as JSON: ' + e.message);
  }
}
