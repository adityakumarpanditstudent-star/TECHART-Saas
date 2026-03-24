export interface AnalysisData {
  summary: string;
  insights: string[];
  metrics: { name: string; value: number }[];
  sentiments: { name: string; value: number }[];
  trends: { name: string; value: number }[];
  fileName: string;
}

// Robust dynamic import with specific handling for document libraries
async function getLib(name: 'pdfjs' | 'mammoth' | 'xlsx') {
  try {
    if (name === 'pdfjs') {
      const pdfjsLib = await import('pdfjs-dist');
      // @ts-ignore
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      return pdfjsLib;
    }
    if (name === 'mammoth') {
      const mammoth = await import('mammoth');
      return (mammoth as any).default || mammoth;
    }
    if (name === 'xlsx') {
      const XLSX = await import('xlsx');
      return (XLSX as any).default || XLSX;
    }
  } catch (error) {
    console.error(`Failed to load library: ${name}`, error);
    throw new Error(`Neural engine component ${name} failed to load. Please refresh and try again.`);
  }
}

export async function processFile(file: File): Promise<AnalysisData> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  let text = '';

  try {
    if (extension === 'pdf') {
      text = await readPDF(file);
    } else if (extension === 'docx' || extension === 'doc') {
      text = await readDOCX(file);
    } else if (extension === 'xlsx' || extension === 'xls' || extension === 'csv') {
      text = await readXLSX(file);
    } else {
      text = await readText(file);
    }

    if (!text || text.trim().length === 0) {
      throw new Error('The file appears to be empty or could not be read.');
    }

    return await analyzeTextWithAI(text, file.name);
  } catch (error: any) {
    console.error('Error processing file:', error);
    throw new Error(error.message || 'Could not read file content');
  }
}

async function readPDF(file: File): Promise<string> {
  const pdfjsLib = await getLib('pdfjs');
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  
  for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    // @ts-ignore
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }
  return fullText;
}

async function readDOCX(file: File): Promise<string> {
  const mammoth = await getLib('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function readXLSX(file: File): Promise<string> {
  const XLSX = await getLib('xlsx');
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  let fullText = '';
  workbook.SheetNames.forEach((name: string) => {
    const sheet = workbook.Sheets[name];
    fullText += XLSX.utils.sheet_to_csv(sheet) + '\n';
  });
  return fullText;
}

async function readText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read text file'));
    reader.readAsText(file);
  });
}

async function analyzeTextWithAI(text: string, fileName: string): Promise<AnalysisData> {
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
  console.log('API Key check:', apiKey ? `${apiKey.substring(0, 10)}...` : 'Not Found');
  if (!apiKey || apiKey === 'your_openrouter_api_key') {
    throw new Error('OpenRouter API key is missing. Please check your .env.local file.');
  }

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

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://techart-ai.com",
        "X-Title": "TECHART AI",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "meta-llama/llama-3.1-8b-instruct:free",
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
      throw new Error(result.error?.message || "AI Analysis failed");
    }

    const aiContent = JSON.parse(result.choices[0].message.content);
    
    return {
      ...aiContent,
      fileName: fileName
    };
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    throw new Error("AI analysis failed: " + error.message);
  }
}
