'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import type { Mosque } from '@/types'
import { Loader2Icon, UploadIcon, ImageIcon } from 'lucide-react'

const COLOR_SWATCHES = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
]

const HEX_RE = /^#[0-9a-fA-F]{6}$/

interface Props {
  mosque: Mosque
  isAdmin: boolean
}

export function BrandingCard({ mosque, isAdmin }: Props) {
  const router = useRouter()
  const [primaryColor, setPrimaryColor] = useState(mosque.primary_color)
  const [colorSaving, setColorSaving] = useState(false)
  const [logoUrl, setLogoUrl] = useState(mosque.logo_url)
  const [bannerUrl, setBannerUrl] = useState(mosque.banner_url)
  const [logoUploading, setLogoUploading] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const colorDirty = primaryColor !== mosque.primary_color
  const colorValid = HEX_RE.test(primaryColor)

  async function handleColorSave() {
    if (!isAdmin || !colorValid) return
    setColorSaving(true)

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: mosque.name,
          primary_color: primaryColor,
          city: mosque.city,
          address: mosque.address,
          welcome_msg: mosque.welcome_msg,
          language: mosque.language,
          anbi_status: mosque.anbi_status,
          rsin: mosque.rsin,
          kvk: mosque.kvk,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Er is iets misgegaan')
        return
      }

      toast.success('Kleur opgeslagen')
      router.refresh()
    } catch {
      toast.error('Er is iets misgegaan')
    } finally {
      setColorSaving(false)
    }
  }

  async function handleFileUpload(file: File, type: 'logo' | 'banner') {
    const setUploading = type === 'logo' ? setLogoUploading : setBannerUploading
    const setUrl = type === 'logo' ? setLogoUrl : setBannerUrl
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const res = await fetch('/api/settings/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Upload mislukt')
        return
      }

      setUrl(data.url)
      toast.success(type === 'logo' ? 'Logo geupload' : 'Banner geupload')
      router.refresh()
    } catch {
      toast.error('Upload mislukt')
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file, type)
    }
    // Reset input so re-uploading same file triggers change
    e.target.value = ''
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding</CardTitle>
        <CardDescription>Pas het uiterlijk van uw donatiepagina aan</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary color */}
        <div className="space-y-3">
          <Label>Primaire kleur</Label>
          <div className="flex flex-wrap gap-2">
            {COLOR_SWATCHES.map((color) => (
              <button
                key={color}
                type="button"
                disabled={!isAdmin}
                onClick={() => setPrimaryColor(color)}
                className="size-8 rounded-full border-2 transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: color,
                  borderColor: primaryColor === color ? 'var(--foreground)' : 'transparent',
                }}
                title={color}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              disabled={!isAdmin}
              className="h-8 w-10 cursor-pointer rounded border border-input p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              pattern="^#[0-9a-fA-F]{6}$"
              placeholder="#10b981"
              className="w-28 font-mono"
              disabled={!isAdmin}
            />
            {isAdmin && colorDirty && (
              <Button
                size="sm"
                onClick={handleColorSave}
                disabled={colorSaving || !colorValid}
              >
                {colorSaving && <Loader2Icon className="size-3 animate-spin" />}
                Opslaan
              </Button>
            )}
          </div>
          {!colorValid && primaryColor !== '' && (
            <p className="text-xs text-destructive">Gebruik formaat #RRGGBB</p>
          )}
        </div>

        {/* Logo upload */}
        <div className="space-y-3">
          <Label>Logo</Label>
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
              {logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={logoUrl}
                  alt="Moskee logo"
                  className="size-full object-contain"
                />
              ) : (
                <ImageIcon className="size-6 text-muted-foreground" />
              )}
            </div>
            {isAdmin && (
              <div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  onChange={(e) => handleFileChange(e, 'logo')}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading}
                >
                  {logoUploading ? (
                    <Loader2Icon className="size-3 animate-spin" />
                  ) : (
                    <UploadIcon className="size-3" />
                  )}
                  {logoUploading ? 'Uploaden...' : 'Logo uploaden'}
                </Button>
                <p className="mt-1 text-xs text-muted-foreground">
                  JPG, PNG, WebP of SVG. Max 2MB.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Banner upload */}
        <div className="space-y-3">
          <Label>Banner</Label>
          <div className="space-y-2">
            <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded-lg border bg-muted">
              {bannerUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={bannerUrl}
                  alt="Moskee banner"
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageIcon className="size-6 text-muted-foreground" />
              )}
            </div>
            {isAdmin && (
              <div>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  onChange={(e) => handleFileChange(e, 'banner')}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={bannerUploading}
                >
                  {bannerUploading ? (
                    <Loader2Icon className="size-3 animate-spin" />
                  ) : (
                    <UploadIcon className="size-3" />
                  )}
                  {bannerUploading ? 'Uploaden...' : 'Banner uploaden'}
                </Button>
                <p className="mt-1 text-xs text-muted-foreground">
                  Aanbevolen: 1200x400px. JPG, PNG, WebP of SVG. Max 2MB.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
