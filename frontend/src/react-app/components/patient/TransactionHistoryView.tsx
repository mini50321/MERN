import { useState, useEffect } from "react";
import { ArrowLeft, DollarSign, Calendar, CheckCircle, XCircle, Clock, Star } from "lucide-react";
import { useAuth } from "@/react-app/contexts/AuthContext";

interface TransactionHistoryViewProps {
  onBack: () => void;
}

export default function TransactionHistoryView({ onBack }: TransactionHistoryViewProps) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      // Determine which endpoint to use based on user type
      const profile = (user as any)?.profile;
      const isPatient = profile?.account_type === 'patient';
      
      const endpoint = isPatient ? "/api/patient/transactions" : "/api/partner/transactions";
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        
        // Handle different response formats
        if (isPatient) {
          setTransactions(data);
        } else {
          // Partner response includes transactions array and total_earnings
          setTransactions(data.transactions || []);
          setTotalEarnings(data.total_earnings || 0);
        }
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const profile = (user as any)?.profile;
  const isPatient = profile?.account_type === 'patient';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
          <p className="text-sm text-gray-600">
            {isPatient 
              ? "View all your payment transactions" 
              : "View your earnings from completed service orders"}
          </p>
        </div>
      </div>

      {!isPatient && totalEarnings > 0 && (
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white mb-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Total Earnings</p>
              <p className="text-4xl font-bold">₹{totalEarnings.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90 mb-1">Completed Orders</p>
              <p className="text-2xl font-bold">{transactions.length}</p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-200">
          <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Transactions Yet</h3>
          <p className="text-gray-600">
            {isPatient 
              ? "You haven't made any payments yet. Transactions will appear here after booking services."
              : "You haven't completed any service orders yet. Your earnings will appear here after completing orders."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      {isPatient 
                        ? transaction.description
                        : `${transaction.service_category || 'Service'} - ${transaction.service_type}`}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      (transaction.status === "completed" || !isPatient) ? "bg-green-100 text-green-800" :
                      transaction.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                      transaction.status === "failed" ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {(transaction.status === "completed" || !isPatient) ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Completed
                        </span>
                      ) : transaction.status === "pending" ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      ) : transaction.status === "failed" ? (
                        <span className="flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Failed
                        </span>
                      ) : (
                        transaction.status?.charAt(0).toUpperCase() + transaction.status?.slice(1)
                      )}
                    </span>
                  </div>
                  {!isPatient && transaction.patient_name && (
                    <p className="text-sm text-gray-600">Patient: {transaction.patient_name}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    ₹{(transaction.quoted_price || transaction.amount || 0)}
                  </p>
                  <p className="text-xs text-gray-500">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {new Date(transaction.completed_at || transaction.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Order ID</p>
                  <p className="font-semibold text-gray-900">#{transaction.id}</p>
                </div>
                {!isPatient && transaction.partner_rating && (
                  <div>
                    <p className="text-gray-600">Patient Rating</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <p className="font-semibold text-gray-900">{transaction.partner_rating}/5</p>
                    </div>
                  </div>
                )}
                {isPatient && transaction.payment_method && (
                  <div>
                    <p className="text-gray-600">Payment Method</p>
                    <p className="font-semibold text-gray-900 capitalize">{transaction.payment_method}</p>
                  </div>
                )}
              </div>

              {!isPatient && transaction.equipment_name && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">Equipment: {transaction.equipment_name}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
