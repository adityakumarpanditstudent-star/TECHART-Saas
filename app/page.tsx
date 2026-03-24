'use client'; 
  
 import { useState, useRef, useEffect } from 'react'; 
 import { supabase } from '@/lib/supabase';
 import AnalyticalDashboard from '@/components/AnalyticalDashboard';
 import { processFile, AnalysisData } from '@/lib/document-processor';
 import html2canvas from 'html2canvas';
 import jsPDF from 'jspdf';
  
 export default function DocumentSummarizer() { 
   const [uploadedFile, setUploadedFile] = useState<File | null>(null); 
   const [isProcessing, setIsProcessing] = useState(false); 
   const [analysis, setAnalysis] = useState<AnalysisData | null>(null); 
   const [error, setError] = useState<string | null>(null); 
   const [recentSummaries, setRecentSummaries] = useState<any[]>([]);
   const fileInputRef = useRef<HTMLInputElement>(null); 
   const dragAreaRef = useRef<HTMLDivElement>(null); 
  
   // Fetch history from Supabase
   const fetchHistory = async () => {
     const isConfigured = typeof window !== 'undefined' && 
       process.env.NEXT_PUBLIC_SUPABASE_URL && 
       process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url';

     if (!isConfigured) {
       console.warn('Supabase not configured. Skipping history fetch.');
       return;
     }
     try {
       const { data, error: supabaseError } = await supabase
         .from('summaries')
         .select('*')
         .order('created_at', { ascending: false })
         .limit(5);

       if (data) setRecentSummaries(data);
       if (supabaseError) console.warn('History fetch error:', supabaseError.message);
     } catch (err) {
       console.warn('Supabase fetch failed');
     }
   };

   useEffect(() => {
     fetchHistory();
   }, []);

   const getFileIcon = (fileName: string) => { 
     const ext = fileName.split('.').pop()?.toLowerCase(); 
     switch (ext) { 
       case 'pdf': return '📄'; 
       case 'docx': 
       case 'doc': return '📝'; 
       case 'txt': return '📋'; 
       case 'xlsx':
       case 'csv': return '📊';
       case 'pptx': return '📽️';
       case 'jpg':
       case 'png': return '🖼️';
       default: return '📁'; 
     } 
   }; 
  
   const handleFileSelect = (file: File) => { 
     if (file) { 
       setUploadedFile(file); 
       setError(null); 
       setAnalysis(null); 
     } 
   }; 
  
   const handleDragOver = (e: React.DragEvent) => { 
     e.preventDefault(); 
     e.stopPropagation(); 
     if (dragAreaRef.current) { 
       dragAreaRef.current.classList.add('drag-active'); 
     } 
   }; 
  
   const handleDragLeave = (e: React.DragEvent) => { 
     e.preventDefault(); 
     e.stopPropagation(); 
     if (dragAreaRef.current) { 
       dragAreaRef.current.classList.remove('drag-active'); 
     } 
   }; 
  
   const handleDrop = (e: React.DragEvent) => { 
     e.preventDefault(); 
     e.stopPropagation(); 
     if (dragAreaRef.current) { 
       dragAreaRef.current.classList.remove('drag-active'); 
     } 
     const files = e.dataTransfer.files; 
     if (files.length > 0) { 
       handleFileSelect(files[0]); 
     } 
   }; 
  
   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
     const files = e.target.files; 
     if (files && files.length > 0) { 
       handleFileSelect(files[0]); 
     } 
   }; 
  
   const handleSummarize = async () => { 
     if (!uploadedFile) { 
       setError('Please upload a file first'); 
       return; 
     } 
  
     setIsProcessing(true); 
     setError(null); 
  
     try {
       // Real file processing
       const analysisResult = await processFile(uploadedFile);
       setAnalysis(analysisResult); 
       setIsProcessing(false); 

       // Save to Supabase
       const isSupabaseConfigured = typeof window !== 'undefined' && 
         process.env.NEXT_PUBLIC_SUPABASE_URL && 
         process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url';

       if (isSupabaseConfigured) {
         try {
           const { error: supabaseError } = await supabase
             .from('summaries')
             .insert([
               { 
                 file_name: uploadedFile.name, 
                 file_size: uploadedFile.size, 
                 summary: analysisResult.summary,
                 created_at: new Date().toISOString()
               }
             ]);
           
           if (!supabaseError) {
             fetchHistory();
           } else {
             console.error('Supabase save error:', supabaseError.message);
           }
         } catch (err) {
           console.warn('Could not save to Supabase.');
         }
       }
     } catch (err: any) {
       setError(err.message || 'Failed to analyze document. Please try a different file.');
       setIsProcessing(false);
     }
   }; 
  
   const handleRemoveFile = () => { 
     setUploadedFile(null); 
     setAnalysis(null); 
     setError(null); 
     if (fileInputRef.current) { 
       fileInputRef.current.value = ''; 
     } 
   }; 
  
   const handleCopySummary = () => { 
     if (analysis) { 
       navigator.clipboard.writeText(analysis.summary); 
       alert('Summary copied to clipboard!'); 
     } 
   }; 
  
   const handleDownloadDashboard = async () => { 
     if (!analysis) return;
     
     const dashboard = document.getElementById('dashboard-content');
     if (!dashboard) return;

     try {
       const canvas = await html2canvas(dashboard, {
         backgroundColor: '#0f172a',
         scale: 2,
       });
       
       const imgData = canvas.toDataURL('image/png');
       const pdf = new jsPDF('p', 'mm', 'a4');
       const imgProps = pdf.getImageProperties(imgData);
       const pdfWidth = pdf.internal.pageSize.getWidth();
       const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
       
       pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
       pdf.save(`${analysis.fileName}_analysis.pdf`);
     } catch (err) {
       console.error('PDF generation failed:', err);
       alert('Failed to generate PDF. Please try again.');
     }
   }; 
  
   return ( 
     <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden pb-20"> 
       {/* Animated background elements */} 
       <div className="fixed inset-0 overflow-hidden pointer-events-none"> 
         <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div> 
         <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div> 
         <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div> 
       </div> 
  
       {/* Navbar */} 
       <nav className="sticky top-0 z-40 backdrop-blur-md bg-slate-900/30 border-b border-cyan-500/20"> 
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between"> 
           <div className="flex items-center gap-2"> 
             <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center font-bold text-lg shadow-lg shadow-cyan-500/50"> 
               T 
             </div> 
             <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent"> 
               TECHART AI 
             </h1> 
           </div> 
           <div className="text-sm text-slate-400 uppercase tracking-widest font-medium">Advanced Analysis Engine</div> 
         </div> 
       </nav> 
  
       {/* Main Content */} 
       <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16"> 
         {/* Hero Section */} 
         <section className="text-center mb-16 animate-fadeIn"> 
           <h2 className="text-5xl sm:text-7xl font-extrabold mb-6 bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent leading-tight"> 
             Deep Insight Analysis 
           </h2> 
           <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"> 
             Our neural engine processes any file format to deliver structured intelligence, analytical dashboards, and predictive trends. 
           </p> 
         </section> 
  
         {/* Upload Area */} 
         <section className="mb-12"> 
           {!uploadedFile ? ( 
             <div 
               ref={dragAreaRef} 
               onDragOver={handleDragOver} 
               onDragLeave={handleDragLeave} 
               onDrop={handleDrop} 
               onClick={() => fileInputRef.current?.click()} 
               className="relative group cursor-pointer" 
             > 
               {/* Glassmorphism card */} 
               <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div> 
               <div className="relative backdrop-blur-xl bg-slate-900/40 border-2 border-dashed border-cyan-400/30 rounded-2xl p-16 hover:border-cyan-400 hover:bg-slate-900/60 transition-all duration-300 text-center drag-area group"> 
                 <div className="text-7xl mb-6 group-hover:scale-110 transition-transform duration-300">📁</div> 
                 <h3 className="text-3xl font-bold mb-3 text-cyan-300">Drop your file here</h3> 
                 <p className="text-slate-400 mb-6 text-lg">Accepts all extensions: PDF, CSV, XLSX, PPTX, JPG, and more</p> 
                 <div className="inline-flex px-6 py-2 bg-white/5 rounded-full border border-white/10 text-cyan-400 text-sm font-medium"> 
                   Secure & Private Processing 
                 </div> 
               </div> 
             </div> 
           ) : ( 
             <div className="relative group"> 
               <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl blur-xl"></div> 
               <div className="relative backdrop-blur-xl bg-slate-900/40 border border-blue-400/30 rounded-2xl p-8"> 
                 <div className="flex items-center justify-between gap-4"> 
                   <div className="flex items-center gap-6 flex-1 min-w-0"> 
                     <span className="text-6xl flex-shrink-0">{getFileIcon(uploadedFile.name)}</span> 
                     <div className="min-w-0 flex-1"> 
                       <p className="text-2xl font-bold text-blue-300 truncate">{uploadedFile.name}</p> 
                       <p className="text-sm text-slate-500 font-mono mt-1"> 
                         SIZE: {(uploadedFile.size / 1024).toFixed(2)} KB • TYPE: {uploadedFile.name.split('.').pop()?.toUpperCase()} 
                       </p> 
                     </div> 
                   </div> 
                   <button 
                     onClick={handleRemoveFile} 
                     className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300" 
                     title="Remove file" 
                   > 
                     ✕ 
                   </button> 
                 </div> 
               </div> 
             </div> 
           )} 
           <input 
             ref={fileInputRef} 
             type="file" 
             onChange={handleInputChange} 
             className="hidden" 
           /> 
         </section> 
  
         {/* Error Message */} 
         {error && ( 
           <div className="mb-8 backdrop-blur-xl bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-300 text-center animate-fadeIn"> 
             {error} 
           </div> 
         )} 
  
         {/* Processing State */} 
         {isProcessing && ( 
           <div className="mb-12 text-center animate-fadeIn py-10"> 
             <div className="inline-block"> 
               <div className="relative"> 
                 <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur-2xl opacity-50 animate-pulse"></div> 
                 <div className="relative w-24 h-24 border-4 border-slate-800 border-t-cyan-400 border-r-purple-400 rounded-full animate-spin"></div> 
               </div> 
             </div> 
             <p className="mt-8 text-2xl font-medium text-slate-300 animate-pulse"> 
               Generating Insight Dashboard... 
             </p> 
             <p className="text-slate-500 mt-2">Running neural linguistic analysis and trend mapping</p>
           </div> 
         )} 
  
         {/* Analysis Dashboard Display */} 
         {analysis && !isProcessing && ( 
           <AnalyticalDashboard 
             data={analysis} 
             onDownload={handleDownloadDashboard} 
             onCopy={handleCopySummary} 
           />
         )} 
  
         {/* Summarize Button */} 
         {uploadedFile && !analysis && !isProcessing && ( 
           <section className="text-center mb-16"> 
             <button 
               onClick={handleSummarize} 
               className="px-12 py-5 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 hover:from-cyan-500 hover:via-blue-600 hover:to-purple-600 text-white font-bold text-xl rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-[0_0_30px_rgba(34,211,238,0.3)] group" 
             > 
               <span className="flex items-center gap-3">
                 ✨ Run Deep Analysis
                 <span className="text-sm opacity-50 font-normal">Nemtron 120B Engine</span>
               </span>
             </button> 
           </section> 
         )}

         {/* History Section */}
         {recentSummaries.length > 0 && !analysis && (
           <section className="mt-20 animate-fadeIn">
             <h3 className="text-2xl font-bold mb-8 text-slate-400 flex items-center gap-3">
               <span className="w-8 h-8 bg-white/5 rounded flex items-center justify-center text-sm">🕒</span>
               Recent Reports
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {recentSummaries.map((item: any, idx: number) => (
                 <div key={item.id || idx} className="relative group cursor-pointer">
                   <div className="absolute inset-0 bg-slate-800/20 rounded-xl blur-sm group-hover:bg-cyan-500/5 transition-all"></div>
                   <div className="relative p-6 border border-slate-700/50 rounded-xl bg-slate-900/40 hover:border-cyan-500/30 transition-all">
                     <div className="flex items-center gap-4 mb-3">
                       <span className="text-3xl">{getFileIcon(item.file_name)}</span>
                       <div>
                         <h4 className="font-semibold text-slate-200 truncate max-w-[200px]">{item.file_name}</h4>
                         <p className="text-xs text-slate-500">{new Date(item.created_at).toLocaleDateString()}</p>
                       </div>
                     </div>
                     <p className="text-slate-400 text-sm line-clamp-2 italic">&quot;{item.summary}&quot;</p>
                   </div>
                 </div>
               ))}
             </div>
           </section>
         )}
       </main> 
  
       {/* Footer */} 
       <footer className="relative z-10 border-t border-white/5 bg-slate-950/50 backdrop-blur-xl py-12 mt-20"> 
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"> 
           <p className="text-slate-500 font-medium"> 
             Built by ADITYA • Powered by Advanced Neural Networks 
           </p> 
           <div className="flex justify-center gap-6 mt-4 text-xs text-slate-600 uppercase tracking-widest"> 
             <span>Privacy First</span> 
             <span>Analytical Engine</span> 
             <span>Cloud Export</span> 
           </div> 
         </div> 
       </footer> 
     </div> 
   ); 
 }
