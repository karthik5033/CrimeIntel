"use client";

import React from "react";
import { User, MapPin, ShieldAlert, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { maskName, maskAddress, canViewUnmaskedData } from "@/lib/utils/dataMasking";
import { AuditLogger } from "@/lib/api/auditLogger";

interface ClientProfileHeaderProps {
  person: any;
  roleType: string;
}

export function ClientProfileHeader({ person, roleType }: ClientProfileHeaderProps) {
  const { role, userId } = useAuth();
  const [isUnmasked, setIsUnmasked] = React.useState(false);

  const canUnmask = canViewUnmaskedData(role);

  const toggleUnmask = () => {
    if (!isUnmasked) {
      AuditLogger.logEvent({
        event_type: "UNMASK_DATA",
        user_id: userId,
        user_role: role,
        details: { action: "UNMASK_PROFILE", person_id: person.id }
      });
    }
    setIsUnmasked(!isUnmasked);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      <div className="flex-shrink-0">
        <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-card shadow-sm">
          <User className="w-16 h-16 text-muted-foreground/50" />
        </div>
      </div>
      
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-bold text-foreground">
            {maskName(person.name_en, role, isUnmasked)}
          </h1>
          <Badge variant={roleType === "ACCUSED" ? "destructive" : roleType === "VICTIM" ? "default" : "secondary"} className="text-sm">
            {roleType}
          </Badge>
          {canUnmask && (
            <Button variant="ghost" size="sm" onClick={toggleUnmask} className="h-8 text-muted-foreground">
              {isUnmasked ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {isUnmasked ? "Mask Data" : "Unmask"}
            </Button>
          )}
        </div>
        <p className="text-xl text-muted-foreground">
          {maskName(person.name_kn, role, isUnmasked)}
        </p>
        
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-foreground">Age:</span> {person.age}
          </div>
          <div className="flex items-center gap-1">
            <span className="font-semibold text-foreground">Gender:</span> {person.gender}
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {maskAddress(person.address_en, role, isUnmasked)}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center bg-card border rounded-lg p-6 min-w-[150px] shadow-sm">
        <div className="text-sm font-medium text-muted-foreground mb-2">Risk Score</div>
        <div className="flex items-center gap-2">
          {person.risk_score >= 80 && <ShieldAlert className="w-6 h-6 text-destructive" />}
          <span className={`text-4xl font-bold ${person.risk_score >= 80 ? "text-destructive" : person.risk_score >= 50 ? "text-warning" : "text-success"}`}>
            {person.risk_score || 0}
          </span>
        </div>
      </div>
    </div>
  );
}
