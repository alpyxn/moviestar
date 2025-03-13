import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import adminApi from '@/api/adminApi';
import { User } from '@/api/apiService';
import {
  Ban,
  CheckCircle,
  Loader2,
  Search,
  Shield,
  ExternalLink,
  MoreHorizontal,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // State for ban/unban dialog
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isBanning, setIsBanning] = useState(false); // true for ban, false for unban

  const navigate = useNavigate();
  const { toast } = useToast();
  const { keycloak, initialized } = useKeycloak();

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      if (!initialized || !keycloak.authenticated) return;
      
      try {
        setLoading(true);
        
        // Ensure token is fresh before making admin requests
        if (keycloak.authenticated) {
          try {
            await keycloak.updateToken(30);
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            keycloak.login();
            return;
          }
        }
        
        const allUsers = await adminApi.getAllUsers();
        setUsers(allUsers);
        setFilteredUsers(allUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Error',
          description: 'Failed to load users data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [keycloak, initialized]);

  // Filter users when search query or status filter changes
  useEffect(() => {
    if (users.length === 0) return;
    
    let result = [...users];
    
    // Apply status filter
    if (statusFilter === 'active') {
      result = result.filter(user => user.status === 'ACTIVE');
    } else if (statusFilter === 'banned') {
      result = result.filter(user => user.status === 'BANNED');
    }
    
    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user => 
        user.username.toLowerCase().includes(query) || 
        (user.email && user.email.toLowerCase().includes(query))
      );
    }
    
    setFilteredUsers(result);
  }, [users, searchQuery, statusFilter]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Get user initials for avatar
  const getUserInitials = (username: string): string => {
    return username.charAt(0).toUpperCase();
  };

  // Handle opening ban dialog
  const handleOpenBanDialog = (user: User, shouldBan: boolean) => {
    setSelectedUser(user);
    setIsBanning(shouldBan);
    setBanDialogOpen(true);
  };

  // Handle ban/unban action
  const handleBanAction = async () => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    try {
      // Ensure token is fresh before making admin requests
      if (keycloak.authenticated) {
        try {
          await keycloak.updateToken(30);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          toast({
            title: 'Authentication Error',
            description: 'Please login again to continue',
            variant: 'destructive',
          });
          keycloak.login();
          return;
        }
      }
      
      if (isBanning) {
        await adminApi.banUser(selectedUser.username);
        toast({
          title: 'User Banned',
          description: `${selectedUser.username} has been banned successfully`,
        });
      } else {
        await adminApi.unbanUser(selectedUser.username);
        toast({
          title: 'User Unbanned',
          description: `${selectedUser.username} has been unbanned successfully`,
        });
      }
      
      // Update the user in the list
      const updatedUsers = users.map(user => {
        if (user.username === selectedUser.username) {
          return { ...user, status: isBanning ? 'BANNED' : 'ACTIVE' };
        }
        return user;
      });
      
      setUsers(updatedUsers);
    } catch (error) {
      console.error(`Error ${isBanning ? 'banning' : 'unbanning'} user:`, error);
      toast({
        title: 'Action Failed',
        description: `Failed to ${isBanning ? 'ban' : 'unban'} user. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
      setBanDialogOpen(false);
      setSelectedUser(null);
    }
  };

  if (!initialized || !keycloak.authenticated) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        <span className="ml-2">{!initialized ? "Initializing..." : "Authenticating..."}</span>
      </div>
    );
  }

  // Check if user is admin
  const isAdmin = keycloak.hasRealmRole('ADMIN');
  
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Shield className="h-16 w-16 mx-auto text-red-500 mb-4" />
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-500 mb-6">You don't have permission to access this page.</p>
        <Button onClick={() => navigate('/movies')}>
          Go to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-yellow-500" />
              User Management
            </CardTitle>
            <CardDescription>
              View and manage all users in the system
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search by username or email..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 items-center">
              <Filter size={18} className="text-gray-500 hidden sm:block" />
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active Users</SelectItem>
                  <SelectItem value="banned">Banned Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Users Table */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead className="hidden sm:table-cell">Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  
                  <TableBody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map(user => (
                        <TableRow key={user.username}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                {user.profilePictureUrl ? (
                                  <img 
                                    src={user.profilePictureUrl} 
                                    alt={user.username}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.onerror = null;
                                      target.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <AvatarFallback>
                                    {getUserInitials(user.username)}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <span className="font-medium truncate max-w-[100px] md:max-w-none">{user.username}</span>
                            </div>
                          </TableCell>
                          
                          <TableCell className="hidden sm:table-cell">
                            <span className="truncate block max-w-[120px] lg:max-w-none">
                              {user.email || 'N/A'}
                            </span>
                          </TableCell>
                          
                          <TableCell>
                            {user.status === 'ACTIVE' ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-200 flex w-min items-center gap-1 whitespace-nowrap">
                                <CheckCircle size={12} />
                                <span className="hidden xs:inline">Active</span>
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800 hover:bg-red-200 flex w-min items-center gap-1 whitespace-nowrap">
                                <Ban size={12} />
                                <span className="hidden xs:inline">Banned</span>
                              </Badge>
                            )}
                          </TableCell>
                          
                          <TableCell className="hidden md:table-cell">
                            {formatDate(user.createdAt)}
                          </TableCell>
                          
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel className="hidden sm:block">Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator className="hidden sm:block" />
                                <DropdownMenuItem asChild>
                                  <Link to={`/users/${user.username}`} className="flex items-center">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    View profile
                                  </Link>
                                </DropdownMenuItem>
                                {user.status === 'ACTIVE' ? (
                                  <DropdownMenuItem 
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => handleOpenBanDialog(user, true)}
                                  >
                                    <Ban className="mr-2 h-4 w-4" />
                                    Ban user
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    className="text-green-600 focus:text-green-600"
                                    onClick={() => handleOpenBanDialog(user, false)}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Unban user
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No users found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-4 text-sm text-gray-500">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Ban/Unban Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isBanning ? 'Ban User' : 'Unban User'}
            </DialogTitle>
            <DialogDescription>
              {isBanning 
                ? `Are you sure you want to ban ${selectedUser?.username}? They will no longer be able to log in.`
                : `Are you sure you want to unban ${selectedUser?.username}? They will be able to log in again.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBanDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant={isBanning ? "destructive" : "default"}
              onClick={handleBanAction}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isBanning ? 'Banning...' : 'Unbanning...'}
                </>
              ) : (
                isBanning ? 'Ban User' : 'Unban User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
