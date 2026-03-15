'use client'

import { useRef, useCallback } from 'react'
import SignatureCanvas from 'react-signature-canvas'

type Props = {
  onSign: (base64Png: string) => void
  onClear: () => void
  disabled?: boolean
}

export function SignaturePad({ onSign, onClear, disabled }: Props) {
  const canvasRef = useRef<SignatureCanvas>(null)

  const handleEnd = useCallback(() => {
    if (canvasRef.current && !canvasRef.current.isEmpty()) {
      onSign(canvasRef.current.toDataURL('image/png'))
    }
  }, [onSign])

  function handleClear() {
    canvasRef.current?.clear()
    onClear()
  }

  return (
    <div>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          border: '1px solid #EDE8DF',
          background: '#FFFDF8',
          touchAction: 'none',
          opacity: disabled ? 0.5 : 1,
          pointerEvents: disabled ? 'none' : 'auto',
        }}
      >
        <SignatureCanvas
          ref={canvasRef}
          penColor="#1B2541"
          canvasProps={{
            className: 'w-full',
            height: 160,
            style: { width: '100%', height: 160 },
          }}
          onEnd={handleEnd}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[11px] font-medium" style={{ color: '#9B8E7B' }}>
          Teken uw handtekening hierboven
        </span>
        <button
          type="button"
          onClick={handleClear}
          className="text-[11px] font-medium px-2 py-1 rounded-lg transition-colors hover:bg-[#F7F3EC]"
          style={{ color: '#9B8E7B' }}
        >
          Wissen
        </button>
      </div>
    </div>
  )
}
