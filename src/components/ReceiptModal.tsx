'use client'

interface ReceiptData {
  vehicleNumber: string
  vehicleType: string
  slotNumber: string
  entryTime: string
  exitTime: string
  duration: number
  billingType: string
  amount: number
  overstay: boolean
}

interface ReceiptModalProps {
  receipt: ReceiptData
  onClose: () => void
}

export default function ReceiptModal({ receipt, onClose }: ReceiptModalProps) {
  const handlePrint = () => window.print()

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
        <div className="p-8" id="receipt-content">
          {/* Header */}
          <div className="text-center mb-6 border-b-2 border-dashed border-gray-200 pb-6">
            <div className="text-4xl mb-2">🅿️</div>
            <h2 className="text-2xl font-bold text-gray-900">Parking Receipt</h2>
            <p className="text-sm text-gray-500">Mall Parking Management System</p>
          </div>

          {/* Details */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Vehicle</span>
              <span className="font-bold text-gray-900">{receipt.vehicleNumber}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Type</span>
              <span className="font-bold text-gray-900">{receipt.vehicleType}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Slot</span>
              <span className="font-bold text-gray-900">{receipt.slotNumber}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Entry Time</span>
              <span className="font-bold text-gray-900">
                {new Date(receipt.entryTime).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Exit Time</span>
              <span className="font-bold text-gray-900">
                {new Date(receipt.exitTime).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Duration</span>
              <span className="font-bold text-gray-900">{receipt.duration} hour(s)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Billing Type</span>
              <span className="font-bold text-gray-900">{receipt.billingType}</span>
            </div>
            {receipt.overstay && (
              <div className="flex justify-between py-2">
                <span className="text-red-600 font-semibold">Overstay Fee</span>
                <span className="text-red-600 font-bold">Included</span>
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-center text-white mb-6">
            <p className="text-sm opacity-80 mb-1">Total Amount Paid</p>
            <p className="text-4xl font-bold">₹{receipt.amount}</p>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-400">
            <p>Thank you for parking with us!</p>
            <p className="mt-1">Have a great day! 🎉</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 p-6 pt-0 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all font-semibold shadow-lg"
          >
            🖨️ Print Receipt
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
