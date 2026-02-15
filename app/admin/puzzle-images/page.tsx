'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fade,
  Alert,
  CircularProgress,
  Switch,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ImageIcon from '@mui/icons-material/Image';
import TuneIcon from '@mui/icons-material/Tune';
import { AdminGuard, useAdmin } from '../../components/AdminGuard';
import { DarkModeToggle } from '../../components/DarkModeToggle';
import { api } from '../../lib/api';
import { useSettings } from '../../lib/useSettings';
import type { PuzzleImage } from '../../lib/types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function PuzzleImagesAdmin() {
  const { logout } = useAdmin();
  const { loveMessages, floatingIcons, setLoveMessages, setFloatingIcons } = useSettings();
  const [images, setImages] = useState<PuzzleImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Upload form state
  const [title, setTitle] = useState('');
  const [imageData, setImageData] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<PuzzleImage | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const loadImages = useCallback(async () => {
    try {
      const list = await api.getPuzzleImages();
      setImages(list);
    } catch {
      // auth redirect handles 401
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadImages(); }, [loadImages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageData(result);
      setPreviewUrl(result);
      // Auto-fill title from filename if empty
      if (!title) {
        const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!title.trim() || !imageData) return;
    setError('');
    setUploading(true);
    try {
      await api.createPuzzleImage({ title: title.trim(), image_data: imageData });
      setTitle('');
      setImageData('');
      setPreviewUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deletePuzzleImage(deleteTarget.id);
      setDeleteTarget(null);
      loadImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const clearForm = () => {
    setTitle('');
    setImageData('');
    setPreviewUrl('');
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <DarkModeToggle />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Fade in={mounted} timeout={800}>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    mb: 1,
                    background: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, #FF8C00 0%, #DAA520 100%)'
                        : 'linear-gradient(135deg, #D2691E 0%, #8B4513 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Puzzle Images
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Upload and manage images for the slide puzzle game
                </Typography>
              </Box>
              <Button variant="outlined" onClick={logout} size="small">
                Logout
              </Button>
            </Box>
          </Box>
        </Fade>

        {/* Upload Form */}
        <Fade in={mounted} timeout={1000}>
          <Card sx={{ mb: 4 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6">Upload New Image</Typography>

              {error && (
                <Alert severity="error" onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <TextField
                label="Image Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                placeholder="e.g. Mountain Sunset"
                slotProps={{ htmlInput: { maxLength: 255 } }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<ImageIcon />}
                >
                  Choose Image
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleFileSelect}
                  />
                </Button>

                {previewUrl && (
                  <Box
                    component="img"
                    src={previewUrl}
                    alt="Preview"
                    sx={{
                      width: 120,
                      height: 120,
                      objectFit: 'cover',
                      borderRadius: 1,
                      border: '2px solid',
                      borderColor: 'divider',
                    }}
                  />
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
                  onClick={handleUpload}
                  disabled={uploading || !title.trim() || !imageData}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
                {(title || imageData) && (
                  <Button variant="text" onClick={clearForm}>
                    Clear
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Fade>

        {/* Game Settings */}
        <Fade in={mounted} timeout={1100}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TuneIcon sx={{ color: 'text.secondary' }} />
                <Typography variant="h6">Game Settings</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                These settings are stored on this device only.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="subtitle2">Love Messages</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Floating &quot;Grampy loves you!&quot; messages during games
                    </Typography>
                  </Box>
                  <Switch
                    checked={loveMessages}
                    onChange={(_, checked) => setLoveMessages(checked)}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="subtitle2">Floating Icons</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Hearts, balloons, and other decorative emojis during games
                    </Typography>
                  </Box>
                  <Switch
                    checked={floatingIcons}
                    onChange={(_, checked) => setFloatingIcons(checked)}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Fade>

        {/* Image List */}
        <Fade in={mounted} timeout={1200}>
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Uploaded Images ({images.length})
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : images.length === 0 ? (
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <ImageIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No images yet
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    Upload your first puzzle image above.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {images.map((image, i) => (
                  <Fade key={image.id} in timeout={600 + i * 100}>
                    <Card>
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <ImageIcon color="action" />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1">{image.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(image.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteTarget(image)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </CardContent>
                    </Card>
                  </Fade>
                ))}
              </Box>
            )}
          </Box>
        </Fade>
      </Container>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Image</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function PuzzleImagesPage() {
  return (
    <AdminGuard>
      <PuzzleImagesAdmin />
    </AdminGuard>
  );
}
