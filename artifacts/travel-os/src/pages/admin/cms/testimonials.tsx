import { useState } from "react";
import {
  useListTestimonials,
  useCreateTestimonial,
  useUpdateTestimonial,
  useDeleteTestimonial,
  getListTestimonialsQueryKey,
  type Testimonial,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Star, Plus, Pencil, Trash2, MessageSquareQuote, Settings2 } from "lucide-react";
import { Link } from "wouter";

const BLANK = {
  authorName: "",
  location: "",
  tripName: "",
  rating: 5,
  content: "",
  isActive: true,
};

type FormState = typeof BLANK;

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            className={`h-5 w-5 ${n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function AdminCmsTestimonials() {
  const { data: testimonials, isLoading } = useListTestimonials();
  const createMut = useCreateTestimonial();
  const updateMut = useUpdateTestimonial();
  const deleteMut = useDeleteTestimonial();
  const { toast } = useToast();
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: getListTestimonialsQueryKey() });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);

  const startCreate = () => { setEditing(null); setForm(BLANK); setOpen(true); };
  const startEdit = (t: Testimonial) => {
    setEditing(t);
    setForm({
      authorName: t.authorName,
      location: t.location ?? "",
      tripName: t.tripName ?? "",
      rating: t.rating,
      content: t.content,
      isActive: t.isActive,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.authorName.trim() || !form.content.trim()) {
      toast({ title: "Name and review text are required", variant: "destructive" });
      return;
    }
    const data = {
      authorName: form.authorName.trim(),
      location: form.location.trim() || undefined,
      tripName: form.tripName.trim() || undefined,
      rating: form.rating,
      content: form.content.trim(),
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, data });
        toast({ title: "Review updated" });
      } else {
        await createMut.mutateAsync({ data });
        toast({ title: "Review added" });
      }
      refresh();
      setOpen(false);
    } catch {
      toast({ title: "Failed to save review", variant: "destructive" });
    }
  };

  const remove = async (t: Testimonial) => {
    if (!window.confirm(`Delete the review from ${t.authorName}?`)) return;
    try {
      await deleteMut.mutateAsync({ id: t.id });
      toast({ title: "Review deleted" });
      refresh();
    } catch {
      toast({ title: "Failed to delete review", variant: "destructive" });
    }
  };

  const toggleActive = async (t: Testimonial) => {
    try {
      await updateMut.mutateAsync({
        id: t.id,
        data: {
          authorName: t.authorName,
          location: t.location ?? undefined,
          tripName: t.tripName ?? undefined,
          rating: t.rating,
          content: t.content,
          isActive: !t.isActive,
          sortOrder: t.sortOrder,
        },
      });
      refresh();
    } catch {
      toast({ title: "Failed to update review", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquareQuote className="h-6 w-6 text-primary" /> Customer Reviews
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reviews shown on your public website homepage. Real reviews build trust and increase enquiries.
          </p>
        </div>
        <Button onClick={startCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Review
        </Button>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4 px-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 text-sm">
            <p className="font-semibold">Show your Google Business reviews too</p>
            <p className="text-muted-foreground">
              Connect your Google Business Profile and your live Google rating & reviews appear on the website automatically, alongside the reviews you add here.
            </p>
          </div>
          <Link href="/admin/settings/integrations">
            <Button variant="outline" size="sm" className="gap-2 shrink-0">
              <Settings2 className="h-4 w-4" /> Set up in Integrations
            </Button>
          </Link>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      ) : !testimonials || testimonials.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <MessageSquareQuote className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-semibold mb-1">No reviews yet</p>
            <p className="text-sm text-muted-foreground mb-6">
              Add your best customer reviews — they appear on your website homepage.
            </p>
            <Button onClick={startCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Add your first review
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {testimonials.map((t) => (
            <Card key={t.id} className={!t.isActive ? "opacity-60" : ""}>
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="font-bold">{t.authorName}</span>
                    {t.location && <span className="text-sm text-muted-foreground">· {t.location}</span>}
                    {t.tripName && <Badge variant="secondary" className="text-xs">{t.tripName}</Badge>}
                    {!t.isActive && <Badge variant="outline" className="text-xs">Hidden</Badge>}
                  </div>
                  <Stars value={t.rating} />
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{t.content}</p>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    Show
                    <Switch checked={t.isActive} onCheckedChange={() => toggleActive(t)} />
                  </label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => startEdit(t)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(t)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Review" : "Add Review"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">Customer name *</Label>
                <Input value={form.authorName} onChange={(e) => setForm(f => ({ ...f, authorName: e.target.value }))} placeholder="Ramesh Kumar" />
              </div>
              <div>
                <Label className="mb-1.5 block">Location</Label>
                <Input value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Chennai" />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Trip taken</Label>
              <Input value={form.tripName} onChange={(e) => setForm(f => ({ ...f, tripName: e.target.value }))} placeholder="Madurai → Kodaikanal 2-day trip" />
            </div>
            <div>
              <Label className="mb-1.5 block">Rating</Label>
              <Stars value={form.rating} onChange={(v) => setForm(f => ({ ...f, rating: v }))} />
            </div>
            <div>
              <Label className="mb-1.5 block">Review text *</Label>
              <Textarea rows={4} value={form.content} onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Very clean car, polite driver, on-time pickup…" />
            </div>
            <label className="flex items-center gap-2.5 text-sm font-medium">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm(f => ({ ...f, isActive: v }))} />
              Show on website
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={createMut.isPending || updateMut.isPending}>
                {editing ? "Save changes" : "Add review"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
