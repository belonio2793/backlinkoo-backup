import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { formatErrorForUI } from '@/utils/errorUtils';
import { adminUserCreationService, type CreateUserPayload } from '@/services/adminUserCreationService';
import { UserPlus, Eye, EyeOff, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

interface CreateUserDialogProps {
  onUserCreated?: (user: any) => void;
}

export function CreateUserDialog({ onUserCreated }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<CreateUserPayload>({
    email: '',
    password: '',
    display_name: '',
    role: 'user',
    auto_confirm: true
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      console.log('🔨 Creating user with data:', {
        ...formData,
        password: '[HIDDEN]'
      });
      
      const result = await adminUserCreationService.createUser(formData);
      
      if (!result.success) {
        setError(result.error || 'Failed to create user');
        return;
      }
      
      setSuccess(`User ${formData.email} created successfully!`);
      
      // Clear form
      setFormData({
        email: '',
        password: '',
        display_name: '',
        role: 'user',
        auto_confirm: true
      });
      
      toast({
        title: "User Created Successfully",
        description: `${formData.email} has been added to the system`,
      });
      
      // Notify parent component
      if (onUserCreated && result.profile) {
        onUserCreated(result.profile);
      }
      
      // Close dialog after a short delay to show success message
      setTimeout(() => {
        setOpen(false);
        setSuccess(null);
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Create user error:', error);
      setError(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const newPassword = adminUserCreationService.generateRandomPassword();
    setFormData(prev => ({ ...prev, password: newPassword }));
    toast({
      title: "Password Generated",
      description: "A secure password has been generated",
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setFormData({
        email: '',
        password: '',
        display_name: '',
        role: 'user',
        auto_confirm: true
      });
      setError(null);
      setSuccess(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add New User
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create a New User
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{formatErrorForUI(error)}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              type="text"
              placeholder="John Doe"
              value={formData.display_name}
              onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">User Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as 'user' | 'admin' }))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">User Password *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generatePassword}
                disabled={loading}
              >
                Generate
              </Button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password (min 6 characters)"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                disabled={loading}
                required
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto_confirm">Auto Confirm User</Label>
              <div className="text-sm text-muted-foreground">
                A confirmation email will not be sent when creating a user via this form.
              </div>
            </div>
            <Switch
              id="auto_confirm"
              checked={formData.auto_confirm}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_confirm: checked }))}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.email || !formData.password}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create User
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
