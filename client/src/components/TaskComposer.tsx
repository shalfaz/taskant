'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ImagePlus, Send } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import Textarea from './ui/Textarea';
import { tasksApi, uploadsApi } from '../services/api';
import { TASK_CATEGORIES, type CloudinaryAsset, type Task } from '../types';

const emptyForm = {
  title: '',
  description: '',
  category: TASK_CATEGORIES[0],
  location: '',
  pickup: '',
  destination: '',
  deadline: '',
  budget: '',
  additionalInstructions: '',
};

function getErrorMessage(error: unknown) {
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    || 'Unable to post task. Please try again.';
}

export default function TaskComposer({
  compact = false,
  onCreated,
}: {
  compact?: boolean;
  onCreated?: (task: Task) => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const isRouteTask = ['Delivery', 'Shopping & Errands'].includes(form.category);

  const selectPhotos = (event: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files || []);
    event.target.value = '';
    if (photos.length + incoming.length > 5) {
      toast.error('Add no more than five photos to a task.');
      return;
    }
    if (incoming.some((file) =>
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 4 * 1024 * 1024
    )) {
      toast.error('Photos must be JPG, PNG, or WebP files no larger than 4 MB each.');
      return;
    }
    setPhotos((current) => [...current, ...incoming]);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const location = isRouteTask
      ? `${form.pickup.trim()} → ${form.destination.trim()}`
      : form.location.trim();
    const budget = Number(form.budget);
    const deadline = new Date(`${form.deadline}T23:59:59`);
    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !location ||
      (isRouteTask && (!form.pickup.trim() || !form.destination.trim())) ||
      !form.deadline ||
      !Number.isFinite(budget) ||
      budget < 1 ||
      Number.isNaN(deadline.getTime())
    ) {
      toast.error('Complete the task details, location, deadline, and a valid budget.');
      return;
    }

    setSaving(true);
    try {
      const attachmentAssets: CloudinaryAsset[] = [];
      for (const [index, file] of photos.entries()) {
        const response = await uploadsApi.upload(file, 'task-attachment', (progress) => {
          setUploadProgress(Math.round(((index + progress / 100) / photos.length) * 100));
        });
        attachmentAssets.push(response.data.asset as CloudinaryAsset);
      }
      const response = await tasksApi.create({
        ...form,
        location,
        pickup: isRouteTask ? form.pickup.trim() : undefined,
        destination: isRouteTask ? form.destination.trim() : undefined,
        budget,
        deadline: deadline.toISOString(),
        attachments: attachmentAssets.map((asset) => asset.url),
        attachmentAssets,
      });
      toast.success('Task posted');
      setForm(emptyForm);
      setPhotos([]);
      if (onCreated) onCreated(response.data.task as Task);
      else router.push('/my-tasks/posted');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={submit} className={compact ? 'space-y-3' : 'space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'}>
      <Input required label="Task title" maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Pick up groceries" />
      <Textarea required label="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={compact ? 3 : 4} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Select label="Category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} options={TASK_CATEGORIES.map((item) => ({ value: item, label: item }))} />
        {isRouteTask ? (
          <Input required label="Pickup location" value={form.pickup} onChange={(event) => setForm({ ...form, pickup: event.target.value })} placeholder="e.g. Banani, Dhaka" />
        ) : (
          <Input required label="Location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Area or neighborhood" />
        )}
      </div>
      {isRouteTask && <Input required label="Destination" value={form.destination} onChange={(event) => setForm({ ...form, destination: event.target.value })} placeholder="e.g. Dhanmondi 27, Dhaka" />}
      <div className="grid gap-3 sm:grid-cols-2">
        <Input required label="Deadline" type="date" min={new Date().toLocaleDateString('en-CA')} value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />
        <Input required label="Budget (৳)" type="number" min="1" value={form.budget} onChange={(event) => setForm({ ...form, budget: event.target.value })} />
      </div>
      {!compact && <Textarea label="Additional instructions" value={form.additionalInstructions} onChange={(event) => setForm({ ...form, additionalInstructions: event.target.value })} rows={3} />}
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <ImagePlus className="h-4 w-4 text-blue-500" /> Add photos ({photos.length}/5)
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={selectPhotos} />
        </label>
        {photos.map((photo, index) => (
          <span key={`${photo.name}-${index}`} className="inline-flex max-w-full items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
            <span className="max-w-36 truncate">{photo.name}</span>
            <button type="button" aria-label={`Remove ${photo.name}`} className="font-bold text-red-600" onClick={() => setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index))}>×</button>
          </span>
        ))}
      </div>
      <Button type="submit" loading={saving} className="w-full">
        <Send className="h-4 w-4" /> {saving ? `Uploading ${uploadProgress}%` : 'Publish task'}
      </Button>
    </form>
  );
}
