export default {
  async fetch(request, env) {

    // CORS
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: cors
      });
    }

    try {

      const body = await request.json();

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",

          headers: {
            "Authorization": `Bearer ${env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },

          body: JSON.stringify(body)
        }
      );

      return new Response(response.body, {

        status: response.status,

        headers: {
          ...cors,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        }

      });

    } catch (err) {

      return new Response(

        JSON.stringify({

          error: err.message

        }),

        {

          status: 500,

          headers: {

            ...cors,

            "Content-Type": "application/json"

          }

        }

      );

    }

  }
}
