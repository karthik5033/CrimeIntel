import { Role } from "../AuthContext";

export function canViewUnmaskedData(role: Role): boolean {
  return role === "INSPECTOR" || role === "SUPERINTENDENT" || role === "ADMIN";
}

export function maskName(name: string, role: Role, isUnmasked = false): string {
  if (isUnmasked || canViewUnmaskedData(role)) return name;
  if (!name) return "";
  
  const parts = name.split(" ");
  return parts.map(part => {
    if (part.length <= 1) return part;
    return part[0] + "*".repeat(part.length - 1);
  }).join(" ");
}

export function maskPhone(phone: string, role: Role, isUnmasked = false): string {
  if (isUnmasked || canViewUnmaskedData(role)) return phone;
  if (!phone) return "";
  
  // Format: 9876543210 -> 98XX XXXX 10
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 10) return "XXXX";
  
  return `${cleaned.substring(0, 2)}XX XXXX ${cleaned.substring(cleaned.length - 2)}`;
}

export function maskAddress(address: string, role: Role, isUnmasked = false): string {
  if (isUnmasked || canViewUnmaskedData(role)) return address;
  if (!address) return "";
  
  // Mask specific street level details, keep area
  const parts = address.split(",");
  if (parts.length <= 1) return "MASKED LOCATION";
  
  return `MASKED, ${parts[parts.length - 1].trim()}`;
}

export function maskAadhaar(aadhaar: string, role: Role, isUnmasked = false): string {
  if (isUnmasked || canViewUnmaskedData(role)) return aadhaar;
  if (!aadhaar) return "";
  
  // Format: 1234 5678 9012 -> XXXX XXXX 9012
  const cleaned = aadhaar.replace(/\D/g, "");
  if (cleaned.length < 4) return "XXXX";
  return `XXXX XXXX ${cleaned.substring(cleaned.length - 4)}`;
}
