import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Loader2, Building, Stethoscope, Users, Percent, Pill, FlaskConical, Save } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  getHospitalSettings, updateHospitalSettings,
  getDoctors, addDoctor, deleteDoctor,
  listStaff, updateUserRole,
  getMedicinesCatalog, addMedicine, updateMedicine, deleteMedicine,
  getTestsCatalog, addTest, updateTest, deleteTest,
} from "@/lib/queries";
import { addStaffServerFn } from "@/utils/staff.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { role, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && role !== "admin") {
      toast.error("Admin access required");
      navigate({ to: "/billing" });
    }
  }, [role, loading, navigate]);

  if (loading || role !== "admin") {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <motion.h1
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-gradient mb-6"
      >
        Settings
      </motion.h1>
      <Tabs defaultValue="hospital">
        <TabsList className="grid w-full grid-cols-6 mb-6">
          <TabsTrigger value="hospital"><Building className="h-4 w-4 mr-2" />Hospital</TabsTrigger>
          <TabsTrigger value="gst"><Percent className="h-4 w-4 mr-2" />GST</TabsTrigger>
          <TabsTrigger value="doctors"><Stethoscope className="h-4 w-4 mr-2" />Doctors</TabsTrigger>
          <TabsTrigger value="medicines"><Pill className="h-4 w-4 mr-2" />Medicines</TabsTrigger>
          <TabsTrigger value="tests"><FlaskConical className="h-4 w-4 mr-2" />Tests</TabsTrigger>
          <TabsTrigger value="staff"><Users className="h-4 w-4 mr-2" />Staff</TabsTrigger>
        </TabsList>
        <TabsContent value="hospital"><HospitalTab /></TabsContent>
        <TabsContent value="gst"><GstTab /></TabsContent>
        <TabsContent value="doctors"><DoctorsTab /></TabsContent>
        <TabsContent value="medicines"><CatalogTab kind="medicine" /></TabsContent>
        <TabsContent value="tests"><CatalogTab kind="test" /></TabsContent>
        <TabsContent value="staff"><StaffTab callerId={user!.id} /></TabsContent>
      </Tabs>
    </div>
  );
}

