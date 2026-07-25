"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Users, Phone, Car, Link as LinkIcon, User, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LinkedEntitiesProps {
  personId: string;
  associates: any[];
  vehicles: any[];
  phones: any[];
  bankAccounts?: any[]; // optional, as it might not be in the original code
}

export function LinkedEntities({ personId, associates, vehicles, phones, bankAccounts = [] }: LinkedEntitiesProps) {
  return (
    <div className="space-y-6">
      
      {/* Known Associates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-secondary" />
            Known Associates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {associates.length > 0 ? associates.map((assoc: any, idx: number) => {
              const assocId = assoc.source === personId ? assoc.target : assoc.source;
              return (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <Link href={`/profiles/${assocId}`} className="font-medium hover:underline flex items-center gap-2">
                    <User className="w-3 h-3" /> {assocId}
                  </Link>
                  <Badge variant="outline" className="text-xs">{assoc.type}</Badge>
                </div>
              );
            }) : <div className="text-sm text-muted-foreground">No direct associates mapped.</div>}
          </div>
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/network?focus=${personId}`}>
                <LinkIcon className="w-4 h-4 mr-2" />
                View Full Network
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Linked Vehicles */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Car className="w-5 h-5 text-secondary" />
            Linked Vehicles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {vehicles.length > 0 ? vehicles.map((veh: any, idx: number) => {
              const vehId = veh.source === personId ? veh.target : veh.source;
              return (
                <div key={idx} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                  <span className="font-mono">{vehId}</span>
                  <span className="text-xs text-muted-foreground">{veh.type}</span>
                </div>
              );
            }) : <div className="text-sm text-muted-foreground">No vehicles linked.</div>}
          </div>
        </CardContent>
      </Card>

      {/* Linked Phones */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Phone className="w-5 h-5 text-secondary" />
            Linked Phones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {phones.length > 0 ? phones.map((phone: any, idx: number) => {
              const phoneId = phone.source === personId ? phone.target : phone.source;
              return (
                <div key={idx} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                  <span className="font-mono">{phoneId}</span>
                  <span className="text-xs text-muted-foreground">{phone.type}</span>
                </div>
              );
            }) : <div className="text-sm text-muted-foreground">No phones linked.</div>}
          </div>
        </CardContent>
      </Card>
      
      {/* Linked Bank Accounts */}
      {bankAccounts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="w-5 h-5 text-secondary" />
              Linked Bank Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bankAccounts.map((account: any, idx: number) => {
                const accountId = account.source === personId ? account.target : account.source;
                return (
                  <div key={idx} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                    <span className="font-mono">{accountId}</span>
                    <span className="text-xs text-muted-foreground">{account.type}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
