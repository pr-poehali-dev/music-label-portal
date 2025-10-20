import { uploadFile as uploadFileUtil } from '@/utils/uploadFile';
import { API_ENDPOINTS } from '@/config/api';

export const API_URL = API_ENDPOINTS.TASKS;
export const UPLOAD_URL = API_ENDPOINTS.UPLOAD_FILE;

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