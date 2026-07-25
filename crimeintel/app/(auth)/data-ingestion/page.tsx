"use client";

import React, { useState, useRef, useCallback } from "react";
import { UploadCloud, FileText, Database, ArrowRight, CheckCircle2, ShieldAlert, Loader2, Clock, Eye, Trash2, XCircle, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

/**
 * Unified Data Ingestion Page
 * Combines upload, OCR, entity extraction, and knowledge graph building
 */

interface UploadStatus {
  stage: 'idle' | 'uploading' | 'uploaded' | 'ocr' | 'extraction' | 'graph' | 'completed' | 'error';
  progress: number;
  message: string;
  fileId?: string;
  firNumber?: string;
  error?: string;
}

interface ProcessingResult {
  upload?: any;
  ocr?: any;
  extraction?: any;
  graph?: any;
}

export default function DataIngestionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    stage: 'idle',
    progress: 0,
    message: 'Ready to upload FIR PDF or document'
  });
  const [processingResult, setProcessingResult] = useState<ProcessingResult>({});
  const [formData, setFormData] = useState({
    firNumber: '',
    description: '',
    crimeType: '',
    policeStation: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection with validation
  const handleFileSelect = useCallback((selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.type.startsWith('image/')) {
      setUploadStatus({
        stage: 'error',
        progress: 0,
        message: 'Only PDF and image files are allowed',
        error: 'Invalid file type'
      });
      toast.error('Only PDF and image files are allowed');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      setUploadStatus({
        stage: 'error',
        progress: 0,
        message: 'File size exceeds 10MB limit',
        error: 'File too large'
      });
      toast.error('File size exceeds 10MB limit');
      return;
    }

    setFile(selectedFile);
    setUploadStatus({
      stage: 'idle',
      progress: 0,
      message: `Ready to upload: ${selectedFile.name}`
    });
  }, []);

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Complete upload pipeline
  const handleUpload = async () => {
    if (!file) return;

    try {
      // Stage 1: Upload to Stratus
      setUploadStatus({
        stage: 'uploading',
        progress: 10,
        message: 'Uploading file to Stratus...'
      });

      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('firNumber', formData.firNumber || `FIR-${Date.now()}`);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('crimeType', formData.crimeType);
      uploadFormData.append('policeStation', formData.policeStation);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      setProcessingResult(prev => ({ ...prev, upload: uploadResult }));
      setUploadStatus({
        stage: 'uploaded',
        progress: 25,
        message: 'File uploaded successfully. Starting OCR...',
        fileId: uploadResult.data.fileId,
        firNumber: uploadResult.data.firNumber
      });
      toast.success('File uploaded successfully');

      // Stage 2: OCR Processing
      setUploadStatus(prev => ({
        ...prev,
        stage: 'ocr',
        progress: 40,
        message: 'Extracting text using Zia OCR...'
      }));

      const ocrResponse = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firId: uploadResult.data.firNumber,
          fileId: uploadResult.data.fileId
        }),
      });

      const ocrResult = await ocrResponse.json();

      if (!ocrResult.success) {
        throw new Error(ocrResult.error || 'OCR failed');
      }

      setProcessingResult(prev => ({ ...prev, ocr: ocrResult }));
      setUploadStatus(prev => ({
        ...prev,
        progress: 60,
        message: `OCR completed. Extracted ${ocrResult.data.textLength} characters.`
      }));
      toast.success('OCR processing complete');

      // Stage 3: Entity Extraction & Storage
      setUploadStatus(prev => ({
        ...prev,
        stage: 'extraction',
        progress: 75,
        message: 'Extracting entities (persons, vehicles, phones)...'
      }));

      const extractResponse = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firId: uploadResult.data.firNumber,
          storeEntities: true
        }),
      });

      const extractResult = await extractResponse.json();

      if (!extractResult.success) {
        throw new Error(extractResult.error || 'Entity extraction failed');
      }

      setProcessingResult(prev => ({ ...prev, extraction: extractResult }));
      toast.success('Entities extracted successfully');

      // Stage 4: Knowledge Graph Building
      setUploadStatus(prev => ({
        ...prev,
        stage: 'graph',
        progress: 90,
        message: 'Building knowledge graph and relationships...'
      }));

      const graphResponse = await fetch('/api/graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firId: uploadResult.data.firNumber
        }),
      });

      const graphResult = await graphResponse.json();

      if (!graphResult.success) {
        console.warn('Graph building failed, but continuing:', graphResult.error);
      } else {
        toast.success('Knowledge graph built successfully');
      }

      setProcessingResult(prev => ({ ...prev, graph: graphResult }));

      // Stage 5: Completed
      setUploadStatus({
        stage: 'completed',
        progress: 100,
        message: 'FIR processing completed successfully!',
        firNumber: uploadResult.data.firNumber
      });
      toast.success('All processing completed successfully!');

    } catch (error) {
      console.error('Upload pipeline error:', error);
      setUploadStatus({
        stage: 'error',
        progress: 0,
        message: 'Processing failed',
        error: (error as Error).message
      });
      toast.error('Processing failed: ' + (error as Error).message);
    }
  };

  // Reset upload
  const handleReset = () => {
    setFile(null);
    setUploadStatus({
      stage: 'idle',
      progress: 0,
      message: 'Ready to upload FIR PDF or document'
    });
    setProcessingResult({});
    setFormData({
      firNumber: '',
      description: '',
      crimeType: '',
      policeStation: '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Database className="w-8 h-8 text-primary" />
            Data Ingestion & Intelligence Pipeline
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">
            Upload FIR PDFs for complete AI-powered processing: OCR → Entity Extraction → Knowledge Graph → Search
          </p>
        </div>
        {uploadStatus.stage !== 'idle' && (
          <Button variant="outline" onClick={handleReset}>
            <Trash2 className="mr-2 h-4 w-4" />
            Reset
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Upload Section */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6 flex flex-col space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-zinc-500" /> Upload FIR Document
          </h2>
          
          {/* Drag & Drop Area */}
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 transition-colors cursor-pointer
              ${dragActive ? 'border-primary bg-primary/10' : ''}
              ${file ? 'border-primary/50 bg-primary/5' : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}
            `}
            onClick={() => !file && fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              accept="image/*,application/pdf"
            />
            
            {file ? (
               <div className="text-center">
                 <FileText className="w-12 h-12 text-primary mx-auto mb-3" />
                 <p className="font-medium text-zinc-700 dark:text-zinc-300">{file.name}</p>
                 <p className="text-sm text-zinc-500 mt-1">
                   {(file.size / 1024 / 1024).toFixed(2)} MB
                 </p>
                 <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
                >
                  Clear Selection
                </Button>
               </div>
            ) : (
              <div className="text-center">
                <UploadCloud className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
                <p className="font-medium text-zinc-700 dark:text-zinc-300">Drop PDF here or click to browse</p>
                <p className="text-sm text-zinc-500 mt-1">Supports PDF and images up to 10MB</p>
              </div>
            )}
          </div>
          
          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firNumber" className="text-sm font-medium">FIR Number (Optional)</Label>
              <Input
                id="firNumber"
                placeholder="e.g., FIR/2026/001234"
                value={formData.firNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, firNumber: e.target.value }))}
                disabled={uploadStatus.stage !== 'idle'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Brief Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the incident..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                disabled={uploadStatus.stage !== 'idle'}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="crimeType" className="text-sm font-medium">Crime Type</Label>
                <Select
                  value={formData.crimeType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, crimeType: value || '' }))}
                  disabled={uploadStatus.stage !== 'idle'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="theft">Theft</SelectItem>
                    <SelectItem value="robbery">Robbery</SelectItem>
                    <SelectItem value="murder">Murder</SelectItem>
                    <SelectItem value="assault">Assault</SelectItem>
                    <SelectItem value="fraud">Fraud</SelectItem>
                    <SelectItem value="burglary">Burglary</SelectItem>
                    <SelectItem value="kidnapping">Kidnapping</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="policeStation" className="text-sm font-medium">Police Station</Label>
                <Input
                  id="policeStation"
                  placeholder="e.g., Whitefield PS"
                  value={formData.policeStation}
                  onChange={(e) => setFormData(prev => ({ ...prev, policeStation: e.target.value }))}
                  disabled={uploadStatus.stage !== 'idle'}
                />
              </div>
            </div>
          </div>
          
          {/* Upload Button */}
          <Button 
            onClick={handleUpload} 
            disabled={!file || ['uploading', 'ocr', 'extraction', 'graph'].includes(uploadStatus.stage)}
            className="w-full"
            size="lg"
          >
            {['uploading', 'ocr', 'extraction', 'graph'].includes(uploadStatus.stage) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing Pipeline...
              </>
            ) : (
              <>
                <ArrowRight className="mr-2 h-4 w-4" /> Process FIR Document
              </>
            )}
          </Button>
        </div>

        {/* Results & Status Section */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6 flex flex-col space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Processing Status
          </h2>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="text-zinc-600 dark:text-zinc-400">{uploadStatus.progress}%</span>
            </div>
            <Progress value={uploadStatus.progress} className="w-full h-2" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{uploadStatus.message}</p>
          </div>

          {/* Pipeline Stages */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Pipeline Stages:</p>
            {[
              { key: 'upload', label: 'File Upload to Stratus', stage: 'uploaded' },
              { key: 'ocr', label: 'OCR Text Extraction', stage: 'ocr' },
              { key: 'extraction', label: 'Entity Extraction', stage: 'extraction' },
              { key: 'graph', label: 'Knowledge Graph Building', stage: 'graph' },
            ].map((item) => {
              const stageOrder = ['idle', 'uploading', 'uploaded', 'ocr', 'extraction', 'graph', 'completed'];
              const currentIndex = stageOrder.indexOf(uploadStatus.stage);
              const itemIndex = stageOrder.indexOf(item.stage);
              const isCompleted = currentIndex > itemIndex || uploadStatus.stage === 'completed';
              const isActive = uploadStatus.stage === item.stage;
              
              return (
                <div key={item.key} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/50">
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : isActive ? (
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin flex-shrink-0" />
                  ) : (
                    <Clock className="h-5 w-5 text-zinc-300 flex-shrink-0" />
                  )}
                  <span className={`flex-1 text-sm ${isCompleted ? 'text-green-700 dark:text-green-400 font-medium' : isActive ? 'text-blue-700 dark:text-blue-400 font-medium' : 'text-zinc-500'}`}>
                    {item.label}
                  </span>
                  {processingResult[item.key as keyof ProcessingResult] && (
                    <Badge variant="secondary" className="text-xs">
                      Done
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>

          {/* Error Display */}
          {uploadStatus.stage === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Processing Failed</AlertTitle>
              <AlertDescription>
                {uploadStatus.error || 'An unknown error occurred'}
              </AlertDescription>
            </Alert>
          )}

          {/* Success Display */}
          {uploadStatus.stage === 'completed' && (
            <>
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800 dark:text-green-400">Processing Complete!</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-300">
                  FIR <strong>{uploadStatus.firNumber}</strong> has been processed successfully.
                  <div className="mt-3 space-y-1.5 text-sm">
                    {processingResult.ocr && (
                      <p className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Extracted {processingResult.ocr.data?.textLength || 0} characters via OCR
                      </p>
                    )}
                    {processingResult.extraction && (
                      <p className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Found {processingResult.extraction.stats?.extraction?.personsCount || 0} persons, 
                        {' '}{processingResult.extraction.stats?.extraction?.vehiclesCount || 0} vehicles,
                        {' '}{processingResult.extraction.stats?.extraction?.phonesCount || 0} phone records
                      </p>
                    )}
                    {processingResult.graph && (
                      <p className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Built knowledge graph with {processingResult.graph.stats?.relationships?.created || 0} relationships
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              {uploadStatus.firNumber && (
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <a href={`/firs/${uploadStatus.firNumber}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View FIR Details
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <a href={`/network?focus=${uploadStatus.firNumber}`}>
                      <Database className="mr-2 h-4 w-4" />
                      View Knowledge Graph
                    </a>
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Idle State */}
          {uploadStatus.stage === 'idle' && !file && (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-500 py-8">
              <ShieldAlert className="w-12 h-12 opacity-30 mb-3" />
              <p className="text-sm">No document uploaded yet</p>
              <p className="text-xs text-zinc-400 mt-1">Upload a PDF to start the intelligence pipeline</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
