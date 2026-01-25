import { setupSSEConnection } from "@/lib/realtime-service";
import { getAuthUser } from "@/lib/auth-server";
export { dynamic } from "@/lib/api-runtime";

export async function GET(req) {
  // Get authenticated user
  const user = await getAuthUser(req);
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Create SSE connection
  return new Response(
    new ReadableStream({
      start(controller) {
        setupSSEConnection(user.id, {
          write: (data) => {
            controller.enqueue(new TextEncoder().encode(data));
          },
          on: (event, handler) => {
            // Handle connection events if needed
          },
          close: () => {
            controller.close();
          }
        });
      }
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    }
  );
}
