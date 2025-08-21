'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Search,
  Filter,
  Star,
  Users,
  TrendingUp,
  Gift,
  Zap,
  Heart,
  Trophy,
  Crown,
  Sparkles
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  popularity: number;
  estimatedConversion: string;
  icon: React.ReactNode;
  tags: string[];
  preview?: string;
  bannerColor: string;
  bannerGradient: string;
}

const mockTemplates: Template[] = [
  {
    id: '1',
    title: 'Tech Product Launch',
    description: 'Perfect for launching new tech products with social media engagement',
    category: 'Tech',
    popularity: 95,
    estimatedConversion: '12-15%',
    icon: <Zap className="h-6 w-6" />,
    tags: ['Popular', 'High Converting', 'Social Media'],
    bannerColor: 'bg-blue-500',
    bannerGradient: 'from-blue-400 to-purple-600'
  },
  {
    id: '2',
    title: 'Holiday Gift Giveaway',
    description: 'Seasonal template optimized for holiday marketing campaigns',
    category: 'Seasonal',
    popularity: 88,
    estimatedConversion: '8-12%',
    icon: <Gift className="h-6 w-6" />,
    tags: ['Seasonal', 'Family Friendly', 'High Engagement'],
    bannerColor: 'bg-red-500',
    bannerGradient: 'from-red-400 to-pink-600'
  },
  {
    id: '3',
    title: 'Fitness Challenge',
    description: 'Motivate your audience with health and wellness focused giveaways',
    category: 'Health',
    popularity: 76,
    estimatedConversion: '10-14%',
    icon: <Heart className="h-6 w-6" />,
    tags: ['Health', 'Challenge', 'Community'],
    bannerColor: 'bg-green-500',
    bannerGradient: 'from-green-400 to-emerald-600'
  },
  {
    id: '4',
    title: 'Gaming Tournament',
    description: 'Engage gaming communities with competitive prize structures',
    category: 'Gaming',
    popularity: 84,
    estimatedConversion: '15-20%',
    icon: <Trophy className="h-6 w-6" />,
    tags: ['Gaming', 'Competitive', 'High Converting'],
    bannerColor: 'bg-orange-500',
    bannerGradient: 'from-orange-400 to-red-600'
  },
  {
    id: '5',
    title: 'Beauty & Lifestyle',
    description: 'Curated for beauty brands and lifestyle influencers',
    category: 'Beauty',
    popularity: 79,
    estimatedConversion: '9-13%',
    icon: <Sparkles className="h-6 w-6" />,
    tags: ['Beauty', 'Lifestyle', 'Influencer'],
    bannerColor: 'bg-pink-500',
    bannerGradient: 'from-pink-400 to-rose-600'
  },
  {
    id: '6',
    title: 'Premium Brand Experience',
    description: 'Luxury template for high-end brands and exclusive products',
    category: 'Luxury',
    popularity: 71,
    estimatedConversion: '6-10%',
    icon: <Crown className="h-6 w-6" />,
    tags: ['Luxury', 'Exclusive', 'Premium'],
    bannerColor: 'bg-purple-500',
    bannerGradient: 'from-purple-400 to-indigo-600'
  }
];

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popularity');

  const categories = ['all', 'Tech', 'Seasonal', 'Health', 'Gaming', 'Beauty', 'Luxury'];

  const filteredTemplates = mockTemplates
    .filter(template => {
      const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'popularity') return b.popularity - a.popularity;
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Giveaway Templates</h1>
        <p className="text-muted-foreground">
          Choose from our collection of proven templates to boost your campaign performance
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.slice(1).map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <TrendingUp className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Popularity</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden p-0">
            {/* Banner Image */}
            <div className={`h-32 bg-gradient-to-r ${template.bannerGradient} relative`}>
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute bottom-3 left-3">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white">
                  {template.icon}
                </div>
              </div>
              <div className="absolute top-3 right-3">
                <div className="flex items-center space-x-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-white font-medium">
                    {template.popularity}%
                  </span>
                </div>
              </div>
            </div>
            
            <CardHeader className="pb-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{template.title}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {template.category}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4 p-6 pt-0">
              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Est. Conversion:</span>
                  <span className="font-medium text-green-600">{template.estimatedConversion}</span>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-2 pt-2">
                <Button asChild className="flex-1" size="sm">
                  <Link href={`/app/create/new?template=${template.id}`}>
                    Use Template
                  </Link>
                </Button>
                <Button variant="outline" size="sm">
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-muted-foreground">No templates found matching your criteria</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Popular Templates Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Template Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">50+</div>
              <div className="text-sm text-muted-foreground">Available Templates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">2.3x</div>
              <div className="text-sm text-muted-foreground">Avg Conversion Boost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">10M+</div>
              <div className="text-sm text-muted-foreground">Total Entries Generated</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}