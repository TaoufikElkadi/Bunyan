"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import type { Mosque, Locale } from "@/types";
import { Loader2Icon, AlertTriangleIcon } from "lucide-react";

const LANGUAGES: { value: Locale; label: string }[] = [
  { value: "nl", label: "Nederlands" },
  { value: "en", label: "English" },
  { value: "tr", label: "Turkce" },
  { value: "ar", label: "العربية" },
];

interface Props {
  mosque: Mosque;
  isAdmin: boolean;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function MosqueDetailsCard({ mosque, isAdmin }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(mosque.name);
  const [slug, setSlug] = useState(mosque.slug);
  const [city, setCity] = useState(mosque.city ?? "");
  const [address, setAddress] = useState(mosque.address ?? "");
  const [iban, setIban] = useState(mosque.iban ?? "");
  const [welcomeMsg, setWelcomeMsg] = useState(mosque.welcome_msg ?? "");
  const [language, setLanguage] = useState<Locale>(mosque.language);

  const slugChanged = slug !== mosque.slug;
  const slugValid = slug.length >= 2 && SLUG_RE.test(slug);

  const isDirty =
    name !== mosque.name ||
    slugChanged ||
    city !== (mosque.city ?? "") ||
    address !== (mosque.address ?? "") ||
    iban !== (mosque.iban ?? "") ||
    welcomeMsg !== (mosque.welcome_msg ?? "") ||
    language !== mosque.language;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;

    if (slugChanged && !slugValid) {
      toast.error(
        "Ongeldige slug (alleen kleine letters, cijfers en streepjes)",
      );
      return;
    }

    if (slugChanged) {
      const confirmed = window.confirm(
        "Let op: de URL van uw donatiepagina verandert.\n\n" +
          `Huidige URL: /doneren/${mosque.slug}\n` +
          `Nieuwe URL: /doneren/${slug}\n\n` +
          "Bestaande links en QR-codes blijven werken via een doorverwijzing.\n" +
          "Weet u het zeker?",
      );
      if (!confirmed) return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slugChanged ? slug : undefined,
          city: city.trim() || null,
          address: address.trim() || null,
          welcome_msg: welcomeMsg.trim() || null,
          iban: iban.trim() || null,
          language,
          // Preserve existing values for fields managed by other cards
          primary_color: mosque.primary_color,
          anbi_status: mosque.anbi_status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Er is iets misgegaan");
        return;
      }

      toast.success("Moskee gegevens opgeslagen");
      router.refresh();
    } catch {
      toast.error("Er is iets misgegaan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Moskee gegevens</CardTitle>
        <CardDescription>Algemene informatie over uw moskee</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="mosque-name">Naam *</Label>
              <Input
                id="mosque-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={!isAdmin}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mosque-city">Stad</Label>
              <Input
                id="mosque-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!isAdmin}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mosque-address">Adres</Label>
            <Input
              id="mosque-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={!isAdmin}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mosque-iban">IBAN (bankrekening)</Label>
            <Input
              id="mosque-iban"
              value={iban}
              onChange={(e) => setIban(e.target.value.toUpperCase())}
              placeholder="NL00 BANK 0000 0000 00"
              disabled={!isAdmin}
            />
            <p className="text-xs text-muted-foreground">
              Wordt getoond aan donateurs bij periodieke gift overeenkomsten
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mosque-welcome">
              Welkomstbericht (donatiepagina)
            </Label>
            <Textarea
              id="mosque-welcome"
              value={welcomeMsg}
              onChange={(e) => setWelcomeMsg(e.target.value)}
              placeholder="Welkom bij onze moskee. Uw donatie maakt het verschil."
              rows={3}
              disabled={!isAdmin}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mosque-language">Taal</Label>
            <select
              id="mosque-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Locale)}
              disabled={!isAdmin}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mosque-slug">Slug (URL)</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/doneren/</span>
              <Input
                id="mosque-slug"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                disabled={!isAdmin}
                className="font-mono"
                placeholder="mijn-moskee"
              />
            </div>
            {slugChanged && !slugValid && (
              <p className="text-xs text-destructive">
                Minimaal 2 tekens, alleen kleine letters, cijfers en streepjes
              </p>
            )}
            {slugChanged && slugValid && (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 dark:border-amber-900 dark:bg-amber-950">
                <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  De URL wijzigt naar{" "}
                  <span className="font-mono font-medium">/doneren/{slug}</span>
                  . Bestaande links en QR-codes blijven werken via een
                  doorverwijzing.
                </p>
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={loading || !isDirty || (slugChanged && !slugValid)}
              >
                {loading && <Loader2Icon className="size-4 animate-spin" />}
                {loading ? "Opslaan..." : "Opslaan"}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
