import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function downloadDataAsCsv(data: any[], filename: string) {
  if (!data || data.length === 0) return;

  // We want to smartly extract fields if this is a known Catalyst entity (like an FIR)
  // Define standard columns we care about if they exist
  const standardColumns = [
    "id", "fir_number", "crime_type_en", "crime_type_kn", 
    "district", "status_en", "status_kn", "timestamp", "severity", "location"
  ];

  // Discover what columns to use. If the first item has `fir_number`, it's an FIR array.
  let headers = Object.keys(data[0]);
  const isFirData = data[0].hasOwnProperty('fir_number') || data[0].hasOwnProperty('crime_type_en');
  
  if (isFirData) {
    // Only pick headers that actually exist in the data and are relevant
    headers = standardColumns.filter(col => headers.includes(col));
    // Append any extra keys we missed
    const extra = Object.keys(data[0]).filter(k => !headers.includes(k) && typeof data[0][k] !== 'object');
    headers = [...headers, ...extra];
  } else {
    // Basic flat map for other types
    headers = headers.filter(k => typeof data[0][k] !== 'object');
  }
  
  // Format header row (Capitalize and replace underscores)
  const formattedHeaders = headers.map(h => h.replace(/_/g, ' ').toUpperCase());

  // Convert objects to CSV rows
  const csvRows = data.map(row => {
    return headers.map(header => {
      let cell = row[header];
      if (cell === null || cell === undefined) cell = 'N/A';
      if (typeof cell === 'object') {
        // Try to stringify safely, or just say [Object]
        try {
          cell = JSON.stringify(cell);
        } catch {
          cell = '[Object]';
        }
      }
      cell = cell.toString().replace(/"/g, '""'); // Escape quotes
      return `"${cell}"`; // Enclose in quotes
    }).join(',');
  });

  // Combine headers and rows
  const csvContent = [formattedHeaders.join(','), ...csvRows].join('\n');
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
