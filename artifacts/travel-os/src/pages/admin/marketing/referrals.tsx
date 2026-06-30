import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Gift, Plus, Users, IndianRupee, BadgeCheck } from "lucide-react";

type Referral = {
  id: string; referrerName: string; referrerPhone?: string; code: string;
  refereeName?: string; refereePhone?: string; rewardAmount: string;
  status: string; createdAt: string;
};

const BLANK = { referrerName: "", referrerPhone: "", code: "", refereeName: "", refereePhone: "", rewardAmount: "" };

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  rewarded: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function ReferralForm({ onSave, onCancel }: { onSave: (d: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Record<string, any>>({ ...BLANK });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Referrer Name *</Label>
          <Input value={form.referrerName} onChange={set("referrerName")} placeholder="John Doe" />
        </div>
        <div className="space-y-1.5">
          <Label>Referrer Phone</Label>
          <Input value={form.referrerPhone} onChange={set("referrerPhone")} placeholder="+91 98765 43210" />
        </div>
        <div className="space-y-1.5">
          <Label>Referral Code *</Label>
          <Input value={form.code} onChange={set("code")} placeholder="JOHN20" className="uppercase" />
        </div>
        <div className="space-y-1.5">
          <Label>Reward Amount (₹)</Label>
          <Input type="number" value={form.rewardAmount} onChange={set("rewardAmount")} placeholder="500" min="0" />
        </div>
        <div className="space-y-1.5">
          <Label>Referee Name</Label>
          <Input value={form.refereeName} onChange={set("refereeName")} placeholder="Jane Smith" />
        </div>
        <div className="space-y-1.5">
          <Label>Referee Phone</Label>
          <Input value={form.refereePhone} onChange={set("refereePhone")} placeholder="+91 90000 00000" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ ...form, rewardAmount: form.rewardAmount || "0" })} disabled={!form.referrerName || !form.code}>
          Create Referral
        </Button>
      </div>
    </div>
  );
}

export default function MarketingReferrals() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialog, setDialog] = useState(false);

  const { data: referrals, isLoading } = useQuery<Referral[]>({
    queryKey: ["/v1/marketing/referrals"],
    queryFn: () => api.get("/marketing/referrals"),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["/v1/marketing/referrals"] });

  const createMut = useMutation({
    mutationFn: (d: any) => api.post("/marketing/referrals", d),
    onSuccess: () => { refresh(); setDialog(false); toast({ title: "Referral created" }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, ...d }: any) => api.patch(`/marketing/referrals/${id}`, d),
    onSuccess: () => { refresh(); toast({ title: "Referral updated" }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const list = referrals ?? [];
  const completed = list.filter((r) => r.status === "completed").length;
  const rewarded = list.filter((r) => r.status === "rewarded").length;
  const totalRewards = list.filter((r) => r.status === "rewarded").reduce((s, r) => s + Number(r.rewardAmount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Referrals</h1>
          <p className="text-muted-foreground mt-1">Track customer referrals and reward payouts.</p>
        </div>
        <Button onClick={() => setDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Referral
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{list.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-blue-600">{completed}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Rewarded</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-emerald-600">{rewarded}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Rewards Paid</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">₹{totalRewards.toLocaleString("en-IN")}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All Referrals</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : !list.length ? (
            <div className="text-center py-16">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No referrals yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first referral to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Referee</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.referrerName}</div>
                      {r.referrerPhone && <div className="text-xs text-muted-foreground">{r.referrerPhone}</div>}
                    </TableCell>
                    <TableCell><span className="font-mono font-semibold text-sm tracking-wider">{r.code}</span></TableCell>
                    <TableCell>
                      {r.refereeName ? (
                        <>
                          <div className="font-medium">{r.refereeName}</div>
                          {r.refereePhone && <div className="text-xs text-muted-foreground">{r.refereePhone}</div>}
                        </>
                      ) : <span className="text-muted-foreground text-sm">—</span>}
                    </TableCell>
                    <TableCell className="font-medium">₹{Number(r.rewardAmount || 0).toLocaleString("en-IN")}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_STYLES[r.status] ?? ""}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {r.status === "pending" && (
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => updateMut.mutate({ id: r.id, status: "completed" })}>
                            <Users className="h-3.5 w-3.5" /> Mark Completed
                          </Button>
                        )}
                        {r.status !== "rewarded" && (
                          <Button size="sm" variant="outline" className="gap-1 text-emerald-700" onClick={() => updateMut.mutate({ id: r.id, status: "rewarded" })}>
                            <BadgeCheck className="h-3.5 w-3.5" /> Mark Rewarded
                          </Button>
                        )}
                        {r.status === "rewarded" && (
                          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground"><IndianRupee className="h-3.5 w-3.5" /> Paid</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>New Referral</DialogTitle></DialogHeader>
          <ReferralForm onSave={(d) => createMut.mutate(d)} onCancel={() => setDialog(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
