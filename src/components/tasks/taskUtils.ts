import { uploadFile as uploadFileUtil } from '@/utils/uploadFile';

export const API_URL = 'https://functions.poehali.dev/13e06494-4f4d-4854-b126-bbc191bf0890';
export const UPLOAD_URL = 'https://functions.poehali.dev/08bf9d4e-6ddc-4b6b-91a0-84187cbd89fa';

export const getPriorityColor = (priority: string) => {
  const colors = {
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    urgent: 'bg-red-500/20 text-red-400 border-red-500/30'
  };
  return colors[priority as keyof typeof colors] || 'bg-gray-500/20';
};

export const getStatusColor = (status: string) => {
  const colors = {
    pending: 'bg-gray-500/20 text-gray-400',
    in_progress: 'bg-yellow-500/20 text-yellow-400',
    completed: 'bg-green-500/20 text-green-400'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-500/20';
};

export const getPriorityText = (priority: string) => {
  const texts = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
    urgent: 'Срочно'
  };
  return texts[priority as keyof typeof texts] || priority;
};

export const getStatusText = (status: string) => {
  const texts = {
    pending: 'Ожидает',
    in_progress: 'В работе',
    completed: 'Выполнено'
  };
  return texts[status as keyof typeof texts] || status;
};

export const uploadFile = async (file: File, uploadUrl: string) => {
  const result = await uploadFileUtil(file);
  return { url: result.url, name: result.fileName, size: result.fileSize };
};