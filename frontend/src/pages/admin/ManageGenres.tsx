import { useState, useEffect } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Pencil, Trash2, X, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import adminApi from '@/api/adminApi';
import { Genre } from '@/api/apiService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ManageGenres() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGenre, setNewGenre] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();
  const { keycloak, initialized } = useKeycloak();

  // Fetch genres on component mount
  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      const data = await adminApi.getGenres();
      setGenres(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load genres",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddGenre = async () => {
    if (!newGenre.trim()) return;
    
    try {
      await adminApi.createGenre({ genre: newGenre });
      toast({
        title: "Success",
        description: "Genre added successfully",
      });
      setNewGenre('');
      fetchGenres();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add genre",
        variant: "destructive",
      });
    }
  };

  const handleEditStart = (genre: Genre) => {
    setEditingId(genre.id);
    setEditValue(genre.genre);
  };

  const handleEditSave = async () => {
    if (!editingId || !editValue.trim()) return;
    
    try {
      await adminApi.updateGenre(editingId, { genre: editValue });
      toast({
        title: "Success",
        description: "Genre updated successfully",
      });
      setEditingId(null);
      fetchGenres();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update genre",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await adminApi.deleteGenre(id);
      toast({
        title: "Success",
        description: "Genre deleted successfully",
      });
      fetchGenres();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete genre",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  if (!initialized || !keycloak.authenticated) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        <span className="ml-2">
          {!initialized ? "Initializing..." : "Authenticating..."}
        </span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Manage Genres</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add New Genre Form */}
          <div className="flex gap-2 mb-6">
            <Input
              placeholder="Enter new genre"
              value={newGenre}
              onChange={(e) => setNewGenre(e.target.value)}
              className="max-w-xs"
            />
            <Button 
              onClick={handleAddGenre}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Add Genre
            </Button>
          </div>

          {/* Genres Table */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Genre</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {genres.map((genre) => (
                  <TableRow key={genre.id}>
                    <TableCell>
                      {editingId === genre.id ? (
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="max-w-xs"
                        />
                      ) : (
                        genre.genre
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {editingId === genre.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleEditSave}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditStart(genre)}
                            >
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(genre.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the genre.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => deleteId && handleDelete(deleteId)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>
  );
}
