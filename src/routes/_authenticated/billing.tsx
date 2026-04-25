import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, FileText, Download, Save, Pill, FlaskConical, User, Loader2, RotateCcw, Archive } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  getDoctors,
  getHospitalSettings,
  getMedicinesCatalog,
  getTestsCatalog,
  createBill,
  CreateBillInput,
  getBills,
  getBillWithItems,
} from "@/lib/queries";
import { generateBillPdf } from "@/lib/pdf";
import type { BillPdfData } from "@/lib/pdf";

export const Route = createFileRoute("/_authenticated/billing")({
  component: BillingPage,
});

interface MedRow {
  id: string;
  catalogId: string; // selected medicine id from catalog
  name: string;
  quantity: string;
  price: string;
}
interface TestRow {
  id: string;
  catalogId: string;
  name: string;
  price: string;
}

interface CatalogItem {
  id: string;
  name: string;
  price: number;
}

interface SavedBill {
  id: string;
  invoice_no: string;
  patient_name: string;
  patient_phone: string;
  patient_age: number;
  created_at: string;
  total: number;
}

const newId = () => Math.random().toString(36).slice(2);

function BillingPage() {
  const { user } = useAuth();

  // Tabs
  const [activeTab, setActiveTab] = useState<"create" | "saved">("create");

  // Patient
  const [pName, setPName] = useState("");
  const [pPhone, setPPhone] = useState("");
  const [pAge, setPAge] = useState("");
  const [pGender, setPGender] = useState("");
  const [pAddress, setPAddress] = useState("");
  const [doctorId, setDoctorId] = useState<string>("none");

  // Items
  const [medicines, setMedicines] = useState<MedRow[]>([
    { id: newId(), catalogId: "", name: "", quantity: "1", price: "" },
  ]);
  const [tests, setTests] = useState<TestRow[]>([
    { id: newId(), catalogId: "", name: "", price: "" },
  ]);

  const [medCatalog, setMedCatalog] = useState<CatalogItem[]>([]);
  const [testCatalog, setTestCatalog] = useState<CatalogItem[]>([]);

  const [doctors, setDoctors] = useState<Array<{ id: string; name: string; specialization: string | null }>>([]);
  const [hospital, setHospital] = useState<{
    name: string;
    address: string;
    phone: string;
    email: string;
    gstin: string;
    gst_percent: number;
  } | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Saved Bills
  const [savedBills, setSavedBills] = useState<SavedBill[]>([]);
  const [loadingSavedBills, setLoadingSavedBills] = useState(false);
  const [viewingBillId, setViewingBillId] = useState<string | null>(null);
  const [billPreviewOpen, setBillPreviewOpen] = useState(false);
  const [viewingBillData, setViewingBillData] = useState<BillPdfData | null>(null);
  const [loadingBillDetail, setLoadingBillDetail] = useState(false);

  useEffect(() => {
    Promise.all([getDoctors(), getHospitalSettings(), getMedicinesCatalog(), getTestsCatalog()])
      .then(([docs, hs, meds, tsts]) => {
        setDoctors(docs);
        setMedCatalog(meds.map((m: any) => ({ id: m.id, name: m.name, price: Number(m.price) })));
        setTestCatalog(tsts.map((t: any) => ({ id: t.id, name: t.name, price: Number(t.price) })));
        if (hs) {
          setHospital({
            name: hs.name,
            address: hs.address,
            phone: hs.phone,
            email: hs.email,
            gstin: hs.gstin,
            gst_percent: Number(hs.gst_percent),
          });
        }
      })
      .catch((e) => toast.error(e.message));

    // Load saved bills
    if (user) {
      setLoadingSavedBills(true);
      getBills(user.id)
        .then((bills) => setSavedBills(bills as SavedBill[]))
        .catch((e) => toast.error("Failed to load saved bills"))
        .finally(() => setLoadingSavedBills(false));
    }
  }, [user]);

  useEffect(() => {
    if (!viewingBillId || !billPreviewOpen) {
      setViewingBillData(null);
      return;
    }
    
    setLoadingBillDetail(true);
    getBillWithItems(viewingBillId)
      .then(({ bill, items }) => {
        const pdfData: BillPdfData = {
          hospital: hospital ?? {
            name: "Meraki Care",
            address: "",
            phone: "",
            email: "",
            gstin: "",
          },
          invoice: {
            no: bill.invoice_no,
            date: new Date(bill.created_at).toLocaleDateString("en-GB"),
            time: new Date(bill.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
          },
          patient: {
            name: bill.patient_name,
            phone: bill.patient_phone,
            age: bill.patient_age,
            gender: bill.patient_gender || undefined,
            address: bill.patient_address || undefined,
            doctor: bill.doctor_name || undefined,
          },
          medicines: items.filter((i: any) => i.type === "medicine"),
          tests: items.filter((i: any) => i.type === "test"),
          subtotal: bill.subtotal,
          gstPercent: bill.gst_percent,
          gstAmount: bill.gst_amount,
          total: bill.total,
        };
        setViewingBillData(pdfData);
      })
      .catch((e) => {
        toast.error("Failed to load bill details");
        console.error(e);
      })
      .finally(() => setLoadingBillDetail(false));
  }, [viewingBillId, billPreviewOpen]);

  // ---- Totals ----
  const { medItems, testItems, subtotal, gstAmount, total } = useMemo(() => {
    const mi = medicines
      .map((m) => {
        const qty = parseInt(m.quantity, 10) || 0;
        const price = parseFloat(m.price) || 0;
        return { name: m.name.trim(), quantity: qty, unit_price: price, amount: qty * price };
      })
      .filter((m) => m.name && m.amount > 0);
    const ti = tests
      .map((t) => {
        const price = parseFloat(t.price) || 0;
        return { name: t.name.trim(), amount: price };
      })
      .filter((t) => t.name && t.amount > 0);
    const sub = mi.reduce((s, m) => s + m.amount, 0) + ti.reduce((s, t) => s + t.amount, 0);
    const gstP = hospital?.gst_percent ?? 0;
    const gstA = +(sub * gstP / 100).toFixed(2);
    const tot = +(sub + gstA).toFixed(2);
    return { medItems: mi, testItems: ti, subtotal: sub, gstAmount: gstA, total: tot };
  }, [medicines, tests, hospital]);

  // ---- Validation ----
  const validate = (): string | null => {
    if (!pName.trim()) return "Patient name is required";
    if (!/^\d{10}$/.test(pPhone)) return "Phone number must be exactly 10 digits";
    const ageNum = parseInt(pAge, 10);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) return "Enter a valid age (0–120)";
    if (medItems.length === 0 && testItems.length === 0) {
      return "Add at least one medicine or test with name and price";
    }
    // partial-row warning
    const partial =
      medicines.some((m) => (m.name.trim() || (parseFloat(m.price) || 0) > 0) && !(m.name.trim() && (parseFloat(m.price) || 0) > 0 && (parseInt(m.quantity, 10) || 0) > 0)) ||
      tests.some((t) => (t.name.trim() || (parseFloat(t.price) || 0) > 0) && !(t.name.trim() && (parseFloat(t.price) || 0) > 0));
    if (partial) return "Some rows are incomplete. Please fill name, qty (for medicines) and price, or remove the row.";
    return null;
  };

  const handlePreview = () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setPreviewOpen(true);
  };

  // ---- PDF ----
  const buildPdfData = (invoiceNo: string) => {
    const now = new Date();
    return {
      hospital: hospital ?? {
        name: "Meraki Care",
        address: "",
        phone: "",
        email: "",
        gstin: "",
      },
      invoice: {
        no: invoiceNo,
        date: now.toLocaleDateString("en-GB"),
        time: now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      },
      patient: {
        name: pName.trim(),
        phone: pPhone,
        age: parseInt(pAge, 10),
        gender: pGender || undefined,
        address: pAddress.trim() || undefined,
        doctor: doctorId !== "none" ? doctors.find((d) => d.id === doctorId)?.name : undefined,
      },
      medicines: medItems,
      tests: testItems,
      subtotal,
      gstPercent: hospital?.gst_percent ?? 0,
      gstAmount,
      total,
    };
  };

  const handleDownload = () => {
    const invoiceNo = savedInvoice ?? "PREVIEW";
    const doc = generateBillPdf(buildPdfData(invoiceNo));
    doc.save(`bill-${invoiceNo}.pdf`);
    toast.success("PDF downloaded");
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload: CreateBillInput = {
        patient_name: pName.trim(),
        patient_phone: pPhone,
        patient_age: parseInt(pAge, 10),
        patient_gender: pGender || undefined,
        patient_address: pAddress.trim() || undefined,
        doctor_id: doctorId !== "none" ? doctorId : null,
        doctor_name:
          doctorId !== "none" ? doctors.find((d) => d.id === doctorId)?.name ?? null : null,
        subtotal,
        gst_percent: hospital?.gst_percent ?? 0,
        gst_amount: gstAmount,
        total,
        items: [
          ...medItems.map((m) => ({ ...m, type: "medicine" as const })),
          ...testItems.map((t) => ({
            type: "test" as const,
            name: t.name,
            quantity: 1,
            unit_price: t.amount,
            amount: t.amount,
          })),
        ],
      };
      const bill = await createBill(payload, user.id);
      setSavedInvoice(bill.invoice_no);
      toast.success(`Bill saved as ${bill.invoice_no}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setPName("");
    setPPhone("");
    setPAge("");
    setPGender("");
    setPAddress("");
    setDoctorId("none");
    setMedicines([{ id: newId(), catalogId: "", name: "", quantity: "1", price: "" }]);
    setTests([{ id: newId(), catalogId: "", name: "", price: "" }]);
    setSavedInvoice(null);
    setPreviewOpen(false);
  };

  const handleViewSavedBill = (billId: string) => {
    setViewingBillData(null);
    setLoadingBillDetail(true);
    setViewingBillId(billId);
    setBillPreviewOpen(true);
  };

  const handleDownloadSavedBill = async (billId: string) => {
    try {
      const { bill, items } = await getBillWithItems(billId);
      const pdfData: BillPdfData = {
        hospital: hospital ?? {
          name: "Meraki Care",
          address: "",
          phone: "",
          email: "",
          gstin: "",
        },
        invoice: {
          no: bill.invoice_no,
          date: new Date(bill.created_at).toLocaleDateString("en-GB"),
          time: new Date(bill.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        },
        patient: {
          name: bill.patient_name,
          phone: bill.patient_phone,
          age: bill.patient_age,
          gender: bill.patient_gender || undefined,
          address: bill.patient_address || undefined,
          doctor: bill.doctor_name || undefined,
        },
        medicines: items.filter((i: any) => i.type === "medicine"),
        tests: items.filter((i: any) => i.type === "test"),
        subtotal: bill.subtotal,
        gstPercent: bill.gst_percent,
        gstAmount: bill.gst_amount,
        total: bill.total,
      };
      const doc = generateBillPdf(pdfData);
      doc.save(`bill-${bill.invoice_no}.pdf`);
      toast.success("PDF downloaded");
    } catch (e) {
      toast.error("Failed to download bill");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 px-3 sm:px-4 py-3 sm:py-6">
      <div className="max-w-7xl mx-auto">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4 sm:mb-6">
          <Button
            onClick={() => setActiveTab("create")}
            variant={activeTab === "create" ? "default" : "outline"}
            className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
          >
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Create Bill</span>
            <span className="sm:hidden">Create</span>
          </Button>
          <Button
            onClick={() => setActiveTab("saved")}
            variant={activeTab === "saved" ? "default" : "outline"}
            className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
          >
            <Archive className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Saved Bills</span>
            <span className="sm:hidden">Saved</span>
          </Button>
        </div>

        {/* Create Bill Tab */}
        {activeTab === "create" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
            {/* Forms Section */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-6">
              {/* Patient */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="shadow-elegant border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-primary text-base sm:text-lg">
                      <User className="h-4 w-4 sm:h-5 sm:w-5" /> Patient Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-xs sm:text-sm">Full Name *</Label>
                      <Input 
                        value={pName} 
                        onChange={(e) => setPName(e.target.value)}
                        className="text-sm sm:text-base h-10 sm:h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm">Phone (10 digits) *</Label>
                      <Input
                        value={pPhone}
                        inputMode="numeric"
                        maxLength={10}
                        onChange={(e) => setPPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="9876543210"
                        className="text-sm sm:text-base h-10 sm:h-11"
                      />
                      {pPhone.length > 0 && pPhone.length < 10 && (
                        <p className="text-xs text-destructive">Phone must be 10 digits</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm">Age *</Label>
                      <Input
                        type="number"
                        min={0}
                        max={120}
                        value={pAge}
                        onChange={(e) => setPAge(e.target.value)}
                        className="text-sm sm:text-base h-10 sm:h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm">Gender</Label>
                      <Select value={pGender} onValueChange={setPGender}>
                        <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-xs sm:text-sm">Referred Doctor (optional)</Label>
                      <Select value={doctorId} onValueChange={setDoctorId}>
                        <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {doctors.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              Dr. {d.name}{d.specialization ? ` — ${d.specialization}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-xs sm:text-sm">Address</Label>
                      <Textarea
                        rows={2}
                        value={pAddress}
                        onChange={(e) => setPAddress(e.target.value)}
                        className="text-sm sm:text-base"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Medicines */}
              <Card className="shadow-elegant border-0">
                <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-primary text-base sm:text-lg">
                    <Pill className="h-4 w-4 sm:h-5 sm:w-5" /> Medicines
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setMedicines((m) => [
                        ...m,
                        { id: newId(), catalogId: "", name: "", quantity: "1", price: "" },
                      ])
                    }
                    disabled={medCatalog.length === 0}
                    className="h-8 sm:h-9 px-2 text-xs sm:text-sm"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {medCatalog.length === 0 && (
                    <p className="text-xs text-muted-foreground p-2 rounded bg-muted/50">
                      No medicines in catalog yet. Ask an admin to add them in Settings → Medicines.
                    </p>
                  )}
                  <AnimatePresence initial={false}>
                    {medicines.map((m, idx) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start sm:items-center p-2 rounded-lg border border-border/50 hover:border-border transition-colors"
                      >
                        <span className="text-xs text-muted-foreground sm:col-span-1">
                          #{idx + 1}
                        </span>
                        <div className="sm:col-span-5">
                          <Label className="text-xs sm:hidden mb-1 block">Medicine</Label>
                          <Select
                            value={m.catalogId}
                            onValueChange={(val) => {
                              const item = medCatalog.find((c) => c.id === val);
                              if (!item) return;
                              setMedicines((meds) =>
                                meds.map((x) =>
                                  x.id === m.id
                                    ? { ...x, catalogId: val, name: item.name, price: String(item.price) }
                                    : x
                                )
                              );
                            }}
                          >
                            <SelectTrigger className="text-xs sm:text-sm h-9 sm:h-10">
                              <SelectValue placeholder="Select medicine" />
                            </SelectTrigger>
                            <SelectContent>
                              {medCatalog.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name} — ₹{c.price.toFixed(2)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="sm:col-span-3">
                          <Label className="text-xs sm:hidden mb-1 block">Quantity</Label>
                          <Input
                            type="number"
                            min={1}
                            placeholder="Qty"
                            value={m.quantity}
                            onChange={(e) =>
                              setMedicines((meds) =>
                                meds.map((x) => (x.id === m.id ? { ...x, quantity: e.target.value } : x))
                              )
                            }
                            className="text-xs sm:text-sm h-9 sm:h-10"
                          />
                        </div>
                        <div className="sm:col-span-2 text-right tabular-nums text-xs sm:text-sm font-semibold text-primary">
                          <span className="sm:hidden text-muted-foreground">₹ </span>
                          {m.price ? `${(parseFloat(m.price) * (parseInt(m.quantity, 10) || 0)).toFixed(2)}` : "—"}
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="sm:col-span-1 text-destructive hover:bg-destructive/10 h-8 w-8 sm:h-9 sm:w-9"
                          onClick={() =>
                            setMedicines((meds) =>
                              meds.length === 1 ? meds : meds.filter((x) => x.id !== m.id)
                            )
                          }
                          disabled={medicines.length === 1}
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Tests */}
              <Card className="shadow-elegant border-0">
                <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-primary text-base sm:text-lg">
                    <FlaskConical className="h-4 w-4 sm:h-5 sm:w-5" /> Medical Tests
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setTests((t) => [...t, { id: newId(), catalogId: "", name: "", price: "" }])
                    }
                    disabled={testCatalog.length === 0}
                    className="h-8 sm:h-9 px-2 text-xs sm:text-sm"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {testCatalog.length === 0 && (
                    <p className="text-xs text-muted-foreground p-2 rounded bg-muted/50">
                      No tests in catalog yet. Ask an admin to add them in Settings → Tests.
                    </p>
                  )}
                  <AnimatePresence initial={false}>
                    {tests.map((t, idx) => (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start sm:items-center p-2 rounded-lg border border-border/50 hover:border-border transition-colors"
                      >
                        <span className="text-xs text-muted-foreground sm:col-span-1">
                          #{idx + 1}
                        </span>
                        <div className="sm:col-span-7">
                          <Label className="text-xs sm:hidden mb-1 block">Test</Label>
                          <Select
                            value={t.catalogId}
                            onValueChange={(val) => {
                              const item = testCatalog.find((c) => c.id === val);
                              if (!item) return;
                              setTests((ts) =>
                                ts.map((x) =>
                                  x.id === t.id
                                    ? { ...x, catalogId: val, name: item.name, price: String(item.price) }
                                    : x
                                )
                              );
                            }}
                          >
                            <SelectTrigger className="text-xs sm:text-sm h-9 sm:h-10">
                              <SelectValue placeholder="Select test" />
                            </SelectTrigger>
                            <SelectContent>
                              {testCatalog.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name} — ₹{c.price.toFixed(2)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="sm:col-span-3 text-right tabular-nums text-xs sm:text-sm font-semibold text-primary">
                          <span className="sm:hidden text-muted-foreground">₹ </span>
                          {t.price ? `${parseFloat(t.price).toFixed(2)}` : "—"}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="col-span-1 text-destructive hover:bg-destructive/10 h-8 w-8 sm:h-9 sm:w-9"
                          onClick={() =>
                            setTests((ts) => (ts.length === 1 ? ts : ts.filter((x) => x.id !== t.id)))
                          }
                          disabled={tests.length === 1}
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 space-y-3 sm:space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="shadow-elegant border-0 overflow-hidden">
                    <div className="gradient-primary h-1.5" />
                    <CardHeader className="pb-2 sm:pb-3">
                      <CardTitle className="text-primary text-base sm:text-lg">Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Row label="Subtotal" value={subtotal} />
                      <Row label={`GST (${hospital?.gst_percent ?? 0}%)`} value={gstAmount} />
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-baseline">
                          <span className="font-semibold text-sm sm:text-base">Grand Total</span>
                          <motion.span
                            key={total}
                            initial={{ scale: 0.9, opacity: 0.5 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="text-xl sm:text-2xl font-bold text-gradient"
                          >
                            ₹{total.toFixed(2)}
                          </motion.span>
                        </div>
                      </div>
                      <Button
                        onClick={handlePreview}
                        className="w-full gradient-accent text-accent-foreground border-0 shadow-elegant hover:shadow-glow text-sm sm:text-base h-10 sm:h-11"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Bill
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
                <p className="text-xs text-muted-foreground text-center">
                  Tip: review the preview before downloading or saving.
                </p>
              </div>
            </div>

            {/* Preview dialog */}
            <Dialog open={previewOpen} onOpenChange={(open) => { if (!open) { setPreviewOpen(false); if (savedInvoice) resetForm(); }}}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto mx-2 rounded-lg">
                <DialogHeader>
                  <DialogTitle className="text-primary text-base sm:text-lg">Bill Preview</DialogTitle>
                </DialogHeader>
                <BillPreview data={buildPdfData(savedInvoice ?? "Preview — not yet saved")} />
                <DialogFooter className="gap-2 flex-col sm:flex-row">
                  {!savedInvoice ? (
                    <>
                      <Button variant="outline" onClick={() => setPreviewOpen(false)} className="text-sm h-9 sm:h-10">
                        Edit
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="gradient-primary text-primary-foreground border-0 text-sm h-9 sm:h-10"
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Confirm & Save
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={resetForm} className="text-sm h-9 sm:h-10">New Bill</Button>
                      <Button
                        onClick={handleDownload}
                        className="gradient-accent text-accent-foreground border-0 text-sm h-9 sm:h-10"
                      >
                        <Download className="h-4 w-4 mr-2" /> Download PDF
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Saved Bill View Dialog */}
            <Dialog open={billPreviewOpen} onOpenChange={(open) => {
              setBillPreviewOpen(open);
              if (!open) {
                setViewingBillId(null);
                setViewingBillData(null);
              }
            }}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto mx-2 rounded-lg">
                <DialogHeader>
                  <DialogTitle className="text-primary text-base sm:text-lg">Bill Preview</DialogTitle>
                </DialogHeader>
                {loadingBillDetail ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : viewingBillData ? (
                  <>
                    <BillPreview data={viewingBillData} />
                    <DialogFooter className="gap-2 flex-col sm:flex-row">
                      <Button variant="outline" onClick={() => setBillPreviewOpen(false)} className="text-sm h-9 sm:h-10">
                        Close
                      </Button>
                      <Button
                        onClick={() => viewingBillId && handleDownloadSavedBill(viewingBillId)}
                        className="gradient-accent text-accent-foreground border-0 text-sm h-9 sm:h-10"
                      >
                        <Download className="h-4 w-4 mr-2" /> Download PDF
                      </Button>
                    </DialogFooter>
                  </>
                ) : null}
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Saved Bills Tab */}
        {activeTab === "saved" && (
          <div className="space-y-3 sm:space-y-4">
            {loadingSavedBills ? (
              <Card className="shadow-elegant border-0 p-8 sm:p-12 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-primary" />
                <p className="text-muted-foreground">Loading saved bills...</p>
              </Card>
            ) : savedBills.length === 0 ? (
              <Card className="shadow-elegant border-0 p-6 sm:p-8 text-center">
                <Archive className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No saved bills yet</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
                {savedBills.map((bill) => (
                  <motion.div
                    key={bill.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-950 rounded-lg border border-border p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base truncate">{bill.patient_name}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">Invoice #{bill.invoice_no}</p>
                        </div>
                        <p className="text-right text-lg sm:text-xl font-bold text-primary whitespace-nowrap">
                          ₹{bill.total.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                        <p>Phone: {bill.patient_phone}</p>
                        <p>Age: {bill.patient_age}</p>
                        <p>Date: {new Date(bill.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewSavedBill(bill.id)}
                          className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                        >
                          <FileText className="h-3 w-3 mr-1" /> View
                        </Button>
                        <Button
                          size="sm"
                          className="gradient-accent text-accent-foreground border-0 flex-1 text-xs sm:text-sm h-8 sm:h-9"
                          onClick={() => handleDownloadSavedBill(bill.id)}
                        >
                          <Download className="h-3 w-3 mr-1" /> Download
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-xs sm:text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">₹{value.toFixed(2)}</span>
    </div>
  );
}

function BillPreview({ data }: { data: BillPdfData }) {
  return (
    <div className="bg-white text-slate-800 rounded-lg overflow-hidden border text-sm sm:text-base">
      <div className="bg-primary text-primary-foreground px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0">
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl font-bold">{data.hospital.name}</h2>
          <p className="text-xs opacity-90 mt-1">
            {[data.hospital.address, data.hospital.phone, data.hospital.email].filter(Boolean).join(" • ")}
          </p>
          {data.hospital.gstin && <p className="text-xs opacity-90">GSTIN: {data.hospital.gstin}</p>}
        </div>
        <div className="text-left sm:text-right">
          <p className="font-bold">TAX INVOICE</p>
          <p className="text-xs opacity-90">#{data.invoice.no}</p>
          <p className="text-xs opacity-90">{data.invoice.date} {data.invoice.time}</p>
        </div>
      </div>
      <div className="h-1 gradient-accent" />
      <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
        <div className="bg-muted/50 rounded-md p-2 sm:p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
          <div><span className="text-muted-foreground">Name:</span> <b>{data.patient.name}</b></div>
          <div><span className="text-muted-foreground">Age/Gender:</span> {data.patient.age} / {data.patient.gender || "-"}</div>
          <div><span className="text-muted-foreground">Phone:</span> {data.patient.phone}</div>
          <div><span className="text-muted-foreground">Doctor:</span> {data.patient.doctor || "—"}</div>
          {data.patient.address && <div className="col-span-1 sm:col-span-2"><span className="text-muted-foreground">Address:</span> {data.patient.address}</div>}
        </div>
        {data.medicines.length > 0 && (
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-primary mb-2">Medicines</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-primary text-primary-foreground"><tr><th className="p-1 sm:p-2 text-left">Item</th><th className="p-1 sm:p-2 text-center">Qty</th><th className="p-1 sm:p-2 text-right">Unit</th><th className="p-1 sm:p-2 text-right">Amount</th></tr></thead>
                <tbody>{data.medicines.map((m, i) => (<tr key={i} className="border-b"><td className="p-1 sm:p-2">{m.name}</td><td className="p-1 sm:p-2 text-center">{m.quantity}</td><td className="p-1 sm:p-2 text-right">₹{m.unit_price.toFixed(2)}</td><td className="p-1 sm:p-2 text-right">₹{m.amount.toFixed(2)}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}
        {data.tests.length > 0 && (
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-primary mb-2">Medical Tests</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-primary text-primary-foreground"><tr><th className="p-1 sm:p-2 text-left">Test</th><th className="p-1 sm:p-2 text-right">Amount</th></tr></thead>
                <tbody>{data.tests.map((t, i) => (<tr key={i} className="border-b"><td className="p-1 sm:p-2">{t.name}</td><td className="p-1 sm:p-2 text-right">₹{t.amount.toFixed(2)}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}
        <div className="flex justify-end">
          <div className="w-full sm:w-64 space-y-1 text-xs sm:text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{data.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>GST ({data.gstPercent}%)</span><span>₹{data.gstAmount.toFixed(2)}</span></div>
            <div className="flex justify-between border-t-2 border-accent pt-2 text-sm sm:text-base font-bold text-primary"><span>Grand Total</span><span>₹{data.total.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
