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
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: text,
        fileName: fileName
      })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "AI Analysis failed");
    }

    return result;
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    throw new Error("AI analysis failed: " + error.message);
  }
}
