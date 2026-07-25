"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Test Upload Page - Debug file upload issues
 */

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      addLog(`✅ File selected: ${selectedFile.name}`);
      addLog(`📊 Size: ${selectedFile.size} bytes`);
      addLog(`📝 Type: ${selectedFile.type}`);
    }
  };

  const testBucket = async () => {
    addLog('🧪 Testing bucket...');
    try {
      const response = await fetch('/api/test-bucket');
      const data = await response.json();
      addLog(`📦 Bucket test: ${data.success ? 'SUCCESS' : 'FAILED'}`);
      if (data.success) {
        addLog(`✅ Bucket ready: ${data.bucketName}`);
      } else {
        addLog(`❌ Error: ${data.error}`);
        addLog(`Available: ${data.availableBuckets?.join(', ') || 'none'}`);
      }
      setResult(data);
    } catch (error) {
      addLog(`❌ Request failed: ${(error as Error).message}`);
    }
  };

  const testCatalystStatus = async () => {
    addLog('🔍 Checking Catalyst status...');
    try {
      const response = await fetch('/api/catalyst-status');
      const data = await response.json();
      addLog(`📊 Status: ${data.status}`);
      addLog(`Environment: ${data.checks?.envVars?.environment || 'unknown'}`);
      addLog(`SDK Init: ${data.checks?.sdkInit?.status || 'unknown'}`);
      addLog(`Filestore: ${data.checks?.filestore?.status || 'unknown'}`);
      addLog(`Buckets: ${data.checks?.buckets?.status || 'unknown'}`);
      setResult(data);
    } catch (error) {
      addLog(`❌ Request failed: ${(error as Error).message}`);
    }
  };

  const testFileRead = async () => {
    if (!file) {
      addLog('❌ No file selected');
      return;
    }

    addLog('📖 Reading file...');
    try {
      const arrayBuffer = await file.arrayBuffer();
      addLog(`✅ ArrayBuffer size: ${arrayBuffer.byteLength} bytes`);
      
      const buffer = Buffer.from(arrayBuffer);
      addLog(`✅ Buffer size: ${buffer.length} bytes`);
      
      // Read first 10 bytes
      const preview = Array.from(buffer.slice(0, 10)).map(b => b.toString(16).padStart(2, '0')).join(' ');
      addLog(`📄 First 10 bytes: ${preview}`);
      
      // Check if it's a PDF
      const header = String.fromCharCode(...buffer.slice(0, 4));
      addLog(`📋 File header: ${header}`);
      if (header === '%PDF') {
        addLog('✅ Valid PDF file');
      } else {
        addLog('⚠️ Does not appear to be a PDF');
      }
    } catch (error) {
      addLog(`❌ Failed to read file: ${(error as Error).message}`);
    }
  };

  const testUpload = async () => {
    if (!file) {
      addLog('❌ No file selected');
      return;
    }

    addLog('📤 Starting upload test...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('firNumber', 'TEST-' + Date.now());
      formData.append('description', 'Test upload');
      
      addLog('📨 Sending request...');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      addLog(`📬 Response status: ${response.status} ${response.statusText}`);
      
      const data = await response.json();
      addLog(`📦 Response data received`);
      
      if (data.success) {
        addLog('✅ Upload successful!');
        addLog(`📄 File ID: ${data.data.fileId}`);
        addLog(`🔗 File URL: ${data.data.fileUrl}`);
        addLog(`📋 FIR Number: ${data.data.firNumber}`);
      } else {
        addLog(`❌ Upload failed: ${data.error}`);
        if (data.details) {
          addLog(`📝 Details: ${data.details}`);
        }
      }
      
      setResult(data);
    } catch (error) {
      addLog(`❌ Request failed: ${(error as Error).message}`);
      addLog(`Stack: ${(error as Error).stack}`);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload Debug Test</h1>
        <p className="text-muted-foreground">Test and debug file upload functionality</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Controls */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>File Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="block w-full text-sm"
              />
              
              {file && (
                <Alert>
                  <AlertDescription>
                    <strong>{file.name}</strong><br/>
                    Size: {(file.size / 1024).toFixed(2)} KB<br/>
                    Type: {file.type}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={testCatalystStatus} className="w-full" variant="outline">
                1. Check Catalyst Status
              </Button>
              <Button onClick={testBucket} className="w-full" variant="outline">
                2. Test Bucket Existence
              </Button>
              <Button onClick={testFileRead} className="w-full" variant="outline" disabled={!file}>
                3. Test File Reading
              </Button>
              <Button onClick={testUpload} className="w-full" disabled={!file}>
                4. Test Upload
              </Button>
              <Button onClick={() => { setLogs([]); setResult(null); }} className="w-full" variant="destructive">
                Clear Logs
              </Button>
            </CardContent>
          </Card>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Result JSON</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-zinc-100 dark:bg-zinc-950 p-4 rounded overflow-auto max-h-64">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Logs */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle>Debug Logs</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-1 font-mono text-xs">
              {logs.length === 0 ? (
                <p className="text-muted-foreground">No logs yet. Run tests to see output.</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className={`
                    ${log.includes('✅') ? 'text-green-600' : ''}
                    ${log.includes('❌') ? 'text-red-600' : ''}
                    ${log.includes('⚠️') ? 'text-yellow-600' : ''}
                    ${log.includes('🧪') || log.includes('🔍') ? 'text-blue-600' : ''}
                  `}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Select a PDF file using the file input above</li>
            <li>Run <strong>Check Catalyst Status</strong> to verify SDK configuration</li>
            <li>Run <strong>Test Bucket Existence</strong> to verify fir_documents bucket exists</li>
            <li>Run <strong>Test File Reading</strong> to verify file can be read correctly</li>
            <li>Run <strong>Test Upload</strong> to attempt full upload to Stratus</li>
            <li>Check debug logs for detailed error messages</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
