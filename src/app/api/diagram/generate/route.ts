import { NextResponse } from 'next/server';
import { anthropic, MODEL } from '@/lib/model';
import { safeParseJSON } from '@/lib/research-engine';
import { auth } from '@/lib/auth';

const DIAGRAM_SYSTEM = `You are a professional diagram architect. Generate complete, valid mxGraphModel XML for draw.io diagrams.

## XML FORMAT
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <!-- shapes and edges here -->
  </root>
</mxGraphModel>

## LAYOUT CONSTRAINTS
- Canvas: keep all elements within x=20-880, y=20-480 (fit 900x500 viewport)
- Start from margins (x=40, y=40), group related elements closely
- IDs: unique integers starting from 2 (0 and 1 are reserved)
- Set parent="1" for top-level shapes
- Space shapes 150-200px apart for clear edge routing
- Default cell size: 120x50 for standard nodes, 160x60 for service boxes

## EDGE ROUTING RULES
- Never let multiple edges share the same path — use different exitY/entryY values
- For bidirectional connections (A↔B), use OPPOSITE sides
- Always specify exitX, exitY, entryX, entryY explicitly in edge style
- Use edgeStyle=orthogonalEdgeStyle for clean right-angle routing
- Add curved=1 for softer appearance

## STYLE REFERENCE
Shapes:
- Rectangle: rounded=1;whiteSpace=wrap;fillColor=#dae8fc;strokeColor=#6c8ebf;
- Rounded: rounded=1;arcSize=20;fillColor=#d5e8d4;strokeColor=#82b366;
- Diamond: rhombus;whiteSpace=wrap;fillColor=#fff2cc;strokeColor=#d6b656;
- Cylinder: shape=cylinder3;whiteSpace=wrap;fillColor=#f8cecc;strokeColor=#b85450;
- Cloud: ellipse;shape=cloud;whiteSpace=wrap;fillColor=#e1d5e7;strokeColor=#9673a6;
- Group/Container: swimlane;startSize=28;fillColor=#f5f5f5;strokeColor=#666666;fontStyle=1;
- Hexagon: shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;fillColor=#e6d0de;strokeColor=#996185;

Edges:
- Arrow: endArrow=classic;edgeStyle=orthogonalEdgeStyle;curved=1;strokeColor=#666666;
- Dashed: dashed=1;endArrow=classic;edgeStyle=orthogonalEdgeStyle;strokeColor=#999999;

Text:
- fontSize=12; fontStyle=1 (bold); align=center; verticalAlign=middle;

## DIAGRAM MODE STYLES

### architecture (MOST IMPORTANT — for system/cloud/service diagrams)
- Use swimlane containers to group by layer (Frontend / Backend / Data / External)
- Service boxes: rounded=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=11;fontStyle=1;
- Database: shape=cylinder3;fillColor=#f8cecc;strokeColor=#b85450;
- External/Cloud: ellipse;shape=cloud;fillColor=#e1d5e7;strokeColor=#9673a6;
- Queue/Message: shape=hexagon;perimeter=hexagonPerimeter2;fillColor=#fff2cc;strokeColor=#d6b656;
- Cache: shape=parallelogram;fillColor=#d5e8d4;strokeColor=#82b366;
- Layer containers: swimlane;startSize=28;fillColor=#f5f5f5;strokeColor=#666;fontStyle=1;collapsible=0;
- Arrange layers top-to-bottom or left-to-right with clear data flow arrows
- Label all arrows with protocol/action (HTTP, gRPC, pub/sub, SQL, etc.)

### flowchart
- Rounded rectangles for steps, diamonds for decisions, directional arrows
- Start/End: rounded=1;fillColor=#d5e8d4;strokeColor=#82b366;
- Process: rounded=1;fillColor=#dae8fc;strokeColor=#6c8ebf;
- Decision: rhombus;fillColor=#fff2cc;strokeColor=#d6b656;

### sequence
- Swimlanes per actor, horizontal message arrows labeled with actions

### er
- Entity rectangles with attribute lists inside, relation lines with cardinality labels

### mindmap
- Central oval for main topic, branch lines to child rectangles

### network
- Cylinder shapes for servers, cloud for internet, labeled connection lines

### orgchart
- Rectangle boxes for roles, top-down edges for reporting lines

## OUTPUT RULES
- Return complete, valid XML — never partial fragments
- Use Chinese text for labels when the request is in Chinese
- Also provide 3-5 bullets describing the key components/steps shown
- For architecture diagrams: include at least 8-15 nodes with clear layer grouping`;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { prompt, mode, currentXml } = await req.json() as {
    prompt: string;
    mode?: string;
    currentXml?: string;
  };

  const diagramMode = mode ?? 'flowchart';
  const userMessage = currentXml
    ? `Current diagram XML:\n${currentXml}\n\nUser request: ${prompt}`
    : `Create a ${diagramMode} diagram for: ${prompt}`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: DIAGRAM_SYSTEM,
    tools: [
      {
        name: 'display_diagram',
        description: 'Render a diagram with accompanying description bullets',
        input_schema: {
          type: 'object' as const,
          properties: {
            xml: { type: 'string', description: 'Complete mxGraph XML' },
            title: { type: 'string', description: 'Short diagram title' },
            bullets: {
              type: 'array',
              items: { type: 'string' },
              description: '3-5 key bullets describing the main components or steps',
            },
          },
          required: ['xml', 'bullets'],
        },
      },
    ],
    tool_choice: { type: 'any' },
    messages: [{ role: 'user', content: userMessage }],
  });

  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === 'display_diagram') {
      const input = block.input as { xml: string; title?: string; bullets?: string[] };
      return NextResponse.json({
        xml: input.xml,
        title: input.title ?? '',
        bullets: input.bullets ?? [],
      });
    }
  }

  const raw = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: string; text: string }).text)
    .join('\n');
  const parsed = safeParseJSON(raw) as { xml?: string; title?: string; bullets?: string[] } | null;
  if (parsed?.xml) {
    return NextResponse.json({
      xml: parsed.xml,
      title: parsed.title ?? '',
      bullets: Array.isArray(parsed.bullets) ? parsed.bullets : [],
    });
  }

  return NextResponse.json({ error: 'No diagram generated' }, { status: 500 });
}
