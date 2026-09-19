import { setupSSEConnection } from "@/lib/realtime-service";
import { getAuthUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "default-no-store";

export async function GET(req) {
  // Get authenticated user
  const user = await getAuthUser(req);
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  let closeListener = null;

  // Create SSE connection
  return new Response(
    new ReadableStream({
      start(controller) {
        setupSSEConnection(user.id, {
          write: (data) => {
            try {
              controller.enqueue(new TextEncoder().encode(data));
            } catch (e) {
              // Stream closed
            }
          },
          on: (event, handler) => {
            if (event === 'close') {
              closeListener = handler;
            }
          },
          close: () => {
            try {
              controller.close();
            } catch (e) {}
          }
        });
      },
      cancel() {
        if (closeListener) {
          try {
            closeListener();
          } catch (e) {}
        }
      }
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    }
  );
}
