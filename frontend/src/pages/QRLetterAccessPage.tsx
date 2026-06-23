import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, AlertCircle } from 'lucide-react';
import { lettersApi } from '../services/api';
import { LetterDocument } from '../components/letters/LetterDocument';
import { formatSeplReferenceNumber } from '../utils/helpers';

interface LetterAccessResponse {
  success: boolean;
  letter?: {
    id: number;
    serial_number: number;
    letter_number: string;
    subject: string;
    letter_date: string;
    status: string;
    body_html: string;
    letterhead_html: string;
    footer_html: string;
    approved_signature_html?: string | null;
    qr_code_data?: string | null;
  };
  error?: string;
}

export function QRLetterAccessPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const previewRef = useRef<HTMLDivElement>(null);
  const [letter, setLetter] = useState<LetterAccessResponse['letter'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyAndLoadLetter = async () => {
      if (!token) {
        setError('Invalid QR code token.');
        setLoading(false);
        return;
      }

      try {
        const response = await lettersApi.verifyQRToken(token);
        const data = response.data as LetterAccessResponse;
        if (data.success && data.letter) {
          setLetter(data.letter);
          setError(null);
        } else {
          setError(data.error || 'Failed to verify QR code.');
        }
      } catch (err: any) {
        console.error('Error verifying QR token:', err);
        setError('Failed to verify QR code. The code may have expired.');
      } finally {
        setLoading(false);
      }
    };

    verifyAndLoadLetter();
  }, [token, navigate]);


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Verified Letter</h1>
              <p className="text-xs text-gray-500">Scanned via QR code</p>
            </div>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Verifying QR code...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl shadow-sm p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-red-900 mb-2">Access Denied</h2>
                <p className="text-red-700">{error}</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-100 border border-red-300 rounded-lg p-3">
                  <Lock className="w-4 h-4" />
                  <span>This letter is protected and can only be accessed with a valid QR code.</span>
                </div>
              </div>
            </div>
          </div>
        ) : letter ? (
          <>
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <div className="flex-shrink-0">
                <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900">Public QR Access Verified</p>
                <p className="text-sm text-blue-700 mt-1">
                  This letter is publicly accessible via a valid QR code. Your access is being logged for audit purposes.
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Letter Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Reference Number</div>
                  <div className="text-sm font-medium text-gray-900">{formatSeplReferenceNumber(letter.letter_number) || 'Auto-generated'}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Date</div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(letter.letter_date).toLocaleDateString('en-GB')}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Status</div>
                  <div className="text-sm font-medium">
                    <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-medium text-xs">
                      Approved
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Subject</div>
                  <div className="text-sm font-medium text-gray-900 truncate">{letter.subject}</div>
                </div>
              </div>
            </div>

            <div className="relative bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div style={{ maxHeight: '420px', overflow: 'hidden' }}>
                <div style={{ pointerEvents: 'none', userSelect: 'none' }}>
                  <LetterDocument
                    ref={previewRef}
                    subject={letter.subject}
                    letterDate={letter.letter_date}
                    serialNumber={letter.serial_number}
                    letterNumber={letter.letter_number}
                    bodyHtml={letter.body_html}
                    letterheadHtml={letter.letterhead_html}
                    footerHtml={letter.footer_html}
                    approvedSignatureHtml={letter.approved_signature_html}
                    qrCodeData={letter.qr_code_data}
                    fitViewport
                  />
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: '200px',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 30%, rgba(255,255,255,0.92) 60%, rgba(255,255,255,1) 100%)',
                    backdropFilter: 'blur(3px)',
                    WebkitBackdropFilter: 'blur(3px)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
              <div className="flex flex-col items-center justify-center gap-2 py-6 border-t border-amber-100 bg-amber-50">
                <Lock className="w-6 h-6 text-amber-600" />
                <p className="text-sm font-semibold text-amber-900">Full letter is restricted</p>
                <p className="text-xs text-amber-700">This QR scan only confirms authenticity. Full content is not available.</p>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
