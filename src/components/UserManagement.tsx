import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface User {
  id: number;
  username: string;
  role: 'artist' | 'manager' | 'director';
  full_name: string;
}

interface UserManagementProps {
  allUsers: User[];
  newUser: {
    username: string;
    full_name: string;
    role: string;
  };
  onNewUserChange: (user: { username: string; full_name: string; role: string }) => void;
  onCreateUser: () => void;
}

export default function UserManagement({ 
  allUsers, 
  newUser, 
  onNewUserChange, 
  onCreateUser 
}: UserManagementProps) {
  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/95">
        <CardHeader>
          <CardTitle className="text-primary">Создать нового пользователя</CardTitle>
          <CardDescription>Добавьте артиста или менеджера в систему</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new_username">Логин</Label>
              <Input
                id="new_username"
                placeholder="username"
                value={newUser.username}
                onChange={(e) => onNewUserChange({ ...newUser, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_full_name">Полное имя</Label>
              <Input
                id="new_full_name"
                placeholder="Иван Иванов"
                value={newUser.full_name}
                onChange={(e) => onNewUserChange({ ...newUser, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_role">Роль</Label>
              <Select value={newUser.role} onValueChange={(val) => onNewUserChange({ ...newUser, role: val })}>
                <SelectTrigger id="new_role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="artist">🎤 Артист</SelectItem>
                  <SelectItem value="manager">🎯 Менеджер</SelectItem>
                  <SelectItem value="director">👑 Руководитель</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={onCreateUser} className="w-full bg-secondary hover:bg-secondary/90">
            <Icon name="UserPlus" size={16} className="mr-2" />
            Создать пользователя (пароль: 12345)
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/95">
        <CardHeader>
          <CardTitle className="text-primary">Все пользователи</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {allUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">{u.full_name}</p>
                  <p className="text-sm text-muted-foreground">@{u.username}</p>
                </div>
                <Badge variant="outline" className="border-primary/50">
                  {u.role === 'director' ? '👑 Руководитель' : u.role === 'manager' ? '🎯 Менеджер' : '🎤 Артист'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