function HospitalTab() {
  const [data, setData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { getHospitalSettings().then(setData).catch((e) => toast.error(e.message)); }, []);
  if (!data) return <Loader2 className="h-5 w-5 animate-spin" />;
  const save = async () => {
    if (data.phone && !/^\d{10}$/.test(data.phone)) return toast.error("Phone must be exactly 10 digits");
    setSaving(true);
    const { error } = await updateHospitalSettings({ ...data, gst_percent: Number(data.gst_percent) });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Hospital details saved");
  };
  return (
    <Card className="shadow-elegant border-0">
      <CardHeader><CardTitle>Hospital Details</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2"><Label>Name</Label><Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} /></div>
        <div className="space-y-2 md:col-span-2"><Label>Address</Label><Textarea rows={2} value={data.address} onChange={(e) => setData({ ...data, address: e.target.value })} /></div>
        <div className="space-y-2">
          <Label>Phone (10 digits)</Label>
          <Input
            value={data.phone}
            inputMode="numeric"
            maxLength={10}
            placeholder="9876543210"
            onChange={(e) => setData({ ...data, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
          />
          {data.phone && data.phone.length > 0 && data.phone.length < 10 && (
            <p className="text-xs text-destructive">Phone must be 10 digits</p>
          )}
        </div>
        <div className="space-y-2"><Label>Email</Label><Input type="email" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} /></div>
        <div className="space-y-2"><Label>GSTIN</Label><Input value={data.gstin} onChange={(e) => setData({ ...data, gstin: e.target.value })} /></div>
        <div className="md:col-span-2">
          <Button onClick={save} disabled={saving} className="gradient-primary text-primary-foreground border-0">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Hospital Details"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function GstTab() {
  const [data, setData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { getHospitalSettings().then(setData).catch((e) => toast.error(e.message)); }, []);
  if (!data) return <Loader2 className="h-5 w-5 animate-spin" />;
  const save = async () => {
    const v = Number(data.gst_percent);
    if (isNaN(v) || v < 0 || v > 100) return toast.error("GST must be between 0 and 100");
    setSaving(true);
    const { error } = await updateHospitalSettings({ ...data, gst_percent: v });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("GST updated");
  };
  return (
    <Card className="shadow-elegant border-0">
      <CardHeader><CardTitle>GST Configuration</CardTitle></CardHeader>
      <CardContent className="space-y-4 max-w-sm">
        <div className="space-y-2">
          <Label>GST Percentage</Label>
          <Input type="number" min={0} max={100} step="0.01" value={data.gst_percent}
            onChange={(e) => setData({ ...data, gst_percent: e.target.value })} />
        </div>
        <Button onClick={save} disabled={saving} className="gradient-primary text-primary-foreground border-0">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save GST"}
        </Button>
      </CardContent>
    </Card>
  );
}

function DoctorsTab() {
  const [docs, setDocs] = useState<any[]>([]);
  const [name, setName] = useState(""); const [spec, setSpec] = useState(""); const [phone, setPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const reload = () => getDoctors().then(setDocs).catch((e) => toast.error(e.message));
  useEffect(() => { reload(); }, []);
  const add = async () => {
    if (!name.trim()) return toast.error("Doctor name is required");
    if (phone && !/^\d{10}$/.test(phone)) return toast.error("Phone must be exactly 10 digits");
    setAdding(true);
    const { error } = await addDoctor({ name: name.trim(), specialization: spec.trim() || undefined, phone: phone.trim() || undefined });
    setAdding(false);
    if (error) return toast.error(error.message);
    toast.success("Doctor added");
    setName(""); setSpec(""); setPhone(""); reload();
  };
  const del = async (id: string) => {
    const { error } = await deleteDoctor(id);
    if (error) return toast.error(error.message);
    toast.success("Doctor removed"); reload();
  };
  return (
    <div className="space-y-4">
      <Card className="shadow-elegant border-0">
        <CardHeader><CardTitle>Add Doctor</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Specialization" value={spec} onChange={(e) => setSpec(e.target.value)} />
          <Input
            placeholder="Phone (10 digits)"
            value={phone}
            inputMode="numeric"
            maxLength={10}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          />
          <Button onClick={add} disabled={adding} className="gradient-accent text-accent-foreground border-0">
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" />Add</>}
          </Button>
        </CardContent>
      </Card>
      <Card className="shadow-elegant border-0">
        <CardHeader><CardTitle>All Doctors ({docs.length})</CardTitle></CardHeader>
        <CardContent>
          {docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No doctors yet. Add one above.</p>
          ) : (
            <ul className="divide-y">
              {docs.map((d) => (
                <motion.li key={d.id} layout className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">Dr. {d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.specialization || "—"} · {d.phone || "no phone"}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del(d.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StaffTab({ callerId }: { callerId: string }) {
  const [staff, setStaff] = useState<any[]>([]);
  const [email, setEmail] = useState(""); const [pwd, setPwd] = useState(""); const [fn, setFn] = useState(""); const [r, setR] = useState<"admin" | "staff">("staff");
  const [adding, setAdding] = useState(false);
  const reload = () => listStaff().then(setStaff).catch((e) => toast.error(e.message));
  useEffect(() => { reload(); }, []);
  const add = async () => {
    if (!email || !pwd || !fn) return toast.error("All fields are required");
    if (pwd.length < 6) return toast.error("Password must be at least 6 characters");
    setAdding(true);
    try {
      const res = await addStaffServerFn({ data: { email, password: pwd, fullName: fn, role: r, callerId } });
      if (!res.ok) { toast.error(res.error); return; }
      toast.success("Staff account created");
      setEmail(""); setPwd(""); setFn(""); setR("staff"); reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setAdding(false); }
  };
  const changeRole = async (uid: string, newRole: "admin" | "staff") => {
    const { error } = await updateUserRole(uid, newRole);
    if (error) return toast.error(error.message);
    toast.success("Role updated"); reload();
  };
  return (
    <div className="space-y-4">
      <Card className="shadow-elegant border-0">
        <CardHeader><CardTitle>Add Staff Account</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input placeholder="Full name *" value={fn} onChange={(e) => setFn(e.target.value)} />
          <Input placeholder="Email *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="Password (min 6) *" type="text" value={pwd} onChange={(e) => setPwd(e.target.value)} />
          <Select value={r} onValueChange={(v) => setR(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <div className="md:col-span-2">
            <Button onClick={add} disabled={adding} className="gradient-accent text-accent-foreground border-0">
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" />Create Account</>}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-elegant border-0">
        <CardHeader><CardTitle>All Users ({staff.length})</CardTitle></CardHeader>
        <CardContent>
          <ul className="divide-y">
            {staff.map((s) => (
              <motion.li key={s.id} layout className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{s.full_name || s.email}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={s.role === "admin" ? "border-accent text-accent" : "border-primary text-primary"}>
                    {s.role.toUpperCase()}
                  </Badge>
                  {s.id !== callerId && (
                    <Select value={s.role} onValueChange={(v) => changeRole(s.id, v as any)}>
                      <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function CatalogTab({ kind }: { kind: "medicine" | "test" }) {
  const isMed = kind === "medicine";
  const labelSingular = isMed ? "Medicine" : "Test";
  const labelPlural = isMed ? "Medicines" : "Tests";
  const Icon = isMed ? Pill : FlaskConical;

  const fetchAll = isMed ? getMedicinesCatalog : getTestsCatalog;
  const create = isMed ? addMedicine : addTest;
  const update = isMed ? updateMedicine : updateTest;
  const remove = isMed ? deleteMedicine : deleteTest;

  const [items, setItems] = useState<Array<{ id: string; name: string; price: number }>>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const reload = () =>
    fetchAll()
      .then((rows) => setItems(rows.map((r: any) => ({ id: r.id, name: r.name, price: Number(r.price) }))))
      .catch((e) => toast.error(e.message));

  useEffect(() => { reload(); }, [kind]);

  const add = async () => {
    const p = parseFloat(price);
    if (!name.trim()) return toast.error(`${labelSingular} name is required`);
    if (isNaN(p) || p < 0) return toast.error("Enter a valid price");
    setAdding(true);
    const { error } = await create({ name: name.trim(), price: p });
    setAdding(false);
    if (error) return toast.error(error.message);
    toast.success(`${labelSingular} added`);
    setName(""); setPrice(""); reload();
  };

  const startEdit = (it: { id: string; name: string; price: number }) => {
    setEditingId(it.id);
    setEditName(it.name);
    setEditPrice(String(it.price));
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const p = parseFloat(editPrice);
    if (!editName.trim()) return toast.error("Name is required");
    if (isNaN(p) || p < 0) return toast.error("Enter a valid price");
    const { error } = await update(editingId, { name: editName.trim(), price: p });
    if (error) return toast.error(error.message);
    toast.success("Updated");
    setEditingId(null); reload();
  };

  const del = async (id: string) => {
    const { error } = await remove(id);
    if (error) return toast.error(error.message);
    toast.success(`${labelSingular} removed`); reload();
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-elegant border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Icon className="h-5 w-5" /> Add {labelSingular}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            className="md:col-span-2"
            placeholder={`${labelSingular} name *`}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="grid grid-cols-3 gap-2">
            <Input
              className="col-span-2"
              type="number"
              min={0}
              step="0.01"
              placeholder="Price *"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <Button onClick={add} disabled={adding} className="gradient-accent text-accent-foreground border-0">
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-elegant border-0">
        <CardHeader>
          <CardTitle>All {labelPlural} ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No {labelPlural.toLowerCase()} yet. Add one above.</p>
          ) : (
            <ul className="divide-y">
              {items.map((it) => (
                <motion.li key={it.id} layout className="py-3 grid grid-cols-12 gap-2 items-center">
                  {editingId === it.id ? (
                    <>
                      <Input
                        className="col-span-7"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                      <Input
                        className="col-span-3"
                        type="number"
                        min={0}
                        step="0.01"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                      />
                      <Button size="icon" variant="ghost" className="col-span-1 text-primary" onClick={saveEdit}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="col-span-1" onClick={() => setEditingId(null)}>
                        ✕
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="col-span-7 font-medium truncate">{it.name}</p>
                      <p className="col-span-3 text-right tabular-nums font-semibold text-primary">
                        ₹{it.price.toFixed(2)}
                      </p>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="col-span-1"
                        onClick={() => startEdit(it)}
                        title="Edit"
                      >
                        ✎
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="col-span-1 text-destructive"
                        onClick={() => del(it.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </motion.li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
