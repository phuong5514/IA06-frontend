import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { apiClient } from '../config/api';
import { useTableSession } from '../context/TableSessionContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QRScannerModal({ isOpen, onClose, onSuccess }: QRScannerModalProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { startSession } = useTableSession();

  useEffect(() => {
    if (!isOpen) {
      stopScanning();
      return;
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const startScanning = async () => {
    setError(null);
    setScanning(true);

    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // QR code successfully scanned
          await handleQRCodeScanned(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors (they happen continuously during scanning)
          console.debug('QR scan error:', errorMessage);
        }
      );
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      setError('Failed to start camera. Please ensure camera permissions are granted.');
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setScanning(false);
  };

  const handleQRCodeScanned = async (qrToken: string) => {
    setVerifying(true);
    setError(null);

    try {
      // Stop scanning immediately to prevent multiple scans
      await stopScanning();

      // Extract token from the QR code data
      // The QR code might contain a full URL or just the token
      let token = qrToken;
      
      // If it's a URL, extract the token from it
      if (qrToken.includes('/') || qrToken.includes('?')) {
        const url = new URL(qrToken.startsWith('http') ? qrToken : `${API_BASE_URL}${qrToken}`);
        token = url.pathname.split('/').pop() || qrToken;
      }

      // Verify the QR token with the backend
      const response = await apiClient.get(`/tables/verify/${token}`);

      if (response.data && response.data.table_id) {
        // Start the table session
        startSession(response.data.table_id, response.data.table_number);

        // Show success message
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 500);
      } else {
        setError('Invalid QR code response from server.');
        setVerifying(false);
      }
    } catch (err: any) {
      console.error('Error verifying QR code:', err);
      const errorMsg = err.response?.data?.message || 'Failed to verify QR code. Please try again.';
      setError(errorMsg);
      setVerifying(false);
    }
  };

  const handleManualInput = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const token = formData.get('token') as string;

    if (!token) {
      setError('Please enter a QR token.');
      return;
    }

    await handleQRCodeScanned(token);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Scan Table QR Code</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Verifying State */}
        {verifying && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Verifying table...</p>
          </div>
        )}

        {/* Scanner or Start Button */}
        {!verifying && (
          <>
            <div className="mb-4">
              {!scanning ? (
                <div className="text-center py-8">
                  <svg
                    className="w-20 h-20 text-indigo-600 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                  <p className="text-gray-600 mb-4">
                    Point your camera at the table's QR code to start your ordering session.
                  </p>
                  <button
                    onClick={startScanning}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Start Camera
                  </button>
                </div>
              ) : (
                <div>
                  <div id="qr-reader" className="rounded-lg overflow-hidden border-2 border-indigo-600"></div>
                  <button
                    onClick={stopScanning}
                    className="mt-4 w-full bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Stop Camera
                  </button>
                </div>
              )}
            </div>

            {/* Manual Input Option */}
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">Or enter QR token manually:</p>
              <form onSubmit={handleManualInput} className="flex gap-2">
                <input
                  type="text"
                  name="token"
                  placeholder="Enter QR token"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  Verify
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
