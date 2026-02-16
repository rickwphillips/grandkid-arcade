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
  CircularProgress,
  Chip,
  MenuItem,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import AbcIcon from '@mui/icons-material/Abc';
import { AdminGuard, useAdmin } from '../../components/AdminGuard';
import { DarkModeToggle } from '../../components/DarkModeToggle';
import { api } from '../../lib/api';
import type { HangmanWord } from '../../lib/types';

const DIFFICULTY_COLORS: Record<string, 'success' | 'warning' | 'error'> = {
  easy: 'success',
  medium: 'warning',
  hard: 'error',
};

function HangmanWordsAdmin() {
  const { logout } = useAdmin();
  const [words, setWords] = useState<HangmanWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Add form state
  const [word, setWord] = useState('');
  const [hint, setHint] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<HangmanWord | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const loadWords = useCallback(async () => {
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
    loadWords();
  }, [loadWords]);

  const handleAdd = async () => {
    if (!word.trim()) return;
    setError('');
    setAdding(true);
    try {
      await api.createHangmanWord({
        word: word.trim(),
        hint: hint.trim() || undefined,
        difficulty,
      });
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
                  Hangman Words
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Manage words and phrases for the hangman game
                </Typography>
              </Box>
              <Button variant="outlined" onClick={logout} size="small">
                Logout
              </Button>
            </Box>
          </Box>
        </Fade>

        {/* Add Word Form */}
        <Fade in={mounted} timeout={1000}>
          <Card sx={{ mb: 4 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6">Add New Word</Typography>

              {error && (
                <Alert severity="error" onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

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

              <Box sx={{ display: 'flex', gap: 1 }}>
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
        </Fade>

        {/* Word List */}
        <Fade in={mounted} timeout={1200}>
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Words ({words.length})
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : words.length === 0 ? (
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <AbcIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No words yet
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    Add your first hangman word above.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {words.map((w, i) => (
                  <Fade key={w.id} in timeout={600 + i * 100}>
                    <Card>
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <AbcIcon color="action" />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {w.word}
                          </Typography>
                          {w.hint && (
                            <Typography variant="caption" color="text.secondary">
                              {w.hint}
                            </Typography>
                          )}
                        </Box>
                        <Chip
                          label={w.difficulty}
                          size="small"
                          color={DIFFICULTY_COLORS[w.difficulty] || 'default'}
                        />
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteTarget(w)}
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
        <DialogTitle>Delete Word</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{deleteTarget?.word}&quot;? This cannot be undone.
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

export default function HangmanWordsPage() {
  return (
    <AdminGuard>
      <HangmanWordsAdmin />
    </AdminGuard>
  );
}
