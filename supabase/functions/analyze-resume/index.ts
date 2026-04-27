// Resume analyzer edge function — uses Lovable AI Gateway with structured tool calling
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an expert resume reviewer, ATS scoring engine, career advisor, and interview coach.
Be specific, actionable, and honest. Base every claim on the resume content provided.
If a target role is given, calibrate scoring and keywords to that role; otherwise infer the most likely role from the resume.
Scores must reflect real ATS heuristics: keyword density, formatting clarity, quantifiable achievements, relevance to role, and standard sections.`;

const tool = {
  type: "function",
  function: {
    name: "submit_analysis",
    description: "Return a complete resume analysis.",
    parameters: {
      type: "object",
      properties: {
        ats_score: {
          type: "integer",
          description: "ATS score from 0 to 100.",
          minimum: 0,
          maximum: 100,
        },
        score_explanation: {
          type: "string",
          description: "1-3 sentences explaining how the score was calculated.",
        },
        detected_role: {
          type: "string",
          description: "The role inferred from or matched to the resume.",
        },
        strengths: {
          type: "array",
          items: { type: "string" },
          description: "4-7 specific strengths of the resume.",
        },
        weaknesses: {
          type: "array",
          items: { type: "string" },
          description: "4-7 specific weaknesses or gaps.",
        },
        improvements: {
          type: "array",
          items: { type: "string" },
          description: "5-8 concrete improvement suggestions.",
        },
        missing_keywords: {
          type: "array",
          items: { type: "string" },
          description:
            "Keywords missing from the resume that the target/detected role expects.",
        },
        keywords_to_add: {
          type: "array",
          items: { type: "string" },
          description:
            "Specific keywords/phrases to add to boost ATS matching.",
        },
        recommended_roles: {
          type: "array",
          description:
            "3-5 recommended job roles based on skills and experience.",
          items: {
            type: "object",
            properties: {
              role: { type: "string" },
              fit_reason: { type: "string" },
              keywords: {
                type: "array",
                items: { type: "string" },
                description: "Specific keywords to use when targeting this role.",
              },
            },
            required: ["role", "fit_reason", "keywords"],
            additionalProperties: false,
          },
        },
        skill_improvements: {
          type: "array",
          items: { type: "string" },
          description: "5-8 skills the candidate should develop.",
        },
        interview_questions: {
          type: "array",
          description: "6-10 likely interview questions tailored to the resume.",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              focus_area: { type: "string" },
              tip: { type: "string", description: "How to approach the answer." },
            },
            required: ["question", "focus_area", "tip"],
            additionalProperties: false,
          },
        },
      },
      required: [
        "ats_score",
        "score_explanation",
        "detected_role",
        "strengths",
        "weaknesses",
        "improvements",
        "missing_keywords",
        "keywords_to_add",
        "recommended_roles",
        "skill_improvements",
        "interview_questions",
      ],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { resumeText, targetRole } = await req.json();

    if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 50) {
      return new Response(
        JSON.stringify({ error: "Resume text is too short or missing." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const truncated = resumeText.slice(0, 18000);

    const userPrompt = targetRole
      ? `Target role: ${targetRole}\n\nResume:\n"""\n${truncated}\n"""\n\nProduce a thorough analysis tailored to the target role.`
      : `Resume:\n"""\n${truncated}\n"""\n\nNo target role specified — infer the most likely role and tailor the analysis accordingly.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          tools: [tool],
          tool_choice: { type: "function", function: { name: "submit_analysis" } },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error", response.status, errText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "AI service failed." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "AI did not return a structured analysis." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let analysis;
    try {
      analysis = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("Failed to parse tool args", e);
      return new Response(
        JSON.stringify({ error: "Malformed AI response." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ analysis }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-resume error", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
