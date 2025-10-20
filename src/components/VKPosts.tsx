import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { API_ENDPOINTS } from '@/config/api';

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
      const response = await fetch(`${API_ENDPOINTS.VK_POSTS}?count=6&_=${Date.now()}`);
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
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div 
            key={i} 
            className="relative bg-gradient-to-br from-card/30 to-black/30 border border-primary/10 backdrop-blur-xl rounded-2xl overflow-hidden animate-pulse"
          >
            <div className="h-72 bg-gradient-to-br from-primary/5 to-secondary/5"></div>
            <div className="p-6 space-y-3">
              <div className="h-3 bg-primary/10 rounded-full w-1/4"></div>
              <div className="h-4 bg-primary/10 rounded-full w-full"></div>
              <div className="h-4 bg-primary/10 rounded-full w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative bg-gradient-to-br from-card/30 to-black/30 border border-primary/20 backdrop-blur-xl rounded-2xl p-12 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
        <div className="relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Icon name="AlertCircle" size={40} className="text-black" />
          </div>
          <p className="text-gray-400 mb-6 text-lg">{error}</p>
          <a 
            href="https://vk.com/smm420" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-black font-bold rounded-xl hover:scale-105 transition-transform shadow-lg shadow-primary/30"
          >
            <Icon name="ExternalLink" size={20} />
            Открыть группу ВКонтакте
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 p-3 md:p-0">
      {posts.map((post, index) => (
        <div
          key={post.id}
          className="group relative bg-gradient-to-br from-card/30 to-black/30 border border-primary/10 backdrop-blur-xl hover:border-primary/30 transition-all duration-500 rounded-xl md:rounded-2xl overflow-hidden md:hover:scale-105 md:hover:-translate-y-2"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {post.attachments.length > 0 && post.attachments[0].type === 'photo' && (
            <div className="relative h-48 md:h-64 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
              <img 
                src={post.attachments[0].url} 
                alt="Post" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute top-3 right-3 md:top-4 md:right-4 z-20 bg-black/60 backdrop-blur-sm px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs text-primary border border-primary/30">
                {formatDate(post.date)}
              </div>
            </div>
          )}
          
          <div className="p-4 md:p-6 relative z-10">
            {(!post.attachments.length || post.attachments[0].type !== 'photo') && (
              <p className="text-[10px] md:text-xs text-primary/60 mb-2 md:mb-3 uppercase tracking-wider">{formatDate(post.date)}</p>
            )}
            
            {post.text && (
              <p className="text-gray-300 mb-4 line-clamp-3 leading-relaxed text-sm group-hover:text-white transition-colors">
                {post.text}
              </p>
            )}

            {post.attachments.some(a => a.type === 'audio') && (
              <div className="mb-4 p-4 bg-gradient-to-r from-primary/10 to-transparent rounded-xl border border-primary/20 group-hover:border-primary/40 transition-colors">
                {post.attachments.filter(a => a.type === 'audio').slice(0, 2).map((audio, idx) => (
                  <div key={idx} className="flex items-center gap-3 mb-2 last:mb-0">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Icon name="Music" size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{audio.title}</p>
                      <p className="text-xs text-gray-500 truncate">{audio.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500 mb-5">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <Icon name="Heart" size={14} />
                  {formatNumber(post.likes)}
                </span>
                <span className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <Icon name="MessageCircle" size={14} />
                  {formatNumber(post.comments)}
                </span>
                <span className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <Icon name="Share2" size={14} />
                  {formatNumber(post.reposts)}
                </span>
              </div>
              {post.views > 0 && (
                <span className="flex items-center gap-1.5">
                  <Icon name="Eye" size={14} />
                  {formatNumber(post.views)}
                </span>
              )}
            </div>

            <a 
              href={`https://vk.com/smm420?w=wall-214160827_${post.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button 
                variant="outline" 
                className="w-full border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all group-hover:shadow-lg group-hover:shadow-primary/20"
              >
                <Icon name="ExternalLink" size={16} className="mr-2" />
                Открыть в ВК
              </Button>
            </a>
          </div>

          <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
        </div>
      ))}
    </div>
  );
}