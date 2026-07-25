"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, Database, ArrowRight, CheckCircle2, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DataIngestionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataset, setDataset] = useState<Record<string, string> | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      setDataset(null);
      setRawText(null);
      
      // Create a preview if it's an image
      if (selected.type.startsWith("image/")) {
        const url = URL.createObjectURL(selected);
        setPreview(url);
      } else {
        setPreview(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setDataset(data.dataset);
        setRawText(data.rawText);
        toast.success("Document analyzed successfully.");
      } else {
        toast.error("Analysis failed: " + data.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to connect to OCR service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          <Database className="w-8 h-8 text-primary" />
          Data Ingestion & OCR
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">
          Upload incident reports, FIR scans, or raw documents. The Catalyst Zia OCR Engine will automatically extract structured entities.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Upload Section */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6 flex flex-col">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-zinc-500" /> Upload Document
          </h2>
          
          <div 
            className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 transition-colors ${
              file ? 'border-primary/50 bg-primary/5' : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer'
            }`}
            onClick={() => !file && fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileSelect}
              accept="image/*,application/pdf"
            />
            
            {preview ? (
              <div className="relative w-full flex flex-col items-center">
                <img src={preview} alt="Preview" className="max-h-64 object-contain rounded-lg shadow-sm mb-4" />
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{file?.name}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setPreview(null);
                  }}
                >
                  Clear Selection
                </Button>
              </div>
            ) : file ? (
               <div className="text-center">
                 <FileText className="w-12 h-12 text-primary mx-auto mb-3" />
                 <p className="font-medium text-zinc-700 dark:text-zinc-300">{file.name}</p>
                 <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  Clear Selection
                </Button>
               </div>
            ) : (
              <div className="text-center">
                <UploadCloud className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
                <p className="font-medium text-zinc-700 dark:text-zinc-300">Click to upload document</p>
                <p className="text-sm text-zinc-500 mt-1">Supports JPG, PNG, PDF</p>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={handleUpload} 
              disabled={!file || loading}
              className="gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing OCR...</>
              ) : (
                <>Run Zia Analysis <ArrowRight className="w-4 h-4" /></>
              )}
            </Button>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6 flex flex-col h-[600px] overflow-hidden">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Extracted Dataset
          </h2>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
            {!dataset && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 space-y-3">
                <ShieldAlert className="w-10 h-10 opacity-50" />
                <p>No data extracted yet.<br/>Upload a document to generate a dataset.</p>
              </div>
            )}

            {loading && (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="animate-pulse">Analyzing document structure & extracting entities...</p>
              </div>
            )}

            {dataset && (
              <>
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4">
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400 mb-3">Structured Entities Found:</p>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(dataset).map(([key, value]) => (
                      <div key={key} className="flex flex-col bg-white dark:bg-zinc-950 rounded-md p-3 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <span className="text-xs uppercase font-semibold text-zinc-500 mb-1">{key}</span>
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{value as string}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Raw OCR Text</p>
                  <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400 font-mono overflow-auto max-h-48">
                    {rawText}
                  </div>
                </div>
              </>
            )}
          </div>
          
          {dataset && (
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                Save to Database
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
