import { useState, useEffect, useCallback } from 'react';
import { 
  userManagementService, 
  type UserProfile, 
  type UserStats, 
  type UserFilters,
  type CreateUserData,
  type UpdateUserData
} from '@/services/userManagementService';
import { useToast } from '@/hooks/use-toast';

export function useUserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    premiumUsers: 0,
    bannedUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
    activeUsersToday: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });

  const { toast } = useToast();

  const loadUsers = useCallback(async (filters: UserFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await userManagementService.getUsers(filters);
      
      setUsers(result.users);
      setPagination({
        page: result.page,
        totalPages: result.totalPages,
        total: result.total
      });

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load users';
      setError(errorMessage);
      toast({
        title: "Error Loading Users",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadStats = useCallback(async () => {
    try {
      const stats = await userManagementService.getUserStats();
      setUserStats(stats);
    } catch (err: any) {
      console.error('Failed to load user stats:', err);
    }
  }, []);

  const createUser = useCallback(async (userData: CreateUserData) => {
    try {
      setLoading(true);
      
      const newUser = await userManagementService.createUser(userData);
      
      toast({
        title: "User Created",
        description: `Successfully created user ${userData.email}`,
      });

      // Refresh users and stats
      await loadUsers();
      await loadStats();

      return newUser;

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create user';
      toast({
        title: "Error Creating User",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadUsers, loadStats, toast]);

  const updateUser = useCallback(async (userId: string, updates: UpdateUserData) => {
    try {
      setLoading(true);
      
      await userManagementService.updateUser(userId, updates);
      
      toast({
        title: "User Updated",
        description: "User has been successfully updated",
      });

      // Refresh users and stats
      await loadUsers();
      await loadStats();

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update user';
      toast({
        title: "Error Updating User",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadUsers, loadStats, toast]);

  const deleteUser = useCallback(async (userId: string, email: string) => {
    try {
      setLoading(true);
      
      await userManagementService.deleteUser(userId);
      
      toast({
        title: "User Deleted",
        description: `Successfully deleted ${email}`,
      });

      // Refresh users and stats
      await loadUsers();
      await loadStats();

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete user';
      toast({
        title: "Error Deleting User",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadUsers, loadStats, toast]);

  const toggleUserBan = useCallback(async (userId: string, email: string, ban: boolean) => {
    try {
      setLoading(true);
      
      await userManagementService.toggleUserBan(userId, ban);
      
      toast({
        title: ban ? "User Banned" : "User Unbanned",
        description: `${email} has been ${ban ? 'banned' : 'unbanned'}`,
      });

      // Refresh users
      await loadUsers();

    } catch (err: any) {
      const errorMessage = err.message || `Failed to ${ban ? 'ban' : 'unban'} user`;
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadUsers, toast]);

  const exportUsers = useCallback(async (filters: UserFilters = {}) => {
    try {
      setLoading(true);
      
      const csvContent = await userManagementService.exportUsers(filters);
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Users exported to CSV file",
      });

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to export users';
      toast({
        title: "Export Failed",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const bulkUpdateUsers = useCallback(async (userIds: string[], updates: UpdateUserData) => {
    try {
      setLoading(true);
      
      await userManagementService.bulkUpdateUsers(userIds, updates);
      
      toast({
        title: "Bulk Update Complete",
        description: `Successfully updated ${userIds.length} users`,
      });

      // Refresh users and stats
      await loadUsers();
      await loadStats();

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to bulk update users';
      toast({
        title: "Bulk Update Failed",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadUsers, loadStats, toast]);

  const resetUserPassword = useCallback(async (userId: string, newPassword: string) => {
    try {
      await userManagementService.resetUserPassword(userId, newPassword);
      
      toast({
        title: "Password Reset",
        description: "User password has been reset successfully",
      });

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to reset password';
      toast({
        title: "Password Reset Failed",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  }, [toast]);

  const sendPasswordResetEmail = useCallback(async (email: string) => {
    try {
      await userManagementService.sendPasswordResetEmail(email);
      
      toast({
        title: "Reset Email Sent",
        description: `Password reset email sent to ${email}`,
      });

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send reset email';
      toast({
        title: "Failed to Send Email",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  }, [toast]);

  // Auto-load data on mount
  useEffect(() => {
    loadUsers();
    loadStats();
  }, [loadUsers, loadStats]);

  return {
    // State
    users,
    userStats,
    loading,
    error,
    pagination,

    // Actions
    loadUsers,
    loadStats,
    createUser,
    updateUser,
    deleteUser,
    toggleUserBan,
    exportUsers,
    bulkUpdateUsers,
    resetUserPassword,
    sendPasswordResetEmail,

    // Utilities
    refresh: () => {
      loadUsers();
      loadStats();
    }
  };
}
