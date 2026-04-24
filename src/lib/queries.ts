// All Supabase queries for the Meraki Care billing system live here.
// Components must import from this file only — never call supabase directly.
import { supabase } from "@/integrations/supabase/client";

// ==================== AUTH ====================
export async function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpFirstAdmin(email: string, password: string, fullName: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/billing`,
      data: { full_name: fullName },
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function sendPasswordReset(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
}

export async function updatePassword(newPassword: string) {
  return supabase.auth.updateUser({ password: newPassword });
}

export async function getSession() {
  return supabase.auth.getSession();
}

// ==================== SIGNUP LOCK ====================
export async function getSignupLocked(): Promise<boolean> {
  const { data } = await supabase.from("signup_lock").select("locked").eq("id", 1).maybeSingle();
  return data?.locked ?? false;
}

// ==================== ROLES ====================
export async function getMyRole(userId: string): Promise<"admin" | "staff" | null> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .order("role", { ascending: true });
  if (!data || data.length === 0) return null;
  // admin sorts before staff alphabetically — prefer admin if present
  if (data.some((r) => r.role === "admin")) return "admin";
  return data[0].role as "admin" | "staff";
}

// ==================== PROFILE ====================
export async function getProfile(userId: string) {
  return supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
}

// ==================== HOSPITAL SETTINGS ====================
export async function getHospitalSettings() {
  const { data, error } = await supabase
    .from("hospital_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateHospitalSettings(payload: {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  gst_percent: number;
}) {
  return supabase
    .from("hospital_settings")
    .update({
      name: payload.name,
      address: payload.address,
      phone: payload.phone,
      email: payload.email,
      gstin: payload.gstin,
      gst_percent: payload.gst_percent,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.id);
}

// ==================== DOCTORS ====================
export async function getDoctors() {
  const { data, error } = await supabase
    .from("doctors")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addDoctor(payload: { name: string; specialization?: string; phone?: string }) {
  return supabase.from("doctors").insert(payload);
}

export async function deleteDoctor(id: string) {
  return supabase.from("doctors").delete().eq("id", id);
}

// ==================== STAFF ====================
export async function listStaff() {
  // Profiles + their roles
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const { data: roles } = await supabase.from("user_roles").select("user_id, role");
  return (profiles ?? []).map((p) => ({
    ...p,
    role: (roles?.find((r) => r.user_id === p.id)?.role ?? "staff") as "admin" | "staff",
  }));
}

export async function updateUserRole(userId: string, role: "admin" | "staff") {
  // delete existing roles for this user, insert new one
  await supabase.from("user_roles").delete().eq("user_id", userId);
  return supabase.from("user_roles").insert({ user_id: userId, role });
}

// ==================== BILLS ====================
export interface BillItemInput {
  type: "medicine" | "test";
  name: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface CreateBillInput {
  patient_name: string;
  patient_phone: string;
  patient_age: number;
  patient_gender?: string;
  patient_address?: string;
  doctor_id?: string | null;
  doctor_name?: string | null;
  subtotal: number;
  gst_percent: number;
  gst_amount: number;
  total: number;
  items: BillItemInput[];
}

export async function createBill(input: CreateBillInput, userId: string) {
  const { items, ...billData } = input;
  const { data: bill, error: billError } = await supabase
    .from("bills")
    .insert([{ ...billData, created_by: userId, invoice_no: "" }])
    .select()
    .single();
  if (billError) throw billError;

  if (items.length > 0) {
    const { error: itemsError } = await supabase
      .from("bill_items")
      .insert(items.map((it) => ({ ...it, bill_id: bill.id })));
    if (itemsError) throw itemsError;
  }
  return bill;
}

// ==================== MEDICINES CATALOG ====================
export async function getMedicinesCatalog() {
  const { data, error } = await supabase
    .from("medicines")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addMedicine(payload: { name: string; price: number }) {
  return supabase.from("medicines").insert(payload);
}

export async function updateMedicine(id: string, payload: { name: string; price: number }) {
  return supabase.from("medicines").update(payload).eq("id", id);
}

export async function deleteMedicine(id: string) {
  return supabase.from("medicines").delete().eq("id", id);
}

// ==================== TESTS CATALOG ====================
export async function getTestsCatalog() {
  const { data, error } = await supabase
    .from("tests")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addTest(payload: { name: string; price: number }) {
  return supabase.from("tests").insert(payload);
}

export async function updateTest(id: string, payload: { name: string; price: number }) {
  return supabase.from("tests").update(payload).eq("id", id);
}

export async function deleteTest(id: string) {
  return supabase.from("tests").delete().eq("id", id);
}
