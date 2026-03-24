# TECHART AI - Document Summarizer & Analysis SaaS

A highly modern, premium SaaS-style web UI for an AI Document Summarizer. Powered by the **NVIDIA Nemtron 3 Super (120B)** engine via OpenRouter.

## 🚀 Features

- **Neural Engine v2.0**: Deep document analysis using the 120B Nemtron model.
- **Universal Extension Support**: Analyze PDF, DOCX, XLSX, and TXT files.
- **Analytical Dashboard**: Interactive charts (Recharts) showing topic distribution, trends, and KPIs.
- **Premium PDF Export**: Download high-fidelity analytical reports.
- **Supabase Integration**: Persistent history of recent summaries.
- **Glassmorphism UI**: Futuristic dark theme with neon gradients and smooth animations.

## 🛠️ Deployment on Vercel

This project is optimized for one-click deployment on Vercel.

1.  **Push to GitHub**: (Already done)
2.  **Import to Vercel**: Connect your GitHub repository.
3.  **Configure Environment Variables**:
    In the Vercel project settings, add the following variables:
    - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
    - `NEXT_PUBLIC_OPENROUTER_API_KEY`: Your OpenRouter API Key (Nemtron 120B model).

## 📦 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **AI**: NVIDIA Nemtron 120B (via OpenRouter)
- **Charts**: Recharts
- **PDF Generation**: html2canvas & jsPDF
- **File Parsing**: mammoth.js (DOCX), pdfjs-dist (PDF), xlsx (Spreadsheets)

## 📝 License

Built by ADITYA. For portfolio and professional use.
