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
         - "name" should be a short, descriptive label for the section (e.g., "Intro", "Core Analysis", "Conclusion", or specific chapter keywords).
         - "value" should be a score (0-100) representing the intensity of the document's primary theme in that section.
      
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
          {"name": "Short Section Label", "value": score},
          {"name": "Short Section Label", "value": score},
          {"name": "Short Section Label", "value": score},
          {"name": "Short Section Label", "value": score},
          {"name": "Short Section Label", "value": score},
          {"name": "Short Section Label", "value": score}
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
        "model": "nvidia/nemotron-3-super-120b-a12b:free",
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
      
      let errorMessage = result.error?.message || `AI Analysis failed with status ${response.status}`;
      if (response.status === 401) {
        errorMessage = 'Your OpenRouter API Key is invalid or has expired. Please check your .env.local or Vercel settings.';
      }
      
      return NextResponse.json({ 
        error: errorMessage 
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
