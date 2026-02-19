'use client';

import { useEffect, useState, useCallback } from 'react';
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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';
import { AdminGuard, useAdmin } from '../../components/AdminGuard';
import { DarkModeToggle } from '../../components/DarkModeToggle';
import { api } from '../../lib/api';
import type { WordSearchTheme, WordSearchThemeWithWords } from '../../lib/types';

const DIFFICULTY_COLORS: Record<string, 'success' | 'warning' | 'error'> = {
  easy: 'success',
  medium: 'warning',
  hard: 'error',
};

function WordSearchAdmin() {
  const { logout } = useAdmin();
  const [themes, setThemes] = useState<WordSearchTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Create theme form
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [emoji, setEmoji] = useState('🔍');
  const [description, setDescription] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Expanded theme detail
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [themeDetail, setThemeDetail] = useState<WordSearchThemeWithWords | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Add word form
  const [newWord, setNewWord] = useState('');
  const [addingWord, setAddingWord] = useState(false);
  const [wordError, setWordError] = useState('');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<WordSearchTheme | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const loadThemes = useCallback(async () => {
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
    loadThemes();
  }, [loadThemes]);

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

  const handleToggleExpand = useCallback(
    (id: number) => {
      if (expandedId === id) {
        setExpandedId(null);
        setThemeDetail(null);
        setNewWord('');
        setWordError('');
      } else {
        setExpandedId(id);
        loadThemeDetail(id);
      }
    },
    [expandedId, loadThemeDetail],
  );

  const handleCreateTheme = async () => {
    if (!title.trim()) return;
    setError('');
    setAdding(true);
    try {
      await api.createWordSearchTheme({
        title: title.trim(),
        difficulty,
        emoji: emoji.trim() || '🔍',
        description: description.trim() || undefined,
      });
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
      if (expandedId === deleteTarget.id) {
        setExpandedId(null);
        setThemeDetail(null);
      }
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
      // Refresh word count in list
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
      <DarkModeToggle />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Fade in={mounted} timeout={800}>
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
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
                  Word Search Themes
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Manage themes and words for the word search game
                </Typography>
              </Box>
              <Button variant="outlined" onClick={logout} size="small">
                Logout
              </Button>
            </Box>
          </Box>
        </Fade>

        {/* Create Theme Form */}
        <Fade in={mounted} timeout={1000}>
          <Card sx={{ mb: 4 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6">Add New Theme</Typography>

              {error && (
                <Alert severity="error" onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

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
        </Fade>

        {/* Theme List */}
        <Fade in={mounted} timeout={1200}>
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Themes ({themes.length})
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : themes.length === 0 ? (
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <SearchIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No themes yet
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    Create your first word search theme above.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {themes.map((theme, i) => (
                  <Fade key={theme.id} in timeout={600 + i * 80}>
                    <Card>
                      {/* Theme header row */}
                      <CardContent
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          py: 1.5,
                          '&:last-child': { pb: expandedId === theme.id ? 0 : 1.5 },
                          cursor: 'pointer',
                        }}
                        onClick={() => handleToggleExpand(theme.id)}
                      >
                        <Typography sx={{ fontSize: '1.5rem', lineHeight: 1 }}>
                          {theme.emoji}
                        </Typography>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {theme.title}
                          </Typography>
                          {theme.description && (
                            <Typography variant="caption" color="text.secondary">
                              {theme.description}
                            </Typography>
                          )}
                        </Box>
                        <Chip
                          label={theme.difficulty}
                          size="small"
                          color={DIFFICULTY_COLORS[theme.difficulty] || 'default'}
                        />
                        <Chip
                          label={`${theme.word_count} words`}
                          size="small"
                          variant="outlined"
                        />
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(theme);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        {expandedId === theme.id ? (
                          <ExpandLessIcon color="action" fontSize="small" />
                        ) : (
                          <ExpandMoreIcon color="action" fontSize="small" />
                        )}
                      </CardContent>

                      {/* Expanded word detail */}
                      <Collapse in={expandedId === theme.id}>
                        <Box
                          sx={{
                            px: 2,
                            pb: 2,
                            borderTop: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          {detailLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                              <CircularProgress size={24} />
                            </Box>
                          ) : (
                            <>
                              {/* Word chips */}
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, pt: 2, pb: 1.5 }}>
                                {themeDetail?.words.length === 0 && (
                                  <Typography variant="body2" color="text.disabled">
                                    No words yet — add some below!
                                  </Typography>
                                )}
                                {themeDetail?.words.map((w) => (
                                  <Chip
                                    key={w.id}
                                    label={w.word}
                                    size="small"
                                    onDelete={() => handleDeleteWord(w.id, w.word)}
                                    sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                                  />
                                ))}
                              </Box>

                              {/* Add word form */}
                              {wordError && (
                                <Alert
                                  severity="error"
                                  onClose={() => setWordError('')}
                                  sx={{ mb: 1 }}
                                >
                                  {wordError}
                                </Alert>
                              )}
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                                <TextField
                                  label="Add word"
                                  value={newWord}
                                  onChange={(e) => setNewWord(e.target.value)}
                                  size="small"
                                  placeholder="e.g. TIGER"
                                  slotProps={{ htmlInput: { maxLength: 50 } }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddWord();
                                  }}
                                  sx={{ flex: '1 1 160px' }}
                                />
                                <Button
                                  variant="contained"
                                  size="small"
                                  startIcon={
                                    addingWord ? (
                                      <CircularProgress size={14} color="inherit" />
                                    ) : (
                                      <AddIcon />
                                    )
                                  }
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
                  </Fade>
                ))}
              </Box>
            )}
          </Box>
        </Fade>
      </Container>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Theme</DialogTitle>
        <DialogContent>
          <Typography>
            Delete &quot;{deleteTarget?.title}&quot;? All {deleteTarget?.word_count} word
            {deleteTarget?.word_count !== 1 ? 's' : ''} will also be deleted. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button onClick={handleDeleteTheme} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success snackbar */}
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

export default function WordSearchAdminPage() {
  return (
    <AdminGuard>
      <WordSearchAdmin />
    </AdminGuard>
  );
}
