"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { eurosToCents } from "@/lib/money";
import { PlusIcon } from "lucide-react";
interface ManualDonationDialogProps {
  funds: { id: string; name: string; icon?: string | null }[];
}

export function ManualDonationDialog({ funds }: ManualDonationDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [fundId, setFundId] = useState(funds[0]?.id ?? "");
  const [method, setMethod] = useState<"cash" | "bank_transfer">("cash");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  function resetForm() {
    setDonorName("");
    setDonorEmail("");
    setAmount("");
    setFundId(funds[0]?.id ?? "");
    setMethod("cash");
    setDate(new Date().toISOString().split("T")[0]);
    setNotes("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      toast.error("Voer een geldig bedrag in");
      return;
    }

    if (!fundId) {
      toast.error("Selecteer een fonds");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donor_name: donorName.trim() || undefined,
          donor_email: donorEmail.trim() || undefined,
          amount: eurosToCents(amountNum),
          fund_id: fundId,
          method,
          date,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Er is iets misgegaan");
        return;
      }

      toast.success("Donatie toegevoegd");
      setOpen(false);
      resetForm();
      router.refresh();
    } catch {
      toast.error("Er is iets misgegaan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon className="size-4 mr-1" />
        Handmatige donatie
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Handmatige donatie toevoegen</DialogTitle>
            <DialogDescription>
              Voeg een contante of overgeboekte donatie handmatig toe.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="donor-name">Naam donateur (optioneel)</Label>
              <Input
                id="donor-name"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="Naam"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="donor-email">E-mail donateur (optioneel)</Label>
              <Input
                id="donor-email"
                type="email"
                inputMode="email"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                placeholder="email@voorbeeld.nl"
                autoComplete="email"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Bedrag (€) *</Label>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="25.00"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fund">Fonds *</Label>
              <select
                id="fund"
                className="flex h-11 md:h-8 w-full rounded-lg border border-input bg-transparent px-3 md:px-2.5 py-2 text-base md:text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={fundId}
                onChange={(e) => setFundId(e.target.value)}
                required
              >
                {funds.map((fund) => (
                  <option key={fund.id} value={fund.id}>
                    {fund.icon ? `${fund.icon} ` : ""}
                    {fund.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label>Methode *</Label>
              <RadioGroup
                value={method}
                onValueChange={(v) => setMethod(v as "cash" | "bank_transfer")}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="cash" id="method-cash" />
                    <Label htmlFor="method-cash" className="font-normal">
                      Contant
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="bank_transfer" id="method-bank" />
                    <Label htmlFor="method-bank" className="font-normal">
                      Overboeking
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date">Datum</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notities (optioneel)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Bijv. inzameling vrijdaggebed"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Bezig..." : "Toevoegen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
