import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
}

interface Release {
  id: number;
  artist_id: number;
  title: string;
  release_date: string;
  cover_url: string;
  status: string;
}

interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [managers, setManagers] = useState<User[]>([]);
  const [artists, setArtists] = useState<User[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    const storedUsers = localStorage.getItem('users');
    if (storedUsers) {
      const users = JSON.parse(storedUsers);
      setManagers(users.filter((u: User) => u.role === 'manager'));
      setArtists(users.filter((u: User) => u.role === 'artist'));
    }

    const storedReleases = localStorage.getItem('releases');
    if (storedReleases) {
      setReleases(JSON.parse(storedReleases));
    }

    const storedSocials = localStorage.getItem('company_socials');
    if (storedSocials) {
      setSocials(JSON.parse(storedSocials));
    } else {
      setSocials([
        { platform: 'VK', url: 'https://vk.com/420smm', icon: 'vk' },
        { platform: 'Telegram', url: 'https://t.me/420smm', icon: 'send' },
        { platform: 'Instagram', url: 'https://instagram.com/420smm', icon: 'instagram' }
      ]);
    }
  }, []);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'director': return 'bg-purple-500';
      case 'manager': return 'bg-blue-500';
      case 'artist': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'released': return 'bg-green-500';
      case 'planned': return 'bg-yellow-500';
      case 'in_progress': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Icon name="Music" size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">420 SMM — Публичная страница</h1>
          <p className="text-sm text-gray-400">Обзор лейбла, артистов и релизов</p>
        </div>
      </div>

      <div className="space-y-12">
        <section className="text-center space-y-4">
          <h2 className="text-5xl font-bold text-white">
            Добро пожаловать в 420 SMM
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Мы продвигаем музыкальные таланты и помогаем артистам развиваться в digital-пространстве
          </p>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Icon name="Users" size={28} className="text-purple-400" />
            <h3 className="text-3xl font-bold text-white">Наша команда</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="Target" size={24} className="text-blue-400" />
                  <h4 className="text-xl font-semibold text-white">Менеджеры</h4>
                  <Badge className="ml-auto bg-blue-500">{managers.length}</Badge>
                </div>
                <div className="space-y-2">
                  {managers.length > 0 ? (
                    managers.map((manager) => (
                      <div key={manager.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <Icon name="User" size={20} className="text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{manager.full_name}</p>
                          <p className="text-sm text-gray-400">@{manager.username}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-4">Менеджеры появятся скоро</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="Mic" size={24} className="text-pink-400" />
                  <h4 className="text-xl font-semibold text-white">Артисты</h4>
                  <Badge className="ml-auto bg-pink-500">{artists.length}</Badge>
                </div>
                <div className="space-y-2">
                  {artists.length > 0 ? (
                    artists.map((artist) => (
                      <div key={artist.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                          <Icon name="Music" size={20} className="text-pink-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{artist.full_name}</p>
                          <p className="text-sm text-gray-400">@{artist.username}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-4">Артисты появятся скоро</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Icon name="Disc" size={28} className="text-pink-400" />
            <h3 className="text-3xl font-bold text-white">Релизы</h3>
          </div>

          {releases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {releases.map((release) => (
                <Card key={release.id} className="bg-black/40 border-white/10 backdrop-blur-sm overflow-hidden group hover:border-pink-500/50 transition-all">
                  <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-pink-500/20 relative overflow-hidden">
                    {release.cover_url ? (
                      <img src={release.cover_url} alt={release.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon name="Disc" size={64} className="text-white/20" />
                      </div>
                    )}
                    <Badge className={`absolute top-3 right-3 ${getStatusColor(release.status)}`}>
                      {release.status}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h4 className="text-lg font-semibold text-white mb-2">{release.title}</h4>
                    <p className="text-sm text-gray-400">
                      {release.release_date ? new Date(release.release_date).toLocaleDateString('ru-RU') : 'Скоро'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <Icon name="Music" size={48} className="text-white/20 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Релизы скоро появятся</p>
              </CardContent>
            </Card>
          )}
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Icon name="Share2" size={28} className="text-purple-400" />
            <h3 className="text-3xl font-bold text-white">Мы в соцсетях</h3>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            {socials.map((social, index) => (
              <a
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-6 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all hover:scale-105 group"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Icon name={social.icon as any} size={24} className="text-white" />
                </div>
                <span className="text-white font-semibold text-lg">{social.platform}</span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}