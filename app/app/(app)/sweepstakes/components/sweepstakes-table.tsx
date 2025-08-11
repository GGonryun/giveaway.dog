"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  Edit,
  Copy,
  Pause,
  Play,
  Trash2,
  MoreHorizontal,
  Calendar,
  Users,
  Target,
  Shield,
  Clock
} from "lucide-react";
import Link from "next/link";

interface SweepstakesItem {
  id: string;
  title: string;
  status: 'active' | 'ending-soon' | 'draft' | 'paused' | 'completed';
  entries: number;
  uniqueEntrants: number;
  conversionRate: number;
  botRate: number;
  timeLeft: string;
  createdAt: string;
  topSource: string;
  prize: string;
}

interface SweepstakesTableProps {
  sweepstakes: SweepstakesItem[];
}

export function SweepstakesTable({ sweepstakes }: SweepstakesTableProps) {
  const getStatusBadge = (status: SweepstakesItem['status']) => {
    const variants = {
      active: { variant: 'default' as const, label: 'Active', color: 'text-green-600' },
      'ending-soon': { variant: 'destructive' as const, label: 'Ending Soon', color: 'text-red-600' },
      draft: { variant: 'secondary' as const, label: 'Draft', color: 'text-gray-600' },
      paused: { variant: 'outline' as const, label: 'Paused', color: 'text-yellow-600' },
      completed: { variant: 'secondary' as const, label: 'Completed', color: 'text-blue-600' }
    };
    
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: SweepstakesItem['status']) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'ending-soon':
        return <Clock className="h-4 w-4 text-red-500" />;
      case 'draft':
        return <Edit className="h-4 w-4 text-gray-500" />;
      case 'completed':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>All Sweepstakes</span>
          <Badge variant="secondary">{sweepstakes.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Sweepstakes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Entries</TableHead>
                <TableHead className="text-right">Conversion</TableHead>
                <TableHead className="text-right">Bot Rate</TableHead>
                <TableHead>Time Left</TableHead>
                <TableHead>Top Source</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sweepstakes.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(item.status)}
                        <div>
                          <Link 
                            href={`/app/sweepstakes/${item.id}`}
                            className="font-medium hover:text-primary hover:underline line-clamp-1"
                          >
                            {item.title}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {item.prize}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(item.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="space-y-1">
                      <div className="font-medium flex items-center justify-end space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{item.entries.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.uniqueEntrants.toLocaleString()} unique
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Target className="h-3 w-3" />
                      <span className={`font-medium ${
                        item.conversionRate > 8 ? 'text-green-600' : 
                        item.conversionRate > 5 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {item.conversionRate.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Shield className="h-3 w-3" />
                      <span className={`font-medium ${
                        item.botRate > 20 ? 'text-red-500' : 
                        item.botRate > 10 ? 'text-yellow-500' : 'text-green-500'
                      }`}>
                        {item.botRate.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1 text-sm">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{item.timeLeft}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {item.topSource}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/app/sweepstakes/${item.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/app/sweepstakes/${item.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {item.status === 'active' ? (
                            <DropdownMenuItem className="text-yellow-600">
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </DropdownMenuItem>
                          ) : item.status === 'paused' ? (
                            <DropdownMenuItem className="text-green-600">
                              <Play className="h-4 w-4 mr-2" />
                              Resume
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Empty State */}
        {sweepstakes.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No sweepstakes found</p>
            <Button asChild className="mt-2" size="sm">
              <Link href="/app/host">Create Your First Sweepstakes</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}