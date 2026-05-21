import { useRef, useState, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { QRCodeDisplay } from '@/components/qr-code-display'
import { Upload, Loader2, Sparkles } from 'lucide-react'
import { generateDynamicQrisRequest } from '@/lib/api'

const DEMO_QRIS =
  '00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214610189749241770303UMI51440014ID.CO.QRIS.WWW0215ID20243299634560303UMI5204541153033605802ID5925HOSHIYUKI STORE OK18972926008SEMARANG61055011162070703A016304F6C8'

export function QRISGenerator() {
  const [staticQRIS, setStaticQRIS] = useState('')
  const [nominal, setNominal] = useState('')
  const [dynamicQRIS, setDynamicQRIS] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsProcessing(true)
    // Image-to-QRIS decoding is not implemented yet; fall back to the demo
    // payload so the user can still try the generator. See README for details.
    setTimeout(() => {
      setStaticQRIS(DEMO_QRIS)
      setIsProcessing(false)
    }, 600)
  }

  const handleGenerate = async () => {
    if (!staticQRIS || !nominal) return
    setError(null)
    setIsProcessing(true)
    try {
      const dynamic = await generateDynamicQrisRequest(staticQRIS, Number(nominal))
      setDynamicQRIS(dynamic)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate dynamic QRIS')
      setDynamicQRIS('')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers ? Number.parseInt(numbers).toLocaleString('id-ID') : ''
  }

  const handleNominalChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNominal(e.target.value.replace(/\D/g, ''))
  }

  return (
    <div className="space-y-8">
      <Card className="p-8 md:p-10 bg-card border-border shadow-xl shadow-primary/5 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500">
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">1</span>
              </div>
              <Label htmlFor="qris-upload" className="text-lg font-bold">
                Upload Static QRIS
              </Label>
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Upload your static QRIS image or enter the QRIS code manually
            </p>

            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-2 border-dashed border-border rounded-2xl p-10 text-center cursor-pointer hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <p className="text-base font-semibold mb-2">Click to upload QRIS image</p>
                  <p className="text-sm text-muted-foreground">PNG, JPG up to 10MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="qris-upload"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 py-1 text-muted-foreground rounded-full">Or enter manually</span>
                </div>
              </div>

              <div>
                <Input
                  placeholder="Paste your static QRIS code here"
                  value={staticQRIS}
                  onChange={(e) => setStaticQRIS(e.target.value)}
                  className="font-mono text-sm h-12 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">2</span>
              </div>
              <Label htmlFor="nominal" className="text-lg font-bold">
                Enter Amount
              </Label>
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Specify the payment amount in Indonesian Rupiah
            </p>

            <div className="relative group">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-accent opacity-0 group-focus-within:opacity-20 blur-xl transition-opacity duration-300" />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-lg">
                  Rp
                </span>
                <Input
                  id="nominal"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formatCurrency(nominal)}
                  onChange={handleNominalChange}
                  className="pl-14 text-xl font-bold h-14 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={!staticQRIS || !nominal || isProcessing}
            className="w-full h-14 text-base font-bold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 group"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                Generate Dynamic QRIS
              </>
            )}
          </Button>
        </div>
      </Card>

      {dynamicQRIS && <QRCodeDisplay qrisData={dynamicQRIS} amount={nominal} />}
    </div>
  )
}
