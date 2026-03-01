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
  Snackbar,
  CircularProgress,
  Chip,
  MenuItem,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Popper,
  Paper,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ImageIcon from '@mui/icons-material/Image';
import AddIcon from '@mui/icons-material/Add';
import AbcIcon from '@mui/icons-material/Abc';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { AdminGuard, useAdmin } from '../components/AdminGuard';
import { DarkModeToggle } from '../components/DarkModeToggle';
import { api } from '../lib/api';
import type { PuzzleImage, HangmanWord, WordSearchTheme, WordSearchThemeWithWords } from '../lib/types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const DIFFICULTY_COLORS: Record<string, 'success' | 'warning' | 'error'> = {
  easy: 'success',
  medium: 'warning',
  hard: 'error',
};

// ─── Puzzle Images Section ────────────────────────────────────────────────────

function PuzzleImagesSection({ active }: { active: boolean }) {
  const [images, setImages] = useState<PuzzleImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [imageData, setImageData] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<PuzzleImage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const loadedRef = useRef(false);

  // Hover preview
  const [virtualAnchor, setVirtualAnchor] = useState<{ getBoundingClientRect: () => DOMRect } | null>(null);
  const [popoverId, setPopoverId] = useState<number | null>(null);
  const [previewCache, setPreviewCache] = useState<Record<number, string>>({});
  const [loadingPreviewId, setLoadingPreviewId] = useState<number | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const loadImages = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.getPuzzleImages();
      setImages(list);
    } catch {
      // auth redirect handles 401
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active && !loadedRef.current) {
      loadedRef.current = true;
      loadImages();
    }
  }, [active, loadImages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    if (file.size > MAX_FILE_SIZE) { setError('Image must be under 5MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageData(result);
      setPreviewUrl(result);
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
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

  const handleImageMouseEnter = (e: React.MouseEvent<HTMLElement>, image: PuzzleImage) => {
    mousePositionRef.current = { x: e.clientX, y: e.clientY };
    hoverTimerRef.current = setTimeout(async () => {
      const { x, y } = mousePositionRef.current;
      setVirtualAnchor({
        getBoundingClientRect: () => ({ top: y, left: x, bottom: y, right: x, width: 0, height: 0, x, y, toJSON: () => ({}) } as DOMRect),
      });
      setPopoverId(image.id);
      if (!previewCache[image.id]) {
        setLoadingPreviewId(image.id);
        try {
          const data = await api.getPuzzleImage(image.id);
          setPreviewCache(prev => ({ ...prev, [image.id]: data.image_data }));
        } catch {
          // ignore preview errors
        } finally {
          setLoadingPreviewId(null);
        }
      }
    }, 500);
  };

  const handleImageMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    mousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleImageMouseLeave = () => {
    if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null; }
    setVirtualAnchor(null);
    setPopoverId(null);
  };

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Upload New Image</Typography>
            {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
            <TextField
              label="Image Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              placeholder="e.g. Mountain Sunset"
              slotProps={{ htmlInput: { maxLength: 255 } }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="outlined" component="label" startIcon={<ImageIcon />}>
                Choose Image
                <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileSelect} />
              </Button>
              {previewUrl && (
                <Box component="img" src={previewUrl} alt="Preview" sx={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 1, border: '2px solid', borderColor: 'divider' }} />
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
              {(title || imageData) && <Button variant="text" onClick={clearForm}>Clear</Button>}
            </Box>
          </CardContent>
        </Card>

        <Typography variant="h6">Uploaded Images ({images.length})</Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : images.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <ImageIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">No images yet</Typography>
              <Typography variant="body2" color="text.disabled">Upload your first puzzle image above.</Typography>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {images.map((image) => (
              <Card
                key={image.id}
                onMouseEnter={(e) => handleImageMouseEnter(e, image)}
                onMouseMove={handleImageMouseMove}
                onMouseLeave={handleImageMouseLeave}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <ImageIcon color="action" />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1">{image.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(image.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <IconButton size="small" color="error" onClick={() => setDeleteTarget(image)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      <Popper
        open={!!virtualAnchor}
        anchorEl={virtualAnchor}
        placement="right-start"
        modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
        sx={{ zIndex: 1300 }}
      >
        <Paper elevation={6} sx={{ p: 1 }}>
          {loadingPreviewId === popoverId ? (
            <Box sx={{ width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={32} />
            </Box>
          ) : popoverId !== null && previewCache[popoverId] ? (
            <Box component="img" src={previewCache[popoverId]} alt="Preview" sx={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 1, display: 'block' }} />
          ) : null}
        </Paper>
      </Popper>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Image</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ─── Hangman Words Section ────────────────────────────────────────────────────

function HangmanWordsSection({ active }: { active: boolean }) {
  const [words, setWords] = useState<HangmanWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [word, setWord] = useState('');
  const [hint, setHint] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<HangmanWord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const loadedRef = useRef(false);

  const loadWords = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.getHangmanWords();
      setWords(list);
    } catch {
      // auth redirect handles 401
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active && !loadedRef.current) {
      loadedRef.current = true;
      loadWords();
    }
  }, [active, loadWords]);

  const handleAdd = async () => {
    if (!word.trim()) return;
    setError('');
    setAdding(true);
    try {
      await api.createHangmanWord({ word: word.trim(), hint: hint.trim() || undefined, difficulty });
      setWord('');
      setHint('');
      setDifficulty('easy');
      loadWords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add word');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteHangmanWord(deleteTarget.id);
      setDeleteTarget(null);
      loadWords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Add New Word</Typography>
            {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
            <TextField
              label="Word or Phrase"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              fullWidth
              placeholder="e.g. GRAMPY LOVES YOU"
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />
            <TextField
              label="Hint (optional)"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              fullWidth
              placeholder="e.g. Something that's always true"
              slotProps={{ htmlInput: { maxLength: 255 } }}
            />
            <TextField
              select
              label="Difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              sx={{ maxWidth: 200 }}
            >
              <MenuItem value="easy">Easy</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="hard">Hard</MenuItem>
            </TextField>
            <Box>
              <Button
                variant="contained"
                startIcon={adding ? <CircularProgress size={18} color="inherit" /> : <AddIcon />}
                onClick={handleAdd}
                disabled={adding || !word.trim()}
              >
                {adding ? 'Adding...' : 'Add Word'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Typography variant="h6">Words ({words.length})</Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : words.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <AbcIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">No words yet</Typography>
              <Typography variant="body2" color="text.disabled">Add your first hangman word above.</Typography>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {words.map((w) => (
              <Card key={w.id}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <AbcIcon color="action" />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{w.word}</Typography>
                    {w.hint && <Typography variant="caption" color="text.secondary">{w.hint}</Typography>}
                  </Box>
                  <Chip label={w.difficulty} size="small" color={DIFFICULTY_COLORS[w.difficulty] || 'default'} />
                  <IconButton size="small" color="error" onClick={() => setDeleteTarget(w)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Word</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete &quot;{deleteTarget?.word}&quot;? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ─── Word Search Section ──────────────────────────────────────────────────────

function WordSearchSection({ active }: { active: boolean }) {
  const [themes, setThemes] = useState<WordSearchTheme[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [emoji, setEmoji] = useState('🔍');
  const [description, setDescription] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [themeDetail, setThemeDetail] = useState<WordSearchThemeWithWords | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [addingWord, setAddingWord] = useState(false);
  const [wordError, setWordError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<WordSearchTheme | null>(null);
  const [deleting, setDeleting] = useState(false);
  const loadedRef = useRef(false);

  const loadThemes = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.getWordSearchThemes();
      setThemes(list);
    } catch {
      // auth redirect handles 401
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active && !loadedRef.current) {
      loadedRef.current = true;
      loadThemes();
    }
  }, [active, loadThemes]);

  const loadThemeDetail = useCallback(async (id: number) => {
    setDetailLoading(true);
    setWordError('');
    try {
      const detail = await api.getWordSearchTheme(id);
      setThemeDetail(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load theme');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleToggleExpand = useCallback((id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      setThemeDetail(null);
      setNewWord('');
      setWordError('');
    } else {
      setExpandedId(id);
      loadThemeDetail(id);
    }
  }, [expandedId, loadThemeDetail]);

  const handleCreateTheme = async () => {
    if (!title.trim()) return;
    setError('');
    setAdding(true);
    try {
      await api.createWordSearchTheme({ title: title.trim(), difficulty, emoji: emoji.trim() || '🔍', description: description.trim() || undefined });
      setTitle('');
      setDifficulty('easy');
      setEmoji('🔍');
      setDescription('');
      setSuccess('Theme created!');
      loadThemes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create theme');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteTheme = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteWordSearchTheme(deleteTarget.id);
      setDeleteTarget(null);
      if (expandedId === deleteTarget.id) { setExpandedId(null); setThemeDetail(null); }
      setSuccess('Theme deleted.');
      loadThemes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleAddWord = async () => {
    if (!newWord.trim() || !expandedId) return;
    setWordError('');
    setAddingWord(true);
    try {
      await api.addWordSearchWord(expandedId, newWord.trim());
      setNewWord('');
      setSuccess(`"${newWord.trim().toUpperCase()}" added!`);
      loadThemeDetail(expandedId);
      loadThemes();
    } catch (err) {
      setWordError(err instanceof Error ? err.message : 'Failed to add word');
    } finally {
      setAddingWord(false);
    }
  };

  const handleDeleteWord = async (wordId: number, word: string) => {
    try {
      await api.deleteWordSearchWord(wordId);
      setSuccess(`"${word}" removed.`);
      if (expandedId) loadThemeDetail(expandedId);
      loadThemes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete word');
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Add New Theme</Typography>
            {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                sx={{ flex: '1 1 180px' }}
                placeholder="e.g. Animals"
                slotProps={{ htmlInput: { maxLength: 100 } }}
              />
              <TextField
                label="Emoji"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                sx={{ width: 90 }}
                slotProps={{ htmlInput: { maxLength: 10 } }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                select
                label="Difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                sx={{ width: 160 }}
              >
                <MenuItem value="easy">Easy (8×8, 6 words)</MenuItem>
                <MenuItem value="medium">Medium (10×10, 8 words)</MenuItem>
                <MenuItem value="hard">Hard (12×12, 12 words)</MenuItem>
              </TextField>
              <TextField
                label="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                sx={{ flex: '1 1 200px' }}
                placeholder="e.g. Find fun animal names!"
                slotProps={{ htmlInput: { maxLength: 255 } }}
              />
            </Box>
            <Box>
              <Button
                variant="contained"
                startIcon={adding ? <CircularProgress size={18} color="inherit" /> : <AddIcon />}
                onClick={handleCreateTheme}
                disabled={adding || !title.trim()}
              >
                {adding ? 'Creating...' : 'Create Theme'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Typography variant="h6">Themes ({themes.length})</Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : themes.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <SearchIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">No themes yet</Typography>
              <Typography variant="body2" color="text.disabled">Create your first word search theme above.</Typography>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {themes.map((theme) => (
              <Card key={theme.id}>
                <CardContent
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, '&:last-child': { pb: expandedId === theme.id ? 0 : 1.5 }, cursor: 'pointer' }}
                  onClick={() => handleToggleExpand(theme.id)}
                >
                  <Typography sx={{ fontSize: '1.5rem', lineHeight: 1 }}>{theme.emoji}</Typography>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{theme.title}</Typography>
                    {theme.description && <Typography variant="caption" color="text.secondary">{theme.description}</Typography>}
                  </Box>
                  <Chip label={theme.difficulty} size="small" color={DIFFICULTY_COLORS[theme.difficulty] || 'default'} />
                  <Chip label={`${theme.word_count} words`} size="small" variant="outlined" />
                  <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteTarget(theme); }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                  {expandedId === theme.id
                    ? <ExpandLessIcon color="action" fontSize="small" />
                    : <ExpandMoreIcon color="action" fontSize="small" />}
                </CardContent>
                <Collapse in={expandedId === theme.id}>
                  <Box sx={{ px: 2, pb: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    {detailLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={24} /></Box>
                    ) : (
                      <>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, pt: 2, pb: 1.5 }}>
                          {themeDetail?.words.length === 0 && (
                            <Typography variant="body2" color="text.disabled">No words yet — add some below!</Typography>
                          )}
                          {themeDetail?.words.map((w) => (
                            <Chip key={w.id} label={w.word} size="small" onDelete={() => handleDeleteWord(w.id, w.word)} sx={{ fontFamily: 'monospace', fontWeight: 600 }} />
                          ))}
                        </Box>
                        {wordError && <Alert severity="error" onClose={() => setWordError('')} sx={{ mb: 1 }}>{wordError}</Alert>}
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                          <TextField
                            label="Add word"
                            value={newWord}
                            onChange={(e) => setNewWord(e.target.value)}
                            size="small"
                            placeholder="e.g. TIGER"
                            slotProps={{ htmlInput: { maxLength: 50 } }}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddWord(); }}
                            sx={{ flex: '1 1 160px' }}
                          />
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={addingWord ? <CircularProgress size={14} color="inherit" /> : <AddIcon />}
                            onClick={handleAddWord}
                            disabled={addingWord || !newWord.trim()}
                          >
                            {addingWord ? 'Adding…' : 'Add'}
                          </Button>
                        </Box>
                      </>
                    )}
                  </Box>
                </Collapse>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Theme</DialogTitle>
        <DialogContent>
          <Typography>
            Delete &quot;{deleteTarget?.title}&quot;? All {deleteTarget?.word_count} word{deleteTarget?.word_count !== 1 ? 's' : ''} will also be deleted. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button onClick={handleDeleteTheme} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess('')}
        message={success}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────

function AdminSettingsPage() {
  const { logout } = useAdmin();
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState<string | false>(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
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
                  Admin Settings
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Manage game content and assets
                </Typography>
              </Box>
              <Button variant="outlined" onClick={logout} size="small">
                Logout
              </Button>
            </Box>
          </Box>
        </Fade>

        <Fade in={mounted} timeout={1000}>
          <Box>
            <Accordion expanded={expanded === 'images'} onChange={handleChange('images')}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <ImageIcon sx={{ mr: 1.5, color: 'text.secondary' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Puzzle Images</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <PuzzleImagesSection active={expanded === 'images'} />
              </AccordionDetails>
            </Accordion>

            <Accordion expanded={expanded === 'words'} onChange={handleChange('words')}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <AbcIcon sx={{ mr: 1.5, color: 'text.secondary' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Hangman Words</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <HangmanWordsSection active={expanded === 'words'} />
              </AccordionDetails>
            </Accordion>

            <Accordion expanded={expanded === 'wordsearch'} onChange={handleChange('wordsearch')}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <SearchIcon sx={{ mr: 1.5, color: 'text.secondary' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Word Search</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <WordSearchSection active={expanded === 'wordsearch'} />
              </AccordionDetails>
            </Accordion>
          </Box>
        </Fade>
      </Container>
    </>
  );
}

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminSettingsPage />
    </AdminGuard>
  );
}
