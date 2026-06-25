import { NextResponse } from 'next/server';
import { anthropic, MODEL } from '@/lib/model';
import { safeParseJSON } from '@/lib/research-engine';
import { auth } from '@/lib/auth';

const EDIT_SYSTEM = `You are a diagram editor. The user provides current mxGraph XML and an edit instruction.
Call edit_diagram with the full updated mxGraph XML after applying the edit.

Rules:
- Preserve all existing cell IDs that are not being modified
- Only change what the instruction specifies
- Return complete valid XML — never partial fragments
- Keep all cell IDs as unique integers; new cells get IDs higher than any existing ID
- Use Chinese text for labels when the request is in Chinese
- Maintain layout constraints: keep elements within x=20-880, y=20-480
- For edge modifications: always specify exitX, exitY, entryX, entryY in style
- When adding nodes to architecture diagrams: place them in the appropriate layer/container
- If tool calling is unavailable, return pure JSON object: {"xml":"...","summary":"..."}`;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { currentXml, instruction } = await req.json() as {
    currentXml: string;
    instruction: string;
  };

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: EDIT_SYSTEM,
    tools: [
      {
        name: 'edit_diagram',
        description: 'Return the updated full mxGraph XML after applying edits',
        input_schema: {
          type: 'object' as const,
          properties: {
            xml: { type: 'string', description: 'Complete updated mxGraph XML' },
            summary: { type: 'string', description: 'One-line description of changes made' },
          },
          required: ['xml'],
        },
      },
    ],
    tool_choice: { type: 'any' },
    messages: [
      {
        role: 'user',
        content: `Current XML:\n${currentXml}\n\nEdit instruction: ${instruction}`,
      },
    ],
  });

  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === 'edit_diagram') {
      const input = block.input as { xml: string; summary?: string };
      return NextResponse.json({ xml: input.xml, summary: input.summary ?? '' });
    }
  }

  const raw = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: string; text: string }).text)
    .join('\n');
  const parsed = safeParseJSON(raw) as { xml?: string; summary?: string } | null;
  if (parsed?.xml) {
    return NextResponse.json({ xml: parsed.xml, summary: parsed.summary ?? '' });
  }

  return NextResponse.json({ error: 'No edit produced' }, { status: 500 });
}
