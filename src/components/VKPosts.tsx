import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface VKPost {
  id: number;
  date: number;
  text: string;
  likes: number;
  reposts: number;
  views: number;
  comments: number;
  attachments: Array<{
    type: string;
    url?: string;
    title?: string;
    artist?: string;
  }>;
}

export default function VKPosts() {
  const [posts, setPosts] = useState<VKPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://functions.poehali.dev/2a44eeac-eb38-454b-a031-3713ae83a3d2?count=6&_=${Date.now()}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setPosts(data.posts || []);
      }
    } catch (err) {
      setError('Не удалось загрузить посты');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-card/80 border-primary/20 backdrop-blur-sm animate-pulse">
            <CardContent className="p-6">
              <div className="h-48 bg-gray-700 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-card/80 border-primary/20 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <Icon name="AlertCircle" size={48} className="mx-auto mb-4 text-yellow-500" />
          <p className="text-gray-400 mb-4">{error}</p>
          <a 
            href="https://vk.com/fourtwentyru" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0077FF] hover:bg-[#0066DD] text-white rounded-lg transition-all"
          >
            <Icon name="ExternalLink" size={18} />
            Открыть группу ВКонтакте
          </a>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <Card 
          key={post.id} 
          className="bg-card/80 border-primary/20 backdrop-blur-sm hover:border-primary/50 transition-all group"
        >
          <CardContent className="p-0">
            {post.attachments.length > 0 && post.attachments[0].type === 'photo' && (
              <div className="relative h-64 overflow-hidden rounded-t-lg">
                <img 
                  src={post.attachments[0].url} 
                  alt="Post" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            
            <div className="p-6">
              <p className="text-sm text-gray-400 mb-3">{formatDate(post.date)}</p>
              
              <p className="text-gray-300 mb-4 line-clamp-4">
                {post.text || 'Посмотреть в ВК'}
              </p>

              {post.attachments.some(a => a.type === 'audio') && (
                <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  {post.attachments.filter(a => a.type === 'audio').map((audio, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Icon name="Music" size={16} className="text-primary" />
                      <span className="text-sm text-gray-300">
                        {audio.artist} - {audio.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Icon name="Heart" size={16} />
                    {formatNumber(post.likes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="MessageCircle" size={16} />
                    {formatNumber(post.comments)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="Share2" size={16} />
                    {formatNumber(post.reposts)}
                  </span>
                </div>
                {post.views > 0 && (
                  <span className="flex items-center gap-1">
                    <Icon name="Eye" size={16} />
                    {formatNumber(post.views)}
                  </span>
                )}
              </div>

              <a 
                href={`https://vk.com/fourtwentyru?w=wall-214160827_${post.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full border-primary/30 hover:bg-primary/10">
                  <Icon name="ExternalLink" size={16} className="mr-2" />
                  Открыть в ВК
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}