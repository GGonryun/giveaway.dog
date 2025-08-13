'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Trophy,
  Users,
  Shuffle,
  Mail,
  Download,
  Calendar,
  Gift,
  Crown,
  Star,
  Award,
  CheckCircle,
  Clock,
  Send
} from 'lucide-react';
import { useState } from 'react';

interface SweepstakesWinnersProps {
  sweepstakesId: string;
}

interface Winner {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  selectedAt: string;
  notificationStatus: 'sent' | 'pending' | 'failed';
  responseStatus: 'pending' | 'claimed' | 'declined';
  prize: string;
  position: number;
}

// Mock winners data
const mockWinners: Winner[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    selectedAt: '2024-01-15T10:30:00Z',
    notificationStatus: 'sent',
    responseStatus: 'claimed',
    prize: 'iPhone 15 Pro Max',
    position: 1
  },
  {
    id: '2', 
    name: 'Mike Chen',
    email: 'mike.chen@gmail.com',
    selectedAt: '2024-01-15T10:30:00Z',
    notificationStatus: 'sent',
    responseStatus: 'pending',
    prize: '$500 Gift Card',
    position: 2
  },
  {
    id: '3',
    name: 'Emma Williams', 
    email: 'emma.w@outlook.com',
    selectedAt: '2024-01-15T10:30:00Z',
    notificationStatus: 'pending',
    responseStatus: 'pending',
    prize: '$250 Gift Card',
    position: 3
  }
];

export const SweepstakesWinners = ({ sweepstakesId }: SweepstakesWinnersProps) => {
  const [winners, setWinners] = useState<Winner[]>(mockWinners);
  const [numberOfWinners, setNumberOfWinners] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(winners.length > 0);

  const performDraw = async () => {
    setIsDrawing(true);
    // Simulate drawing process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsDrawing(false);
    setHasDrawn(true);
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Award className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Star className="h-5 w-5 text-amber-600" />;
      default:
        return <Trophy className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationStatusBadge = (status: Winner['notificationStatus']) => {
    switch (status) {
      case 'sent':
        return <Badge className="text-xs">Sent</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="text-xs">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="text-xs">Failed</Badge>;
    }
  };

  const getResponseStatusBadge = (status: Winner['responseStatus']) => {
    switch (status) {
      case 'claimed':
        return <Badge className="text-xs bg-green-500">Claimed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-xs">Pending</Badge>;
      case 'declined':
        return <Badge variant="destructive" className="text-xs">Declined</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {!hasDrawn ? (
        /* Drawing Interface */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shuffle className="h-5 w-5" />
              <span>Draw Winners</span>
            </CardTitle>
            <CardDescription>
              Randomly select winners from all eligible entries
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="num-winners">Number of Winners</Label>
                <Input
                  id="num-winners"
                  type="number"
                  min="1"
                  max="10"
                  value={numberOfWinners}
                  onChange={(e) => setNumberOfWinners(parseInt(e.target.value) || 1)}
                />
              </div>
              
              <div>
                <Label htmlFor="draw-method">Drawing Method</Label>
                <Select defaultValue="random">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="random">Random Selection</SelectItem>
                    <SelectItem value="weighted">Weighted by Entries</SelectItem>
                    <SelectItem value="manual">Manual Selection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <div className="p-6 border-2 border-dashed border-muted rounded-lg">
                <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">Ready to draw winners?</p>
                <p className="text-sm text-muted-foreground">
                  {numberOfWinners} winner{numberOfWinners !== 1 ? 's' : ''} will be selected from 5,432 eligible entries
                </p>
              </div>
              
              <Button 
                size="lg" 
                onClick={performDraw} 
                disabled={isDrawing}
                className="w-full md:w-auto"
              >
                {isDrawing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Drawing Winners...
                  </>
                ) : (
                  <>
                    <Shuffle className="h-4 w-4 mr-2" />
                    Draw Winners
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Winners Display */
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>Selected Winners</span>
                <Badge variant="secondary">{winners.length}</Badge>
              </CardTitle>
              <CardDescription>
                Winners drawn on {new Date().toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {winners.map((winner) => (
                  <div key={winner.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start space-x-4">
                      <div className="flex items-center space-x-2">
                        {getPositionIcon(winner.position)}
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={winner.avatar} alt={winner.name} />
                          <AvatarFallback>{getInitials(winner.name)}</AvatarFallback>
                        </Avatar>
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold">{winner.name}</h4>
                              <span className="text-sm text-muted-foreground">#{winner.position}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{winner.email}</p>
                            <p className="text-sm font-medium text-blue-600">{winner.prize}</p>
                          </div>
                          
                          <div className="text-right space-y-1">
                            <div className="text-xs text-muted-foreground">
                              Selected {new Date(winner.selectedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3" />
                              <span className="text-xs">Notification:</span>
                              {getNotificationStatusBadge(winner.notificationStatus)}
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="h-3 w-3" />
                              <span className="text-xs">Response:</span>
                              {getResponseStatusBadge(winner.responseStatus)}
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            {winner.notificationStatus === 'pending' && (
                              <Button size="sm" variant="outline">
                                <Send className="h-3 w-3 mr-1" />
                                Send
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Mail className="h-3 w-3 mr-1" />
                              Contact
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Winners Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="h-5 w-5" />
                <span>Winner Management</span>
              </CardTitle>
              <CardDescription>
                Export winner data and manage notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Winners List
                </Button>
                
                <Button variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Send All Notifications
                </Button>
                
                <Button variant="outline">
                  <Shuffle className="h-4 w-4 mr-2" />
                  Redraw Winners
                </Button>
                
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Announcement
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Winner Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Winner Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {winners.filter(w => w.responseStatus === 'claimed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Claimed</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">
                    {winners.filter(w => w.responseStatus === 'pending').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">
                    {winners.filter(w => w.notificationStatus === 'sent').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Notified</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {Math.round((winners.filter(w => w.responseStatus === 'claimed').length / winners.length) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Claim Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
