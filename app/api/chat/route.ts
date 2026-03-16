export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const apiKey = process.env.ANYTHINGLLM_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANYTHINGLLM_API_KEY fehlt" }),
      { status: 500 },
    );
  }

  const lastMessage = messages[messages.length - 1];

  let content = "";

  if (typeof lastMessage.content === "string") {
    content = lastMessage.content;
  } else if (Array.isArray(lastMessage.parts)) {
    content = lastMessage.parts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("");
  }

  const response = await fetch(
    "https://anythingllm-czxnfnz9in2hdalbgvc87de8.cloud.webdesign-unger.de/api/v1/workspace/2heal/chat",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        message: content,
        mode: "chat",
      }),
    },
  );
  console.log(response);
  if (!response.ok) {
    const error = await response.text();

    return new Response(JSON.stringify({ error }), { status: response.status });
  }

  const data = await response.json();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "text-delta",
            textDelta: data.textResponse,
          })}\n\n`,
        ),
      );

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
