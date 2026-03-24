import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, fileName } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY?.trim();

    if (!apiKey || apiKey === 'your_openrouter_api_key') {
      console.error('API Key Missing in Server Environment');
      return NextResponse.json({ error: 'OpenRouter API key is missing on the server.' }, { status: 500 });
    }

    console.log('Attempting AI Analysis with trimmed key...');

    const truncatedText = text.substring(0, 40000);

    const prompt = `
      Analyze the following document text and provide a highly detailed, analytical, and insightful summary.
      Document Content: "${truncatedText}"
      
      Requirements:
      1. Summary: Provide a comprehensive, long-form summary (at least 2-3 paragraphs, 250-400 words) that captures the core thesis, key arguments, and significant conclusions of the document.
      2. Insights: Provide 8-10 deep, non-obvious insights extracted from the text. Focus on implications, hidden patterns, or critical data points.
      3. Metrics: Evaluate the document on Readability, Complexity, and Keyword Density (0-100).
      4. Sentiments: Analyze the distribution of Strategic, Technical, Financial, and Operational focus.
      5. Trends: Map out the logical progression or data trends across 6 distinct sections of the document.
      
      The response must be a valid JSON object with this structure:
      {
        "summary": "Your long, detailed summary here...",
        "insights": ["Insight 1", "Insight 2", ... "Insight 10"],
        "metrics": [
          {"name": "Readability", "value": number},
          {"name": "Complexity", "value": number},
          {"name": "Keyword Density", "value": number}
        ],
        "sentiments": [
          {"name": "Strategic", "value": percentage},
          {"name": "Technical", "value": percentage},
          {"name": "Financial", "value": percentage},
          {"name": "Operational", "value": percentage}
        ],
        "trends": [
          {"name": "Phase 1", "value": score},
          {"name": "Phase 2", "value": score},
          {"name": "Phase 3", "value": score},
          {"name": "Phase 4", "value": score},
          {"name": "Phase 5", "value": score},
          {"name": "Phase 6", "value": score}
        ]
      }
      
      Return ONLY the JSON object. Be precise, professional, and thorough.
    `;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://techart-ai.com",
        "X-Title": "TECHART AI",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemini-2.0-flash-lite-preview-02-05:free",
        "messages": [
          {
            "role": "user",
            "content": prompt
          }
        ],
        "response_format": { "type": "json_object" }
      })
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('OpenRouter API Response Error:', {
        status: response.status,
        statusText: response.statusText,
        error: result
      });
      return NextResponse.json({ 
        error: result.error?.message || `AI Analysis failed with status ${response.status}` 
      }, { status: response.status });
    }

    const aiContent = JSON.parse(result.choices[0].message.content);
    
    return NextResponse.json({
      ...aiContent,
      fileName: fileName
    });

  } catch (error: any) {
    console.error("Server API Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
