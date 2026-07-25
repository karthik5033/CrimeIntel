"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Users, Lock, Key, Edit, Trash2 } from "lucide-react";

export function RoleManager() {
  const [roles, setRoles] = useState([
    { id: "ROLE_1", name: "Administrator", users: 5, permissions: ["*"], system: true },
    { id: "ROLE_2", name: "Investigator", users: 45, permissions: ["read:firs", "read:cases", "write:firs", "read:profiles"], system: false },
    { id: "ROLE_3", name: "Analyst", users: 12, permissions: ["read:firs", "read:financial", "read:profiles"], system: false },
    { id: "ROLE_4", name: "Field Officer", users: 120, permissions: ["read:firs", "create:firs"], system: false }
  ]);

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Role-Based Access Control</h3>
          <p className="text-sm text-muted-foreground">Manage user roles and permissions</p>
        </div>
        <Button className="gap-2">
          <Key className="w-4 h-4" />
          Create Role
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Assigned Users</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map(role => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Shield className={`w-4 h-4 ${role.system ? 'text-destructive' : 'text-primary'}`} />
                      <span className="font-semibold">{role.name}</span>
                      {role.system && <Badge variant="outline" className="text-[10px] ml-2">SYSTEM</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <Users className="w-4 h-4" />
                      {role.users}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map((p, i) => (
                        <Badge key={i} variant="secondary" className="font-mono text-[10px]">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" disabled={role.system}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" disabled={role.system}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
    </div>
  );
}
