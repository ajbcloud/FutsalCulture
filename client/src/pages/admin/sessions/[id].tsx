import React, { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import AdminLayout from '@/components/admin-layout';
import { adminSessions } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { AGE_GROUPS } from '@shared/constants';

export default function AdminSessionDetail() {
  const [match, params] = useRoute('/admin/sessions/:id');
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isNew = params?.id === 'new';

  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    endTime: '',
    location: '',
    ageGroups: [] as string[],
    genders: [] as string[],
    capacity: 12,
  });

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }

    if (params?.id) {
      adminSessions.get(params.id).then(data => {
        console.log('admin session detail:', data);
        setSession(data);
        setFormData({
          title: data.title || '',
          startTime: data.startTime?.slice(0, 16) || '',
          endTime: data.endTime?.slice(0, 16) || '',
          location: data.location || '',
          ageGroups: data.ageGroups || [],
          genders: data.genders || [],
          capacity: data.capacity || 12,
        });
        setLoading(false);
      }).catch(err => {
        console.error('Error fetching session:', err);
        setLoading(false);
      });
    }
  }, [params?.id, isNew]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isNew) {
        await adminSessions.create(formData);
        toast({ title: "Session created successfully" });
      } else {
        await adminSessions.update(params?.id, formData);
        toast({ title: "Session updated successfully" });
      }
      window.location.href = '/admin/sessions';
    } catch (error) {
      console.error('Error saving session:', error);
      toast({ title: "Error saving session", variant: "destructive" });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <Link href="/admin/sessions">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sessions
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-white">
          {isNew ? 'Create New Session' : 'Edit Session'}
        </h1>
      </div>

      <div className="bg-zinc-900 p-6 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="title" className="text-zinc-300">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="bg-zinc-800 border-zinc-700 text-white"
              placeholder="Session title"
            />
          </div>

          <div>
            <Label htmlFor="location" className="text-zinc-300">Location</Label>
            <Select value={formData.location} onValueChange={(value) => setFormData({...formData, location: value})}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Turf City">Turf City</SelectItem>
                <SelectItem value="Sports Hub">Sports Hub</SelectItem>
                <SelectItem value="Jurong East">Jurong East</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="startTime" className="text-zinc-300">Start Time</Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData({...formData, startTime: e.target.value})}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div>
            <Label htmlFor="endTime" className="text-zinc-300">End Time</Label>
            <Input
              id="endTime"
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData({...formData, endTime: e.target.value})}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div>
            <Label className="text-zinc-300">Age Groups (Multi-Select)</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {AGE_GROUPS.map(age => (
                <label key={age} className="flex items-center space-x-2 text-zinc-300">
                  <input
                    type="checkbox"
                    checked={formData.ageGroups.includes(age)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({...formData, ageGroups: [...formData.ageGroups, age]});
                      } else {
                        setFormData({...formData, ageGroups: formData.ageGroups.filter(g => g !== age)});
                      }
                    }}
                    className="rounded"
                  />
                  <span>{age}</span>
                </label>
              ))}
            </div>
            {formData.ageGroups.length > 0 && (
              <p className="text-xs text-zinc-400 mt-1">
                Selected: {formData.ageGroups.join(', ')}
              </p>
            )}
          </div>

          <div>
            <Label className="text-zinc-300">Genders (Multi-Select)</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {['boys', 'girls'].map(gender => (
                <label key={gender} className="flex items-center space-x-2 text-zinc-300">
                  <input
                    type="checkbox"
                    checked={formData.genders.includes(gender)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({...formData, genders: [...formData.genders, gender]});
                      } else {
                        setFormData({...formData, genders: formData.genders.filter(g => g !== gender)});
                      }
                    }}
                    className="rounded"
                  />
                  <span className="capitalize">{gender}</span>
                </label>
              ))}
            </div>
            {formData.genders.length > 0 && (
              <p className="text-xs text-zinc-400 mt-1">
                Selected: {formData.genders.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(', ')}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="capacity" className="text-zinc-300">Capacity</Label>
            <Input
              id="capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
              className="bg-zinc-800 border-zinc-700 text-white"
              min="1"
              max="20"
            />
          </div>
        </div>

        <div className="flex justify-end mt-6 space-x-4">
          <Link href="/admin/sessions">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? 'Saving...' : (isNew ? 'Create Session' : 'Update Session')}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}