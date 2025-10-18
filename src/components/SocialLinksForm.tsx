import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useState } from 'react';

interface SocialLinks {
  yandex_music_url: string;
  vk_group_url: string;
  tiktok_url: string;
}

interface Props {
  onComplete: (links: SocialLinks) => void;
  initialLinks?: SocialLinks;
}

export default function SocialLinksForm({ onComplete, initialLinks }: Props) {
  const [links, setLinks] = useState<SocialLinks>(
    initialLinks || {
      yandex_music_url: '',
      vk_group_url: '',
      tiktok_url: ''
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateUrl = (url: string, platform: string): boolean => {
    if (!url) return false;
    
    try {
      const urlObj = new URL(url);
      
      if (platform === 'yandex' && !urlObj.hostname.includes('music.yandex')) {
        setErrors(prev => ({ ...prev, yandex_music_url: 'Введите корректную ссылку на Яндекс.Музыку' }));
        return false;
      }
      
      if (platform === 'vk' && !urlObj.hostname.includes('vk.com')) {
        setErrors(prev => ({ ...prev, vk_group_url: 'Введите корректную ссылку на VK' }));
        return false;
      }
      
      if (platform === 'tiktok' && !urlObj.hostname.includes('tiktok.com')) {
        setErrors(prev => ({ ...prev, tiktok_url: 'Введите корректную ссылку на TikTok' }));
        return false;
      }
      
      return true;
    } catch {
      setErrors(prev => ({ ...prev, [`${platform}_url`]: 'Введите корректный URL' }));
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const isYandexValid = validateUrl(links.yandex_music_url, 'yandex');
    const isVkValid = validateUrl(links.vk_group_url, 'vk');

    if (isYandexValid && isVkValid) {
      onComplete(links);
    }
  };

  const handleChange = (field: keyof SocialLinks, value: string) => {
    setLinks(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-black to-pink-900">
      <Card className="w-full max-w-2xl bg-black/60 border-white/20 backdrop-blur-xl">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Icon name="Music" size={32} className="text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-white">
            Привет, артист! 🎤
          </CardTitle>
          <p className="text-gray-300 mt-2">
            Заполни свои музыкальные площадки, чтобы мы могли отслеживать твою статистику
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="yandex" className="text-white flex items-center gap-2">
                <Icon name="Music" size={18} className="text-red-400" />
                Яндекс.Музыка <span className="text-red-400">*</span>
              </Label>
              <Input
                id="yandex"
                type="url"
                placeholder="https://music.yandex.ru/artist/..."
                value={links.yandex_music_url}
                onChange={(e) => handleChange('yandex_music_url', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              />
              {errors.yandex_music_url && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <Icon name="AlertCircle" size={14} />
                  {errors.yandex_music_url}
                </p>
              )}
              <p className="text-xs text-gray-400">
                Пример: https://music.yandex.ru/artist/12345678
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vk" className="text-white flex items-center gap-2">
                <Icon name="Users" size={18} className="text-blue-400" />
                Группа ВКонтакте <span className="text-red-400">*</span>
              </Label>
              <Input
                id="vk"
                type="url"
                placeholder="https://vk.com/yourgroup"
                value={links.vk_group_url}
                onChange={(e) => handleChange('vk_group_url', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              />
              {errors.vk_group_url && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <Icon name="AlertCircle" size={14} />
                  {errors.vk_group_url}
                </p>
              )}
              <p className="text-xs text-gray-400">
                Пример: https://vk.com/myartistpage
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tiktok" className="text-white flex items-center gap-2">
                <Icon name="Video" size={18} className="text-pink-400" />
                TikTok (необязательно)
              </Label>
              <Input
                id="tiktok"
                type="url"
                placeholder="https://www.tiktok.com/@username"
                value={links.tiktok_url}
                onChange={(e) => handleChange('tiktok_url', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              />
              {errors.tiktok_url && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <Icon name="AlertCircle" size={14} />
                  {errors.tiktok_url}
                </p>
              )}
              <p className="text-xs text-gray-400">
                Пример: https://www.tiktok.com/@yourname
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-6 text-lg"
            >
              <Icon name="Check" size={20} className="mr-2" />
              Сохранить и продолжить
            </Button>

            <p className="text-xs text-center text-gray-400">
              * Обязательные поля для заполнения
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
