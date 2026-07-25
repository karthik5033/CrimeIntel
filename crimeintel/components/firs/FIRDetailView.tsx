"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, MapPin, Building2, ShieldAlert, Sparkles, User, Link as LinkIcon, Network } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClientMaskedName } from "@/components/shared/ClientMaskedName";
import { useLanguage } from "@/lib/LanguageContext";

interface FIRDetailViewProps {
  firData: any;
  personsDetails: any[];
  linkedCase: any;
  vehicles: any[];
  weapons: any[];
}

export function FIRDetailView({ firData, personsDetails, linkedCase, vehicles, weapons }: FIRDetailViewProps) {
  const { t, language } = useLanguage();
  
  // Translate status and crime type dynamically if possible, or fallback to english fields
  let status = language === 'kn' && firData.status_kn ? firData.status_kn : (firData.status_en || "Registered");
  let crimeType = language === 'kn' && firData.crime_type_kn ? firData.crime_type_kn : (firData.crime_type_en || firData.crime_type);

  if (language === 'kn') {
    if (status === 'Pending') status = 'ಬಾಕಿ ಉಳಿದಿದೆ';
    if (status === 'Registered') status = 'ನೋಂದಾಯಿಸಲಾಗಿದೆ';
    if (status === 'Closed') status = 'ಮುಚ್ಚಲಾಗಿದೆ';
    if (status === 'Under Investigation') status = 'ತನಿಖೆಯಲ್ಲಿದೆ';
    if (status === 'UNDER INVESTIGATION') status = 'ತನಿಖೆಯಲ್ಲಿದೆ';
    
    if (crimeType === 'Cyber Fraud / Financial Scam') crimeType = 'ಸೈಬರ್ ವಂಚನೆ / ಹಣಕಾಸು ಹಗರಣ';
    if (crimeType === 'Robbery') crimeType = 'ದರೋಡೆ';
    if (crimeType === 'Assault') crimeType = 'ಹಲ್ಲೆ';
    if (crimeType === 'Theft') crimeType = 'ಕಳ್ಳತನ';
    if (crimeType === 'Murder') crimeType = 'ಕೊಲೆ';
    if (crimeType === 'Kidnapping') crimeType = 'ಅಪಹರಣ';
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-foreground">{firData.id || firData.fir_no}</h1>
            <Badge variant={status === "Pending" ? "secondary" : "outline"} className="text-sm uppercase tracking-wider">
              {status}
            </Badge>
          </div>
          <p className="text-2xl text-primary font-medium">{crimeType}</p>
          
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {firData.date}
            </div>
            <div className="flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              {firData.police_station_id}
            </div>
            {firData.lat && firData.lng && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {firData.lat}, {firData.lng}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild>
            <Link href={`/chat?context=${firData.id || firData.fir_no}`}>
              <Sparkles className="w-4 h-4 mr-2" />
              {t('firDetail.askAI')}
            </Link>
          </Button>
          {linkedCase && (
            <Button variant="outline" asChild>
              <Link href={`/cases/${linkedCase.id || linkedCase.case_no}`}>
                <LinkIcon className="w-4 h-4 mr-2" />
                {t('firDetail.viewLinkedCase')}
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/network?focus=${firData.id || firData.fir_no}`}>
              <Network className="w-4 h-4 mr-2" />
              {t('firDetail.viewOnGraph')}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
        {/* Left Column: Narrative & Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {t('firDetail.firNarrative')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {firData.description || t('firDetail.uploadedNarrative')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Entities */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldAlert className="w-5 h-5 text-destructive" />
                {t('firDetail.involvedPersons')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {personsDetails.length > 0 ? personsDetails.map((pDetail: any, idx: number) => {
                  const { personId, personData, type } = pDetail;
                  const displayName = personData ? (language === 'kn' && personData.name_kn ? personData.name_kn : personData.name_en) : personId;
                  
                  let displayType = (type || t('firDetail.linked')).replace('_IN', '').replace('_OF', '').replace('_TO', '').replace('_BY', '');
                  if (language === 'kn') {
                    if (displayType === 'ACCUSED') displayType = 'ಆರೋಪಿ';
                    if (displayType === 'VICTIM') displayType = 'ಸಂತ್ರಸ್ತ';
                    if (displayType === 'COMPLAINANT') displayType = 'ದೂರುದಾರ';
                    if (displayType === 'WITNESS') displayType = 'ಸಾಕ್ಷಿ';
                    if (displayType === 'SUSPECT') displayType = 'ಶಂಕಿತ';
                    if (displayType === 'LINKED') displayType = 'ಲಿಂಕ್ ಆಗಿದೆ';
                  }

                  return (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <Link href={`/profiles/${personId}`} className="font-medium hover:underline flex items-center gap-2 text-foreground">
                        <User className="w-3 h-3" /> 
                        <ClientMaskedName name={displayName} />
                      </Link>
                      <Badge variant={type === "ACCUSED_IN" ? "destructive" : type === "VICTIM_OF" ? "default" : "outline"} className="text-[10px]">
                        {displayType}
                      </Badge>
                    </div>
                  );
                }) : <div className="text-sm text-muted-foreground">{t('firDetail.noPersonsLinked')}</div>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-secondary" />
                {t('firDetail.physicalEvidence')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vehicles.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('firDetail.vehicles')}</h4>
                    <div className="space-y-2">
                      {vehicles.map((veh: any, idx: number) => {
                        const vehId = veh.source.startsWith('VEHICLE_') ? veh.source : veh.target;
                        
                        let displayType = veh.type;
                        if (language === 'kn' && displayType) {
                          if (displayType === 'SEDAN') displayType = 'ಸೆಡಾನ್';
                          if (displayType === 'SUV') displayType = 'ಎಸ್‌ಯುವಿ';
                          if (displayType === 'HATCHBACK') displayType = 'ಹ್ಯಾಚ್‌ಬ್ಯಾಕ್';
                          if (displayType === 'BIKE') displayType = 'ಬೈಕ್';
                          if (displayType === 'TWO_WHEELER') displayType = 'ದ್ವಿಚಕ್ರ ವಾಹನ';
                          if (displayType === 'TRUCK') displayType = 'ಟ್ರಕ್';
                          if (displayType === 'VAN') displayType = 'ವ್ಯಾನ್';
                        }
                        
                        return (
                          <div key={idx} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded border">
                            <span className="font-mono text-foreground">{vehId}</span>
                            <span className="text-xs text-muted-foreground">{displayType}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {vehicles.length === 0 && weapons.length === 0 && (
                  <div className="text-sm text-muted-foreground">{t('firDetail.noPhysicalEvidence')}</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
