'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Box,
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
  Avatar,
  Grid,
  Chip,
  Fade,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { PageContainer } from '../components/PageContainer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { api } from '../lib/api';
import type { Grandkid, CreateGrandkidInput } from '../lib/types';

const AVATAR_COLORS = [
  '#D2691E', '#8B4513', '#DAA520', '#FF8C00',
  '#CD853F', '#6A5ACD', '#20B2AA', '#DC143C',
];

export default function GrandkidsPage() {
  const [grandkids, setGrandkids] = useState<Grandkid[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Grandkid | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [interests, setInterests] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const loadGrandkids = useCallback(async () => {
    try {
      const list = await api.getGrandkids();
      setGrandkids(list);
    } catch {
      // handled by auth redirect
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGrandkids(); }, [loadGrandkids]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setAge('');
    setInterests('');
    setAvatarColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
    setDialogOpen(true);
  };

  const openEdit = (kid: Grandkid) => {
    setEditing(kid);
    setName(kid.name);
    setAge(String(kid.age));
    setInterests((kid.interests ?? []).join(', '));
    setAvatarColor(kid.avatar_color || AVATAR_COLORS[0]);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !age.trim()) return;
    setSaving(true);
    try {
      const interestsList = interests
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (editing) {
        await api.updateGrandkid(editing.id, {
          name: name.trim(),
          age: Number(age),
          interests: interestsList,
          avatar_color: avatarColor,
        });
      } else {
        const data: CreateGrandkidInput = {
          name: name.trim(),
          age: Number(age),
          interests: interestsList,
          avatar_color: avatarColor,
        };
        await api.createGrandkid(data);
      }
      setDialogOpen(false);
      loadGrandkids();
    } catch {
      // TODO: show error toast
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this grandkid? Their scores will be kept.')) return;
    try {
      await api.deleteGrandkid(id);
      loadGrandkids();
    } catch {
      // handled
    }
  };

  if (loading) return <PageContainer title="Grandkids"><LoadingSpinner /></PageContainer>;

  return (
    <PageContainer
      title="Grandkids"
      subtitle="Manage your grandkids and their profiles"
      actions={
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={openCreate}>
          Add Grandkid
        </Button>
      }
    >
      {grandkids.length === 0 ? (
        <EmptyState
          icon={<PersonAddIcon sx={{ fontSize: 64 }} />}
          title="No grandkids yet"
          description="Add your grandkids to personalize their gaming experience."
          actionLabel="Add First Grandkid"
          actionHref="#"
        />
      ) : (
        <Grid container spacing={2}>
          {grandkids.map((kid, i) => (
            <Grid key={kid.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Fade in timeout={600 + i * 150}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                      <Avatar sx={{ bgcolor: kid.avatar_color || 'primary.main', width: 48, height: 48, fontSize: 22 }}>
                        {kid.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6">{kid.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Age {kid.age}
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={() => openEdit(kid)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(kid.id)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    {kid.interests && kid.interests.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {kid.interests.map((interest) => (
                          <Chip key={interest} label={interest} size="small" variant="outlined" />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Edit Grandkid' : 'Add Grandkid'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            autoFocus
          />
          <TextField
            label="Age"
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            fullWidth
            slotProps={{ htmlInput: { min: 1, max: 18 } }}
          />
          <TextField
            label="Interests (comma-separated)"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            fullWidth
            placeholder="dinosaurs, space, art"
          />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Avatar Color
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {AVATAR_COLORS.map((color) => (
                <Box
                  key={color}
                  onClick={() => setAvatarColor(color)}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: color,
                    cursor: 'pointer',
                    border: avatarColor === color ? '3px solid' : '2px solid transparent',
                    borderColor: avatarColor === color ? 'text.primary' : 'transparent',
                    transition: 'border-color 0.2s',
                  }}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || !name.trim() || !age.trim()}
          >
            {saving ? 'Saving...' : editing ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
